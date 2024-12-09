const db = require('../database/db');

class QuartoController {
    static async listar(req, res) {
        try {
            const [quartos] = await db.query('SELECT * FROM quartos');
            res.status(200).json(quartos);
        } catch (error) {
            res.status(500).json({
                error: 'Erro interno do servidor',
                message: 'Erro ao buscar quartos'
            });
        }
    }

    static async buscarDisponiveis(req, res) {
        try {
            const { data_entrada, data_saida } = req.query;

            if (!data_entrada || !data_saida) {
                return res.status(400).json({ message: 'Datas não informadas' });
            }

            const [quartos] = await db.query(`
                SELECT q.*
                FROM quartos q
                WHERE q.id NOT IN (
                    SELECT r.quarto_id
                    FROM reservas r
                    WHERE (r.data_entrada <= ? AND r.data_saida >= ?)
                    AND r.status NOT IN ('cancelada', 'finalizada')
                )
            `, [data_saida, data_entrada]);

            res.status(200).json(quartos);
        } catch (error) {
            res.status(500).json({
                error: 'Erro interno do servidor',
                message: 'Erro ao buscar quartos disponíveis'
            });
        }
    }

    static async buscarPorId(req, res) {
        try {
            const { id } = req.params;
            const [quartos] = await db.query('SELECT * FROM quartos WHERE id = ?', [id]);

            if (quartos.length === 0) {
                return res.status(404).json({ message: 'Quarto não encontrado' });
            }

            res.status(200).json(quartos[0]);
        } catch (error) {
            res.status(500).json({
                error: 'Erro interno do servidor',
                message: 'Erro ao buscar quarto'
            });
        }
    }

    static async criar(req, res) {
        try {
            const { numero, tipo, preco_diaria } = req.body;

            // Validações
            if (!numero || !tipo || !preco_diaria) {
                return res.status(400).json({ message: 'Dados inválidos' });
            }

            // Verifica se número já existe
            const [quartoExistente] = await db.query('SELECT id FROM quartos WHERE numero = ?', [numero]);
            if (quartoExistente.length > 0) {
                return res.status(400).json({ message: 'Já existe um quarto com este número' });
            }

            // Insere quarto
            const [result] = await db.query(
                'INSERT INTO quartos (numero, tipo, preco_diaria) VALUES (?, ?, ?)',
                [numero, tipo, preco_diaria]
            );

            res.status(201).json({
                message: 'Quarto criado com sucesso',
                id: result.insertId
            });
        } catch (error) {
            res.status(500).json({
                error: 'Erro interno do servidor',
                message: 'Erro ao criar quarto'
            });
        }
    }

    static async atualizar(req, res) {
        try {
            const { id } = req.params;
            const { numero, tipo, preco_diaria } = req.body;

            // Verifica se quarto existe
            const [quartoExistente] = await db.query('SELECT id FROM quartos WHERE id = ?', [id]);
            if (quartoExistente.length === 0) {
                return res.status(404).json({ message: 'Quarto não encontrado' });
            }

            // Verifica se número já existe (se estiver sendo atualizado)
            if (numero) {
                const [numeroExistente] = await db.query(
                    'SELECT id FROM quartos WHERE numero = ? AND id != ?',
                    [numero, id]
                );
                if (numeroExistente.length > 0) {
                    return res.status(400).json({ message: 'Já existe um quarto com este número' });
                }
            }

            // Monta query de atualização
            const campos = [];
            const valores = [];
            if (numero) {
                campos.push('numero = ?');
                valores.push(numero);
            }
            if (tipo) {
                campos.push('tipo = ?');
                valores.push(tipo);
            }
            if (preco_diaria) {
                campos.push('preco_diaria = ?');
                valores.push(preco_diaria);
            }

            if (campos.length === 0) {
                return res.status(400).json({ message: 'Nenhum dado para atualizar' });
            }

            valores.push(id);
            await db.query(
                `UPDATE quartos SET ${campos.join(', ')} WHERE id = ?`,
                valores
            );

            res.status(200).json({ message: 'Quarto atualizado com sucesso' });
        } catch (error) {
            res.status(500).json({
                error: 'Erro interno do servidor',
                message: 'Erro ao atualizar quarto'
            });
        }
    }

    static async atualizarStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            if (!status || !['disponivel', 'ocupado', 'manutencao'].includes(status)) {
                return res.status(400).json({ message: 'Status inválido' });
            }

            // Verifica se quarto existe
            const [quartoExistente] = await db.query('SELECT id FROM quartos WHERE id = ?', [id]);
            if (quartoExistente.length === 0) {
                return res.status(404).json({ message: 'Quarto não encontrado' });
            }

            await db.query(
                'UPDATE quartos SET status = ? WHERE id = ?',
                [status, id]
            );

            res.status(200).json({ message: 'Status do quarto atualizado com sucesso' });
        } catch (error) {
            res.status(500).json({
                error: 'Erro interno do servidor',
                message: 'Erro ao atualizar status do quarto'
            });
        }
    }

    static async buscarOcupacao(req, res) {
        try {
            const [estatisticas] = await db.query(`
                SELECT 
                    COUNT(*) as total_quartos,
                    SUM(CASE WHEN status = 'ocupado' THEN 1 ELSE 0 END) as quartos_ocupados,
                    SUM(CASE WHEN status = 'disponivel' THEN 1 ELSE 0 END) as quartos_disponiveis,
                    SUM(CASE WHEN status = 'manutencao' THEN 1 ELSE 0 END) as quartos_manutencao,
                    AVG(preco_diaria) as preco_medio_diaria
                FROM quartos
            `);

            res.status(200).json(estatisticas[0]);
        } catch (error) {
            res.status(500).json({
                error: 'Erro interno do servidor',
                message: 'Erro ao buscar estatísticas de ocupação'
            });
        }
    }
}

module.exports = QuartoController; 