const db = require('../database/db');
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class ConfiguracaoController {
    static async getConfiguracoes(req, res) {
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
                        'Rua Principal, 123 - Centro',
                        '(11) 1234-5678',
                        'contato@hotelparadise.com',
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

    static async atualizarConfiguracoes(req, res) {
        const { nome_hotel, endereco, telefone, email_contato, notificacoes } = req.body;

        try {
            // Verifica se já existe uma configuração
            const [configuracoes] = await db.query('SELECT id FROM configuracoes WHERE id = 1');
            
            if (configuracoes.length === 0) {
                // Se não existir, cria uma nova
                await db.query(`
                    INSERT INTO configuracoes (
                        nome_hotel, 
                        endereco, 
                        telefone, 
                        email_contato, 
                        notificacoes
                    ) VALUES (?, ?, ?, ?, ?)`,
                    [
                        nome_hotel,
                        endereco,
                        telefone,
                        email_contato,
                        JSON.stringify(notificacoes)
                    ]
                );
            } else {
                // Se existir, atualiza
                await db.query(`
                    UPDATE configuracoes 
                    SET 
                        nome_hotel = ?,
                        endereco = ?,
                        telefone = ?,
                        email_contato = ?,
                        notificacoes = ?
                    WHERE id = 1`,
                    [
                        nome_hotel,
                        endereco,
                        telefone,
                        email_contato,
                        JSON.stringify(notificacoes)
                    ]
                );
            }

            // Retorna as configurações atualizadas
            const [configuracoesAtualizadas] = await db.query('SELECT * FROM configuracoes WHERE id = 1');
            res.json(configuracoesAtualizadas[0]);
        } catch (error) {
            console.error('Erro ao atualizar configurações:', error);
            res.status(500).json({ error: 'Erro ao atualizar configurações' });
        }
    }

    static async fazerBackup(req, res) {
        try {
            const backupDir = path.join(__dirname, '..', 'backups');
            await fs.mkdir(backupDir, { recursive: true });

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `backup_${timestamp}.sql`;
            const filePath = path.join(backupDir, filename);

            const { DB_HOST, DB_USER, DB_PASS, DB_NAME } = process.env;
            
            const command = `mysqldump -h ${DB_HOST} -u ${DB_USER} ${DB_PASS ? `-p${DB_PASS}` : ''} ${DB_NAME} > "${filePath}"`;
            
            exec(command, async (error, stdout, stderr) => {
                if (error) {
                    console.error('Erro ao fazer backup:', error);
                    return res.status(500).json({ error: 'Erro ao fazer backup do banco de dados' });
                }

                // Atualiza a data do último backup
                await db.query('UPDATE configuracoes SET ultimo_backup = CURRENT_TIMESTAMP WHERE id = 1');

                const fileBuffer = await fs.readFile(filePath);
                res.setHeader('Content-Type', 'application/sql');
                res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
                res.send(fileBuffer);

                // Remove o arquivo após enviar
                await fs.unlink(filePath);
            });
        } catch (error) {
            console.error('Erro ao fazer backup:', error);
            res.status(500).json({ error: 'Erro ao fazer backup do banco de dados' });
        }
    }

    static async restaurarBackup(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'Nenhum arquivo enviado' });
            }

            const backupDir = path.join(__dirname, '..', 'backups');
            await fs.mkdir(backupDir, { recursive: true });

            const tempFile = path.join(backupDir, 'temp_backup.sql');
            await fs.writeFile(tempFile, req.file.buffer);

            const { DB_HOST, DB_USER, DB_PASS, DB_NAME } = process.env;
            
            const command = `mysql -h ${DB_HOST} -u ${DB_USER} ${DB_PASS ? `-p${DB_PASS}` : ''} ${DB_NAME} < "${tempFile}"`;
            
            exec(command, async (error, stdout, stderr) => {
                // Remove o arquivo temporário
                await fs.unlink(tempFile);

                if (error) {
                    console.error('Erro ao restaurar backup:', error);
                    return res.status(500).json({ error: 'Erro ao restaurar backup' });
                }

                res.json({ message: 'Backup restaurado com sucesso' });
            });
        } catch (error) {
            console.error('Erro ao restaurar backup:', error);
            res.status(500).json({ error: 'Erro ao restaurar backup' });
        }
    }
}

module.exports = ConfiguracaoController; 