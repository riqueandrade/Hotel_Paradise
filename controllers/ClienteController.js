const Cliente = require('../models/Cliente');
const { validarCPF, validarEmail } = require('../utils/validations');
const { formatarTelefone, formatarCPF } = require('../utils/formatters');
const errorHandler = require('../utils/errorHandler');

class ClienteController {
    // Listar todos os clientes
    static async listar(req, res) {
        try {
            const { pagina, busca, estado, ordenacao } = req.query;
            const resultado = await Cliente.buscarTodos(pagina, { busca, estado, ordenacao });
            res.json(resultado);
        } catch (error) {
            errorHandler(res, error, 'Erro ao listar clientes');
        }
    }

    // Buscar cliente por ID
    static async buscarPorId(req, res) {
        try {
            const cliente = await Cliente.buscarPorId(req.params.id);
            if (!cliente) {
                return res.status(404).json({ message: 'Cliente não encontrado' });
            }
            res.json(cliente);
        } catch (error) {
            errorHandler(res, error, 'Erro ao buscar cliente');
        }
    }

    // Criar novo cliente
    static async criar(req, res) {
        try {
            const dados = req.body;

            // Formata dados
            dados.telefone = formatarTelefone(dados.telefone);
            dados.cpf = formatarCPF(dados.cpf);

            const novoCliente = await Cliente.criar(dados);
            res.status(201).json(novoCliente);
        } catch (error) {
            errorHandler(res, error, 'Erro ao criar cliente');
        }
    }

    // Atualizar cliente
    static async atualizar(req, res) {
        try {
            const id = req.params.id;
            const dados = req.body;

            // Formata dados
            if (dados.telefone) {
                dados.telefone = formatarTelefone(dados.telefone);
            }
            if (dados.cpf) {
                dados.cpf = formatarCPF(dados.cpf);
            }

            const clienteAtualizado = await Cliente.atualizar(id, dados);
            res.json(clienteAtualizado);
        } catch (error) {
            errorHandler(res, error, 'Erro ao atualizar cliente');
        }
    }

    // Excluir cliente
    static async excluir(req, res) {
        try {
            await Cliente.excluir(req.params.id);
            res.json({ message: 'Cliente excluído com sucesso' });
        } catch (error) {
            errorHandler(res, error, 'Erro ao excluir cliente');
        }
    }

    // Buscar histórico de reservas do cliente
    static async buscarHistorico(req, res) {
        try {
            const historico = await Cliente.buscarHistorico(req.params.id);
            res.json(historico);
        } catch (error) {
            errorHandler(res, error, 'Erro ao buscar histórico do cliente');
        }
    }
}

module.exports = ClienteController; 