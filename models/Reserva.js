const pool = require('../config/database');

class Reserva {
    // Buscar todas as reservas com paginação e filtros
    static async buscarTodas(pagina = 1, filtros = {}) {
        try {
            const itensPorPagina = 10;
            const offset = (pagina - 1) * itensPorPagina;

            // Query base
            let baseQuery = `
                SELECT 
                    r.*,
                    c.nome as cliente_nome,
                    c.email as cliente_email,
                    c.telefone as cliente_telefone,
                    q.numero as quarto_numero,
                    tq.nome as tipo_quarto,
                    tq.preco_diaria
                FROM reservas r
                JOIN clientes c ON r.cliente_id = c.id
                JOIN quartos q ON r.quarto_id = q.id
                JOIN tipos_quarto tq ON q.tipo_id = tq.id
                WHERE 1=1
            `;
            
            const params = [];
            const values = [];

            // Adiciona condições de filtro
            if (filtros.busca) {
                baseQuery += ` AND (c.nome LIKE ? OR q.numero LIKE ? OR CAST(r.id AS CHAR) LIKE ?)`;
                const termoBusca = `%${filtros.busca}%`;
                values.push(termoBusca, termoBusca, termoBusca);
            }

            if (filtros.status) {
                baseQuery += ` AND r.status = ?`;
                values.push(filtros.status);
            }

            if (filtros.periodo) {
                switch (filtros.periodo) {
                    case 'hoje':
                        baseQuery += ` AND DATE(r.data_entrada) = CURDATE()`;
                        break;
                    case 'semana':
                        baseQuery += ` AND YEARWEEK(r.data_entrada, 1) = YEARWEEK(CURDATE(), 1)`;
                        break;
                    case 'mes':
                        baseQuery += ` AND YEAR(r.data_entrada) = YEAR(CURDATE()) AND MONTH(r.data_entrada) = MONTH(CURDATE())`;
                        break;
                }
            }

            // Conta total de registros
            const [countResult] = await pool.query(
                `SELECT COUNT(*) as total FROM (${baseQuery}) as subquery`,
                values
            );
            const totalRegistros = countResult[0].total;
            const totalPaginas = Math.ceil(totalRegistros / itensPorPagina);

            // Query final com ordenação e paginação
            const orderBy = filtros.ordenacao && ['data_entrada', 'data_saida', 'valor_total', 'status'].includes(filtros.ordenacao)
                ? filtros.ordenacao
                : 'data_entrada';

            baseQuery += ` ORDER BY r.${orderBy} DESC LIMIT ${itensPorPagina} OFFSET ${offset}`;

            // Executa a query final
            const [reservas] = await pool.query(baseQuery, values);

            return {
                reservas: reservas.map(r => ({
                    ...r,
                    data_entrada: r.data_entrada ? r.data_entrada.toISOString().split('T')[0] : null,
                    data_saida: r.data_saida ? r.data_saida.toISOString().split('T')[0] : null
                })),
                paginaAtual: Number(pagina),
                totalPaginas,
                totalRegistros,
                itensPorPagina
            };
        } catch (error) {
            console.error('Erro ao buscar reservas:', error);
            throw new Error('Erro ao listar reservas: ' + (error.message || 'Erro desconhecido'));
        }
    }

    // Buscar reserva por ID
    static async buscarPorId(id) {
        try {
            const [reservas] = await pool.query(
                `SELECT 
                    r.*,
                    c.nome as cliente_nome,
                    c.email as cliente_email,
                    c.telefone as cliente_telefone,
                    q.numero as quarto_numero,
                    tq.nome as tipo_quarto,
                    tq.preco_diaria
                FROM reservas r
                JOIN clientes c ON r.cliente_id = c.id
                JOIN quartos q ON r.quarto_id = q.id
                JOIN tipos_quarto tq ON q.tipo_id = tq.id
                WHERE r.id = ?`,
                [id]
            );

            if (reservas.length === 0) {
                return null;
            }

            const reserva = reservas[0];
            return {
                ...reserva,
                data_entrada: reserva.data_entrada ? reserva.data_entrada.toISOString().split('T')[0] : null,
                data_saida: reserva.data_saida ? reserva.data_saida.toISOString().split('T')[0] : null
            };
        } catch (error) {
            console.error('Erro ao buscar reserva por ID:', error);
            throw new Error('Erro ao buscar reserva: ' + (error.message || 'Erro desconhecido'));
        }
    }

