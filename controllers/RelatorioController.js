const db = require('../database/db');

class RelatorioController {
    async getRelatorio(req, res) {
        const { tipo, periodo, dataInicial, dataFinal } = req.query;
        
        try {
            let dados = [];
            let query = '';
            let params = [];

            switch (tipo) {
                case 'ocupacao':
                    query = `
                        SELECT 
                            DATE_FORMAT(data_entrada, '%Y-%m') as periodo,
                            COUNT(*) as quartos_ocupados,
                            (SELECT COUNT(*) FROM quartos) as total_quartos,
                            (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM quartos)) as taxa_ocupacao
                        FROM reservas
                        WHERE status = 'confirmada'
                        ${this.getFiltroPeriodo(periodo, 'data_entrada')}
                        GROUP BY DATE_FORMAT(data_entrada, '%Y-%m')
                        ORDER BY periodo DESC
                    `;
                    break;

                case 'financeiro':
                    query = `
                        SELECT 
                            DATE_FORMAT(r.data_entrada, '%Y-%m') as periodo,
                            SUM(r.valor_total) as receita,
                            COALESCE(SUM(p.preco * rp.quantidade), 0) as despesas
                        FROM reservas r
                        LEFT JOIN reservas_produtos rp ON r.id = rp.reserva_id
                        LEFT JOIN produtos p ON rp.produto_id = p.id
                        WHERE r.status = 'confirmada'
                        ${this.getFiltroPeriodo(periodo, 'r.data_entrada')}
                        GROUP BY DATE_FORMAT(r.data_entrada, '%Y-%m')
                        ORDER BY periodo DESC
                    `;
                    break;

                case 'produtos':
                    query = `
                        SELECT 
                            p.nome as produto,
                            SUM(rp.quantidade) as quantidade,
                            SUM(p.preco * rp.quantidade) as receita
                        FROM produtos p
                        LEFT JOIN reservas_produtos rp ON p.id = rp.produto_id
                        LEFT JOIN reservas r ON rp.reserva_id = r.id
                        WHERE r.status = 'confirmada'
                        ${this.getFiltroPeriodo(periodo, 'r.data_entrada')}
                        GROUP BY p.id, p.nome
                        ORDER BY quantidade DESC
                    `;
                    break;

                case 'clientes':
                    query = `
                        SELECT 
                            CASE 
                                WHEN COUNT(*) > 5 THEN 'VIP'
                                WHEN COUNT(*) > 2 THEN 'Frequente'
                                ELSE 'Regular'
                            END as categoria,
                            COUNT(DISTINCT c.id) as quantidade,
                            AVG(r.valor_total) as valor_medio
                        FROM clientes c
                        JOIN reservas r ON c.id = r.cliente_id
                        WHERE r.status = 'confirmada'
                        ${this.getFiltroPeriodo(periodo, 'r.data_entrada')}
                        GROUP BY 
                            CASE 
                                WHEN COUNT(*) > 5 THEN 'VIP'
                                WHEN COUNT(*) > 2 THEN 'Frequente'
                                ELSE 'Regular'
                            END
                        ORDER BY quantidade DESC
                    `;
                    break;

                default:
                    return res.status(400).json({ error: 'Tipo de relatório inválido' });
            }

            const [rows] = await db.query(query, params);
            dados = rows;

            res.json(dados);
        } catch (error) {
            console.error('Erro ao gerar relatório:', error);
            res.status(500).json({ error: 'Erro ao gerar relatório' });
        }
    }

    getFiltroPeriodo(periodo, campo) {
        const hoje = new Date();
        let filtro = '';

        switch (periodo) {
            case 'hoje':
                filtro = `AND DATE(${campo}) = CURDATE()`;
                break;
            case 'semana':
                filtro = `AND ${campo} >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`;
                break;
            case 'mes':
                filtro = `AND ${campo} >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`;
                break;
            case 'ano':
                filtro = `AND ${campo} >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)`;
                break;
            case 'personalizado':
                if (dataInicial && dataFinal) {
                    filtro = `AND ${campo} BETWEEN ? AND ?`;
                    params.push(dataInicial, dataFinal);
                }
                break;
            default:
                filtro = '';
        }

        return filtro;
    }
}

module.exports = new RelatorioController(); 