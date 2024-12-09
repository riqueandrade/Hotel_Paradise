const db = require('../database/db');

class ConfiguracaoController {
    async getConfiguracoes(req, res) {
        try {
            const [configuracoes] = await db.query('SELECT * FROM configuracoes WHERE id = 1');
            
            if (configuracoes.length === 0) {
                // Se não existir, cria as configurações padrão
                await db.query(`
                    INSERT INTO configuracoes (
                        nome_hotel, 
                        endereco, 
                        telefone, 
                        email_contato, 
                        notificacoes
                    ) VALUES (?, ?, ?, ?, ?)`,
                    [
                        'Hotel Paradise',
                        '',
                        '',
                        '',
                        JSON.stringify({
                            reservas: true,
                            checkIn: true,
                            checkOut: true,
                            produtos: true
                        })
                    ]
                );
                
                const [novasConfiguracoes] = await db.query('SELECT * FROM configuracoes WHERE id = 1');
                return res.json(novasConfiguracoes[0]);
            }

            res.json(configuracoes[0]);
        } catch (error) {
            console.error('Erro ao buscar configurações:', error);
            res.status(500).json({ error: 'Erro ao buscar configurações' });
        }
    }

    async atualizarConfiguracoes(req, res) {
        const { nomeHotel, endereco, telefone, emailContato, notificacoes } = req.body;

        try {
            await db.query(`
                UPDATE configuracoes 
                SET 
                    nome_hotel = ?,
                    endereco = ?,
                    telefone = ?,
                    email_contato = ?,
                    notificacoes = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = 1`,
                [
                    nomeHotel,
                    endereco,
                    telefone,
                    emailContato,
                    JSON.stringify(notificacoes)
                ]
            );

            res.json({ message: 'Configurações atualizadas com sucesso' });
        } catch (error) {
            console.error('Erro ao atualizar configurações:', error);
            res.status(500).json({ error: 'Erro ao atualizar configurações' });
        }
    }

    async fazerBackup(req, res) {
        try {
            // Implementar lógica de backup do banco de dados
            // Este é apenas um exemplo básico
            const tables = ['usuarios', 'quartos', 'clientes', 'reservas', 'produtos', 'configuracoes'];
            let backup = '';

            for (const table of tables) {
                const [rows] = await db.query(`SELECT * FROM ${table}`);
                backup += `-- Backup da tabela ${table}\n`;
                backup += `INSERT INTO ${table} VALUES\n`;
                backup += rows.map(row => `(${Object.values(row).map(value => 
                    typeof value === 'string' ? `'${value.replace(/'/g, "''")}'` : value
                ).join(', ')})`).join(',\n');
                backup += ';\n\n';
            }

            res.setHeader('Content-Type', 'application/sql');
            res.setHeader('Content-Disposition', `attachment; filename=backup_${new Date().toISOString().split('T')[0]}.sql`);
            res.send(backup);
        } catch (error) {
            console.error('Erro ao fazer backup:', error);
            res.status(500).json({ error: 'Erro ao fazer backup' });
        }
    }

    async restaurarBackup(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'Nenhum arquivo enviado' });
            }

            const backup = req.file.buffer.toString();
            const queries = backup.split(';').filter(query => query.trim());

            for (const query of queries) {
                if (query.trim()) {
                    await db.query(query);
                }
            }

            res.json({ message: 'Backup restaurado com sucesso' });
        } catch (error) {
            console.error('Erro ao restaurar backup:', error);
            res.status(500).json({ error: 'Erro ao restaurar backup' });
        }
    }
}

module.exports = new ConfiguracaoController(); 