    // Criar nova reserva
    static async criar(dados) {
        try {
            const {
                cliente_id,
                quarto_id,
                data_entrada,
                data_saida,
                valor_diaria,
                valor_total,
                observacoes = null
            } = dados;

            // Verifica disponibilidade do quarto
            const disponivel = await this.verificarDisponibilidade(quarto_id, data_entrada, data_saida);
            if (!disponivel) {
                throw new Error('Quarto não disponível neste período');
            }

            const [result] = await pool.query(
                `INSERT INTO reservas (
                    cliente_id, quarto_id, data_entrada, data_saida,
                    valor_diaria, valor_total, observacoes, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pendente')`,
                [cliente_id, quarto_id, data_entrada, data_saida, valor_diaria, valor_total, observacoes]
            );

            return {
                id: result.insertId,
                ...dados,
                status: 'pendente'
            };
        } catch (error) {
            console.error('Erro ao criar reserva:', error);
            throw new Error('Erro ao criar reserva: ' + (error.message || 'Erro desconhecido'));
        }
    }

    // Verificar disponibilidade do quarto
    static async verificarDisponibilidade(quarto_id, data_entrada, data_saida, excluirReservaId = null) {
        try {
            let query = `
                SELECT id FROM reservas 
                WHERE quarto_id = ? 
                AND status NOT IN ('cancelada', 'checkout')
                AND ((data_entrada BETWEEN ? AND ?) 
                     OR (data_saida BETWEEN ? AND ?)
                     OR (data_entrada <= ? AND data_saida >= ?))
            `;
            const params = [quarto_id, data_entrada, data_saida, data_entrada, data_saida, data_entrada, data_saida];

            if (excluirReservaId) {
                query += ' AND id != ?';
                params.push(excluirReservaId);
            }

            const [reservas] = await pool.query(query, params);
            return reservas.length === 0;
        } catch (error) {
            console.error('Erro ao verificar disponibilidade:', error);
            throw new Error('Erro ao verificar disponibilidade: ' + (error.message || 'Erro desconhecido'));
        }
    }

    // Buscar estatísticas
    static async buscarEstatisticas() {
        try {
            const [result] = await pool.query(`
                SELECT 
                    COUNT(CASE WHEN status = 'checkin' THEN 1 END) as checkinHoje,
                    COUNT(CASE WHEN status = 'checkout' THEN 1 END) as checkoutHoje,
                    COUNT(CASE WHEN status IN ('checkin', 'confirmada') THEN 1 END) as quartosOcupados,
                    COUNT(CASE WHEN status = 'pendente' THEN 1 END) as reservasPendentes
                FROM reservas
                WHERE DATE(data_entrada) = CURDATE()
                   OR DATE(data_saida) = CURDATE()
                   OR (status IN ('checkin', 'confirmada', 'pendente'))
            `);

            return result[0];
        } catch (error) {
            console.error('Erro ao buscar estatísticas:', error);
            throw new Error('Erro ao buscar estatísticas: ' + (error.message || 'Erro desconhecido'));
        }
    }

