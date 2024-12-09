const Reserva = require('../models/Reserva');
const { validarDatas } = require('../utils/validations');
const { formatarData } = require('../utils/formatters');
const errorHandler = require('../utils/errorHandler');

class ReservaController {
    // Listar todas as reservas
    static async listar(req, res) {
        try {
            const pagina = parseInt(req.query.pagina) || 1;
            const { busca, status, periodo, ordenacao } = req.query;

            if (pagina < 1) {
                return res.status(400).json({ message: 'Página inválida' });
            }

            const resultado = await Reserva.buscarTodas(Number(pagina), {
                busca: busca || '',
                status: status || '',
                periodo: periodo || '',
                ordenacao: ordenacao || 'data_entrada'
            });

            res.json(resultado);
        } catch (error) {
            errorHandler(res, error, 'Erro ao listar reservas');
        }
    }

    // Buscar reserva por ID
    static async buscarPorId(req, res) {
        try {
            const reserva = await Reserva.buscarPorId(req.params.id);
            if (!reserva) {
                return res.status(404).json({ message: 'Reserva não encontrada' });
            }
            res.json(reserva);
        } catch (error) {
            errorHandler(res, error, 'Erro ao buscar reserva');
        }
    }

    // Criar nova reserva
    static async criar(req, res) {
        try {
            const dados = req.body;

            // Validação das datas
            if (!validarDatas(dados.data_entrada, dados.data_saida)) {
                return res.status(400).json({ message: 'Datas inválidas' });
            }

            // Formata as datas
            dados.data_entrada = formatarData(dados.data_entrada);
            dados.data_saida = formatarData(dados.data_saida);

            const novaReserva = await Reserva.criar(dados);
            res.status(201).json(novaReserva);
        } catch (error) {
            errorHandler(res, error, 'Erro ao criar reserva');
        }
    }

    // Atualizar reserva
    static async atualizar(req, res) {
        try {
            const id = req.params.id;
            const dados = req.body;

            // Validação das datas
            if (!validarDatas(dados.data_entrada, dados.data_saida)) {
                return res.status(400).json({ message: 'Datas inválidas' });
            }

            // Formata as datas
            dados.data_entrada = formatarData(dados.data_entrada);
            dados.data_saida = formatarData(dados.data_saida);

            const reservaAtualizada = await Reserva.atualizar(id, dados);
            res.json(reservaAtualizada);
        } catch (error) {
            errorHandler(res, error, 'Erro ao atualizar reserva');
        }
    }

    // Realizar check-in
    static async realizarCheckin(req, res) {
        try {
            const resultado = await Reserva.realizarCheckin(req.params.id);
            res.json(resultado);
        } catch (error) {
            errorHandler(res, error, 'Erro ao realizar check-in');
        }
    }

    // Realizar check-out
    static async realizarCheckout(req, res) {
        try {
            const resultado = await Reserva.realizarCheckout(req.params.id);
            res.json(resultado);
        } catch (error) {
            errorHandler(res, error, 'Erro ao realizar check-out');
        }
    }

    // Cancelar reserva
    static async cancelar(req, res) {
        try {
            const resultado = await Reserva.cancelar(req.params.id);
            res.json(resultado);
        } catch (error) {
            errorHandler(res, error, 'Erro ao cancelar reserva');
        }
    }

    // Buscar estatísticas das reservas
    static async buscarEstatisticas(req, res) {
        try {
            const stats = await Reserva.buscarEstatisticas();
            res.json(stats);
        } catch (error) {
            errorHandler(res, error, 'Erro ao buscar estatísticas das reservas');
        }
    }
}

module.exports = ReservaController; 