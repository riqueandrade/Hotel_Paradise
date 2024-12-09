const db = require('../database/db');

class ProdutoController {
    static async listar(req, res) {
        try {
            const [produtos] = await db.query('SELECT * FROM produtos');
            res.status(200).json(produtos);
        } catch (error) {
            res.status(500).json({
                error: 'Erro interno do servidor',
                message: 'Erro ao buscar produtos'
            });
        }
    }

    static async buscarPorId(req, res) {
        try {
            const { id } = req.params;
            const [produtos] = await db.query('SELECT * FROM produtos WHERE id = ?', [id]);

            if (produtos.length === 0) {
                return res.status(404).json({ message: 'Produto não encontrado' });
            }

            res.status(200).json(produtos[0]);
        } catch (error) {
            res.status(500).json({
                error: 'Erro interno do servidor',
                message: 'Erro ao buscar produto'
            });
        }
    }

    static async criar(req, res) {
        try {
            const { nome, descricao, preco, estoque } = req.body;

            // Validações
            if (!nome || !descricao || !preco || estoque === undefined) {
                return res.status(400).json({ message: 'Dados inválidos' });
            }

            // Insere produto
            const [result] = await db.query(
                'INSERT INTO produtos (nome, descricao, preco, estoque) VALUES (?, ?, ?, ?)',
                [nome, descricao, preco, estoque]
            );

            res.status(201).json({
                message: 'Produto criado com sucesso',
                id: result.insertId
            });
        } catch (error) {
            res.status(500).json({
                error: 'Erro interno do servidor',
                message: 'Erro ao criar produto'
            });
        }
    }

    static async atualizar(req, res) {
        try {
            const { id } = req.params;
            const { nome, descricao, preco, estoque } = req.body;

            // Verifica se produto existe
            const [produtoExistente] = await db.query('SELECT id FROM produtos WHERE id = ?', [id]);
            if (produtoExistente.length === 0) {
                return res.status(404).json({ message: 'Produto não encontrado' });
            }

            // Monta query de atualização
            const campos = [];
            const valores = [];
            if (nome) {
                campos.push('nome = ?');
                valores.push(nome);
            }
            if (descricao) {
                campos.push('descricao = ?');
                valores.push(descricao);
            }
            if (preco) {
                campos.push('preco = ?');
                valores.push(preco);
            }
            if (estoque !== undefined) {
                campos.push('estoque = ?');
                valores.push(estoque);
            }

            if (campos.length === 0) {
                return res.status(400).json({ message: 'Nenhum dado para atualizar' });
            }

            valores.push(id);
            await db.query(
                `UPDATE produtos SET ${campos.join(', ')} WHERE id = ?`,
                valores
            );

            res.status(200).json({ message: 'Produto atualizado com sucesso' });
        } catch (error) {
            res.status(500).json({
                error: 'Erro interno do servidor',
                message: 'Erro ao atualizar produto'
            });
        }
    }

    static async atualizarEstoque(req, res) {
        try {
            const { id } = req.params;
            const { quantidade } = req.body;

            if (quantidade === undefined || quantidade < 0) {
                return res.status(400).json({ message: 'Quantidade inválida' });
            }

            // Verifica se produto existe
            const [produtoExistente] = await db.query('SELECT id FROM produtos WHERE id = ?', [id]);
            if (produtoExistente.length === 0) {
                return res.status(404).json({ message: 'Produto não encontrado' });
            }

            await db.query(
                'UPDATE produtos SET estoque = ? WHERE id = ?',
                [quantidade, id]
            );

            res.status(200).json({ message: 'Estoque atualizado com sucesso' });
        } catch (error) {
            res.status(500).json({
                error: 'Erro interno do servidor',
                message: 'Erro ao atualizar estoque'
            });
        }
    }

    static async buscarEstatisticas(req, res) {
        try {
            const [estatisticas] = await db.query(`
                SELECT 
                    COUNT(*) as total_produtos,
                    SUM(estoque) as total_estoque,
                    AVG(preco) as preco_medio,
                    MIN(preco) as preco_minimo,
                    MAX(preco) as preco_maximo
                FROM produtos
            `);

            res.status(200).json(estatisticas[0]);
        } catch (error) {
            res.status(500).json({
                error: 'Erro interno do servidor',
                message: 'Erro ao buscar estatísticas'
            });
        }
    }
}

module.exports = ProdutoController; 