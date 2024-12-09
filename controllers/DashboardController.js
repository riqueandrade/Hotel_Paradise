const pool = require('../config/database');

class DashboardController {
    async getStats(req, res) {
        try {
            const userCargo = req.userCargo;
            const isFinanceiro = userCargo === 'Administrador' || userCargo === 'Gerente' || userCargo === 'Financeiro';

            // Reservas de hoje (check-ins do dia)
            const [reservasHoje] = await pool.execute(
                `SELECT COUNT(*) as total FROM reservas 
                 WHERE DATE(data_entrada) = CURRENT_DATE() 
                 AND status IN ('confirmada', 'checkin')`
            );

            // Taxa de ocupação atual
            const [quartosTotal] = await pool.execute('SELECT COUNT(*) as total FROM quartos');
            const [quartosOcupados] = await pool.execute(
                `SELECT COUNT(*) as total FROM reservas r
                 JOIN quartos q ON r.quarto_id = q.id
                 WHERE r.status = 'checkin'
                 AND CURRENT_DATE() BETWEEN r.data_entrada AND r.data_saida`
            );

            const taxaOcupacao = Math.round((quartosOcupados[0].total / quartosTotal[0].total) * 100) || 0;

            // Dados para o gráfico de distribuição de quartos
            const [distribuicaoQuartos] = await pool.execute(
                `SELECT 
                    CASE 
                        WHEN r.status = 'checkin' THEN 'ocupado'
                        WHEN q.status = 'manutencao' THEN 'manutencao'
                        ELSE 'disponivel'
                    END as status,
                    COUNT(*) as total
                 FROM quartos q
                 LEFT JOIN reservas r ON q.id = r.quarto_id 
                    AND r.status = 'checkin'
                    AND CURRENT_DATE() BETWEEN r.data_entrada AND r.data_saida
                 GROUP BY 
                    CASE 
                        WHEN r.status = 'checkin' THEN 'ocupado'
                        WHEN q.status = 'manutencao' THEN 'manutencao'
                        ELSE 'disponivel'
                    END`
            );

            // Dados básicos que todos podem ver
            const response = {
                cards: {
                    reservasHoje: reservasHoje[0].total,
                    taxaOcupacao,
                    novosClientes: 0
                },
                graficos: {
                    distribuicaoQuartos: {
                        labels: ['Disponível', 'Ocupado', 'Manutenção'],
                        data: [
                            distribuicaoQuartos.find(d => d.status === 'disponivel')?.total || 0,
                            distribuicaoQuartos.find(d => d.status === 'ocupado')?.total || 0,
                            distribuicaoQuartos.find(d => d.status === 'manutencao')?.total || 0
                        ]
                    }
                },
                estatisticas: {
                    ultima_atualizacao: new Date()
                }
            };

            // Dados financeiros e avançados apenas para cargos autorizados
            if (isFinanceiro) {
                // Receita do dia (pagamentos aprovados)
                const [receitaDiaria] = await pool.execute(
                    `SELECT COALESCE(SUM(p.valor_total), 0) as total 
                     FROM pagamentos p
                     JOIN reservas r ON p.reserva_id = r.id
                     WHERE DATE(p.data_aprovacao) = CURRENT_DATE()
                     AND p.status = 'aprovado'`
                );

                // Novos clientes cadastrados hoje
                const [novosClientes] = await pool.execute(
                    `SELECT COUNT(*) as total FROM clientes 
                     WHERE DATE(data_cadastro) = CURRENT_DATE()`
                );

                // Dados para o gráfico de ocupação semanal
                const [ocupacaoSemanal] = await pool.execute(
                    `SELECT 
                        DATE(data_entrada) as data,
                        COUNT(*) * 100.0 / (SELECT COUNT(*) FROM quartos) as taxa
                     FROM reservas
                     WHERE data_entrada >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
                     AND status IN ('confirmada', 'checkin')
                     GROUP BY DATE(data_entrada)
                     ORDER BY data`
                );

                // Formata os dados para os gráficos
                const ultimos7Dias = Array.from({length: 7}, (_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    return d.toISOString().split('T')[0];
                }).reverse();

                const ocupacaoPorDia = new Map(
                    ocupacaoSemanal.map(row => [row.data.toISOString().split('T')[0], Math.round(row.taxa)])
                );

                const dadosOcupacao = ultimos7Dias.map(dia => ocupacaoPorDia.get(dia) || 0);

                // Estatísticas adicionais
                const [mediaEstadia] = await pool.execute(
                    `SELECT AVG(DATEDIFF(data_saida, data_entrada)) as media
                     FROM reservas
                     WHERE status = 'checkout'
                     AND data_checkout >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)`
                );

                // Adiciona dados financeiros à resposta
                response.cards.receitaDiaria = receitaDiaria[0].total || 0;
                response.cards.novosClientes = novosClientes[0].total;
                response.graficos.ocupacaoSemanal = {
                    labels: ultimos7Dias.map(data => {
                        const d = new Date(data);
                        return d.toLocaleDateString('pt-BR', { weekday: 'short' });
                    }),
                    data: dadosOcupacao
                };
                response.estatisticas.mediaEstadia = Math.round(mediaEstadia[0].media || 0);
            }

            res.json(response);
        } catch (error) {
            console.error('Erro ao buscar estatísticas:', error);
            res.status(500).json({ message: 'Erro ao buscar estatísticas do dashboard' });
        }
    }
}

module.exports = new DashboardController(); 