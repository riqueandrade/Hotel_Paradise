const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const jwt = require('jsonwebtoken');

// Middleware para verificar o token JWT
const verifyToken = (req, res, next) => {
    const bearerHeader = req.headers['authorization'];
    
    if (!bearerHeader) {
        return res.status(401).json({ message: 'Token não fornecido' });
    }

    const token = bearerHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token inválido' });
    }
};

// Rota para obter estatísticas gerais
router.get('/stats', verifyToken, async (req, res) => {
    try {
        // Consultas em paralelo para melhor performance
        const [
            reservasHoje,
            quartosOcupados,
            receitaDiaria,
            novosClientes,
            ultimasReservas,
            ocupacaoSemanal,
            distribuicaoQuartos
        ] = await Promise.all([
            // Reservas de hoje
            pool.execute(`
                SELECT COUNT(*) as total
                FROM reservas
                WHERE DATE(data_entrada) = CURDATE()
                AND status = 'confirmada'
            `),

            // Quartos ocupados
            pool.execute(`
                SELECT 
                    COUNT(CASE WHEN status = 'ocupado' THEN 1 END) as total_ocupados,
                    COUNT(*) as total_quartos
                FROM quartos
            `),

            // Receita diária
            pool.execute(`
                SELECT COALESCE(SUM(valor_total), 0) as total
                FROM reservas
                WHERE DATE(data_entrada) = CURDATE()
                AND status = 'confirmada'
            `),

            // Novos clientes hoje
            pool.execute(`
                SELECT COUNT(*) as total
                FROM clientes
                WHERE DATE(created_at) = CURDATE()
            `),

            // Últimas 5 reservas
            pool.execute(`
                SELECT 
                    r.id,
                    c.nome as cliente,
                    q.numero as quarto,
                    r.data_entrada,
                    r.data_saida,
                    r.status,
                    r.valor_total
                FROM reservas r
                JOIN clientes c ON r.cliente_id = c.id
                JOIN quartos q ON r.quarto_id = q.id
                ORDER BY r.created_at DESC
                LIMIT 5
            `),

            // Ocupação dos últimos 7 dias
            pool.execute(`
                SELECT 
                    DATE_FORMAT(data, '%d/%m') as label,
                    total
                FROM (
                    SELECT 
                        DATE(data_entrada) as data,
                        COUNT(*) as total
                    FROM reservas
                    WHERE data_entrada >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
                    AND status = 'confirmada'
                    GROUP BY DATE(data_entrada)
                ) as ocupacao
                ORDER BY data
            `),

            // Distribuição atual dos quartos
            pool.execute(`
                SELECT 
                    CASE 
                        WHEN status = 'ocupado' THEN 'Ocupados'
                        WHEN status = 'disponivel' THEN 'Disponíveis'
                        ELSE 'Manutenção'
                    END as label,
                    COUNT(*) as total
                FROM quartos
                GROUP BY status
            `)
        ]);

        // Processa os resultados
        const [rowsReservasHoje] = reservasHoje;
        const [rowsQuartosOcupados] = quartosOcupados;
        const [rowsReceitaDiaria] = receitaDiaria;
        const [rowsNovosClientes] = novosClientes;
        const [rowsUltimasReservas] = ultimasReservas;
        const [rowsOcupacaoSemanal] = ocupacaoSemanal;
        const [rowsDistribuicaoQuartos] = distribuicaoQuartos;

        // Calcula a taxa de ocupação
        const taxaOcupacao = Math.round((rowsQuartosOcupados[0].total_ocupados / rowsQuartosOcupados[0].total_quartos) * 100) || 0;

        // Formata os dados para o dashboard
        const dashboardData = {
            cards: {
                reservasHoje: rowsReservasHoje[0].total || 0,
                taxaOcupacao: taxaOcupacao,
                receitaDiaria: rowsReceitaDiaria[0].total || 0,
                novosClientes: rowsNovosClientes[0].total || 0
            },
            ultimasReservas: rowsUltimasReservas.map(reserva => ({
                cliente: reserva.cliente,
                quarto: reserva.quarto,
                checkIn: reserva.data_entrada,
                checkOut: reserva.data_saida,
                status: reserva.status,
                valor: reserva.valor_total
            })),
            graficos: {
                ocupacaoSemanal: {
                    labels: rowsOcupacaoSemanal.map(row => row.label),
                    data: rowsOcupacaoSemanal.map(row => row.total)
                },
                distribuicaoQuartos: {
                    labels: rowsDistribuicaoQuartos.map(row => row.label),
                    data: rowsDistribuicaoQuartos.map(row => row.total)
                }
            }
        };

        res.json(dashboardData);
    } catch (error) {
        console.error('Erro ao obter estatísticas:', error);
        res.status(500).json({ message: 'Erro ao carregar dados do dashboard' });
    }
});

module.exports = router; 