    // Atualizar reserva
    static async atualizar(id, dados) {
        try {
            const {
                cliente_id,
                quarto_id,
                data_entrada,
                data_saida,
                valor_diaria,
                valor_total,
                observacoes = null
            } = dados;

            // Verifica disponibilidade do quarto (excluindo a própria reserva)
            const disponivel = await this.verificarDisponibilidade(quarto_id, data_entrada, data_saida, id);
            if (!disponivel) {
                throw new Error('Quarto não disponível neste período');
            }

            await pool.query(
                `UPDATE reservas SET
                    cliente_id = ?,
                    quarto_id = ?,
                    data_entrada = ?,
                    data_saida = ?,
                    valor_diaria = ?,
                    valor_total = ?,
                    observacoes = ?
                WHERE id = ?`,
                [cliente_id, quarto_id, data_entrada, data_saida, valor_diaria, valor_total, observacoes, id]
            );

            return {
                id,
                ...dados
            };
        } catch (error) {
            console.error('Erro ao atualizar reserva:', error);
            throw new Error('Erro ao atualizar reserva: ' + (error.message || 'Erro desconhecido'));
        }
    }

    // Realizar check-in
    static async realizarCheckin(id) {
        try {
            const [reservas] = await pool.query(
                'SELECT * FROM reservas WHERE id = ?',
                [id]
            );

            if (reservas.length === 0) {
                throw new Error('Reserva não encontrada');
            }

            const reserva = reservas[0];
            if (reserva.status !== 'pendente' && reserva.status !== 'confirmada') {
                throw new Error('Reserva não está em estado válido para check-in');
            }

            await pool.query(
                'UPDATE reservas SET status = "checkin" WHERE id = ?',
                [id]
            );

            // Atualiza o status do quarto
            await pool.query(
                'UPDATE quartos SET status = "ocupado" WHERE id = ?',
                [reserva.quarto_id]
            );

            return { message: 'Check-in realizado com sucesso' };
        } catch (error) {
            console.error('Erro ao realizar check-in:', error);
            throw new Error('Erro ao realizar check-in: ' + (error.message || 'Erro desconhecido'));
        }
    }

    // Realizar check-out
    static async realizarCheckout(id) {
        try {
            const [reservas] = await pool.query(
                'SELECT * FROM reservas WHERE id = ?',
                [id]
            );

            if (reservas.length === 0) {
                throw new Error('Reserva não encontrada');
            }

            const reserva = reservas[0];
            if (reserva.status !== 'checkin') {
                throw new Error('Reserva não está em check-in');
            }

            await pool.query(
                'UPDATE reservas SET status = "checkout" WHERE id = ?',
                [id]
            );

            // Atualiza o status do quarto
            await pool.query(
                'UPDATE quartos SET status = "disponivel" WHERE id = ?',
                [reserva.quarto_id]
            );

            return { message: 'Check-out realizado com sucesso' };
        } catch (error) {
            console.error('Erro ao realizar check-out:', error);
            throw new Error('Erro ao realizar check-out: ' + (error.message || 'Erro desconhecido'));
        }
    }

    // Cancelar reserva
    static async cancelar(id) {
        try {
            const [reservas] = await pool.query(
                'SELECT * FROM reservas WHERE id = ?',
                [id]
            );

            if (reservas.length === 0) {
                throw new Error('Reserva não encontrada');
            }

            const reserva = reservas[0];
            if (!['pendente', 'confirmada'].includes(reserva.status)) {
                throw new Error('Reserva não pode ser cancelada');
            }

            await pool.query(
                'UPDATE reservas SET status = "cancelada" WHERE id = ?',
                [id]
            );

            // Se o quarto estiver ocupado por esta reserva, libera ele
            await pool.query(
                'UPDATE quartos SET status = "disponivel" WHERE id = ? AND status = "ocupado"',
                [reserva.quarto_id]
            );

            return { message: 'Reserva cancelada com sucesso' };
        } catch (error) {
            console.error('Erro ao cancelar reserva:', error);
            throw new Error('Erro ao cancelar reserva: ' + (error.message || 'Erro desconhecido'));
        }
    }
}

module.exports = Reserva; 