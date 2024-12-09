const Produto = require('../models/Produto');
const errorHandler = require('../utils/errorHandler');

class ProdutoController {
    // Listar todos os produtos
    static async listar(req, res) {
        try {
            const produtos = await Produto.buscarTodos();
            res.json(produtos);
        } catch (error) {
            errorHandler(res, error, 'Erro ao listar produtos');
        }
    }

    // Buscar produto por ID
    static async buscarPorId(req, res) {
        try {
            const produto = await Produto.buscarPorId(req.params.id);
            if (!produto) {
                return res.status(404).json({ message: 'Produto não encontrado' });
            }
            res.json(produto);
        } catch (error) {
            errorHandler(res, error, 'Erro ao buscar produto');
        }
    }

    // Criar novo produto
    static async criar(req, res) {
        try {
            const dados = req.body;

            // Validações básicas
            if (!dados.nome || !dados.categoria || !dados.preco) {
                return res.status(400).json({ message: 'Dados incompletos' });
            }

            const novoProduto = await Produto.criar(dados);
            res.status(201).json(novoProduto);
        } catch (error) {
            errorHandler(res, error, 'Erro ao criar produto');
        }
    }

    // Atualizar produto
    static async atualizar(req, res) {
        try {
            const id = req.params.id;
            const dados = req.body;

            // Validações básicas
            if (!dados.nome || !dados.categoria || !dados.preco) {
                return res.status(400).json({ message: 'Dados incompletos' });
            }

            const produtoAtualizado = await Produto.atualizar(id, dados);
            res.json(produtoAtualizado);
        } catch (error) {
            errorHandler(res, error, 'Erro ao atualizar produto');
        }
    }

    // Excluir produto
    static async excluir(req, res) {
        try {
            await Produto.excluir(req.params.id);
            res.json({ message: 'Produto excluído com sucesso' });
        } catch (error) {
            errorHandler(res, error, 'Erro ao excluir produto');
        }
    }

    // Atualizar estoque
    static async atualizarEstoque(req, res) {
        try {
            const { id } = req.params;
            const { estoque } = req.body;

            if (typeof estoque !== 'number' || estoque < 0) {
                return res.status(400).json({ message: 'Quantidade inválida' });
            }

            const produtoAtualizado = await Produto.atualizarEstoque(id, estoque);
            res.json(produtoAtualizado);
        } catch (error) {
            errorHandler(res, error, 'Erro ao atualizar estoque');
        }
    }

    // Buscar estatísticas
    static async buscarEstatisticas(req, res) {
        try {
            const estatisticas = await Produto.buscarEstatisticas();
            res.json(estatisticas);
        } catch (error) {
            errorHandler(res, error, 'Erro ao buscar estatísticas');
        }
    }
}

module.exports = ProdutoController; 