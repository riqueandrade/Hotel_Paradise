const Quarto = require('../models/Quarto');
const { validarNumeroQuarto } = require('../utils/validations');
const errorHandler = require('../utils/errorHandler');

class QuartoController {
    // Listar todos os quartos
    static async listar(req, res) {
        try {
            const quartos = await Quarto.buscarTodos();
            res.json(quartos);
        } catch (error) {
            errorHandler(res, error, 'Erro ao listar quartos');
        }
    }

    // Buscar quarto por ID
    static async buscarPorId(req, res) {
        try {
            const quarto = await Quarto.buscarPorId(req.params.id);
            if (!quarto) {
                return res.status(404).json({ message: 'Quarto não encontrado' });
            }
            res.json(quarto);
        } catch (error) {
            errorHandler(res, error, 'Erro ao buscar quarto');
        }
    }

    // Criar novo quarto
    static async criar(req, res) {
        try {
            const dados = req.body;

            // Validação do número do quarto
            if (!validarNumeroQuarto(dados.numero)) {
                return res.status(400).json({ message: 'Número do quarto inválido' });
            }

            // Validação do tipo
            if (!['standard', 'luxo', 'suite'].includes(dados.tipo?.toLowerCase())) {
                return res.status(400).json({ message: 'Tipo de quarto inválido' });
            }

            // Validação do status
            if (dados.status && !['disponivel', 'ocupado', 'manutencao'].includes(dados.status)) {
                return res.status(400).json({ message: 'Status inválido' });
            }

            const novoQuarto = await Quarto.criar(dados);
            res.status(201).json(novoQuarto);
        } catch (error) {
            errorHandler(res, error, 'Erro ao criar quarto');
        }
    }

    // Atualizar quarto
    static async atualizar(req, res) {
        try {
            const id = req.params.id;
            const dados = req.body;

            // Validação do número do quarto
            if (dados.numero && !validarNumeroQuarto(dados.numero)) {
                return res.status(400).json({ message: 'Número do quarto inválido' });
            }

            // Validação do tipo
            if (dados.tipo && !['standard', 'luxo', 'suite'].includes(dados.tipo?.toLowerCase())) {
                return res.status(400).json({ message: 'Tipo de quarto inválido' });
            }

            // Validação do status
            if (dados.status && !['disponivel', 'ocupado', 'manutencao'].includes(dados.status)) {
                return res.status(400).json({ message: 'Status inválido' });
            }

            const quartoAtualizado = await Quarto.atualizar(id, dados);
            res.json(quartoAtualizado);
        } catch (error) {
            errorHandler(res, error, 'Erro ao atualizar quarto');
        }
    }

    // Excluir quarto
    static async excluir(req, res) {
        try {
            await Quarto.excluir(req.params.id);
            res.json({ message: 'Quarto excluído com sucesso' });
        } catch (error) {
            errorHandler(res, error, 'Erro ao excluir quarto');
        }
    }

    // Atualizar status do quarto
    static async atualizarStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            if (!['disponivel', 'ocupado', 'manutencao'].includes(status)) {
                return res.status(400).json({ message: 'Status inválido' });
            }

            const quartoAtualizado = await Quarto.atualizarStatus(id, status);
            res.json(quartoAtualizado);
        } catch (error) {
            errorHandler(res, error, 'Erro ao atualizar status do quarto');
        }
    }

    // Buscar ocupação
    static async buscarOcupacao(req, res) {
        try {
            const ocupacao = await Quarto.buscarOcupacao();
            res.json(ocupacao);
        } catch (error) {
            errorHandler(res, error, 'Erro ao buscar ocupação');
        }
    }
}

module.exports = QuartoController; 