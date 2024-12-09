const pool = require('../config/database');

class Quarto {
    // Buscar todos os quartos
    static async buscarTodos() {
        const [quartos] = await pool.execute(
            `SELECT 
                q.id,
                q.numero,
                q.andar,
                q.status,
                q.created_at,
                q.updated_at,
                tq.nome as tipo,
                tq.preco_diaria,
                tq.descricao
             FROM quartos q
             JOIN tipos_quarto tq ON q.tipo_id = tq.id
             ORDER BY q.numero`
        );
        return quartos.map(q => ({
            ...q,
            tipo: q.tipo.toLowerCase()
        }));
    }

    // Buscar quarto por ID
    static async buscarPorId(id) {
        const [quartos] = await pool.execute(
            `SELECT 
                q.id,
                q.numero,
                q.andar,
                q.status,
                q.created_at,
                q.updated_at,
                tq.nome as tipo,
                tq.preco_diaria,
                tq.descricao
             FROM quartos q
             JOIN tipos_quarto tq ON q.tipo_id = tq.id
             WHERE q.id = ?`,
            [id]
        );
        if (quartos.length === 0) return null;
        const quarto = quartos[0];
        return {
            ...quarto,
            tipo: quarto.tipo.toLowerCase()
        };
    }

    // Buscar quartos disponíveis por período
    static async buscarDisponiveis(dataInicio, dataFim) {
        const [quartos] = await pool.execute(
            `SELECT 
                q.*,
                tq.nome as tipo_nome,
                tq.descricao as tipo_descricao,
                tq.preco_diaria
             FROM quartos q
             JOIN tipos_quarto tq ON q.tipo_id = tq.id
             WHERE q.status = 'disponivel'
             AND NOT EXISTS (
                 SELECT 1 FROM reservas r
                 WHERE r.quarto_id = q.id
                 AND r.status NOT IN ('cancelada', 'checkout')
                 AND ((r.data_entrada BETWEEN ? AND ?)
                      OR (r.data_saida BETWEEN ? AND ?)
                      OR (r.data_entrada <= ? AND r.data_saida >= ?))
             )
             ORDER BY q.numero`,
            [dataInicio, dataFim, dataInicio, dataFim, dataInicio, dataFim]
        );
        return quartos;
    }

    // Criar novo quarto
    static async criar(dados) {
        const {
            numero,
            tipo,
            status = 'disponivel',
            andar,
            descricao
        } = dados;

        // Busca o tipo_id baseado no nome do tipo
        const [tipos] = await pool.execute(
            'SELECT id FROM tipos_quarto WHERE LOWER(nome) = ?',
            [tipo.toLowerCase()]
        );

        if (tipos.length === 0) {
            throw new Error('Tipo de quarto inválido');
        }

        const tipo_id = tipos[0].id;

        const [result] = await pool.execute(
            `INSERT INTO quartos (
                numero, tipo_id, status, andar
            ) VALUES (?, ?, ?, ?)`,
            [numero, tipo_id, status, andar]
        );

        return this.buscarPorId(result.insertId);
    }

    // Atualizar quarto
    static async atualizar(id, dados) {
        const {
            numero,
            tipo,
            status,
            andar,
            descricao
        } = dados;

        // Busca o tipo_id baseado no nome do tipo
        const [tipos] = await pool.execute(
            'SELECT id FROM tipos_quarto WHERE LOWER(nome) = ?',
            [tipo.toLowerCase()]
        );

        if (tipos.length === 0) {
            throw new Error('Tipo de quarto inválido');
        }

        const tipo_id = tipos[0].id;

        await pool.execute(
            `UPDATE quartos SET
                numero = ?,
                tipo_id = ?,
                status = ?,
                andar = ?
            WHERE id = ?`,
            [numero, tipo_id, status, andar, id]
        );

        return this.buscarPorId(id);
    }

    // Excluir quarto
    static async excluir(id) {
        // Verifica se há reservas para este quarto
        const [reservas] = await pool.execute(
            'SELECT id FROM reservas WHERE quarto_id = ? AND status != "cancelada" LIMIT 1',
            [id]
        );

        if (reservas.length > 0) {
            throw new Error('Não é possível excluir um quarto com reservas ativas');
        }

        await pool.execute('DELETE FROM quartos WHERE id = ?', [id]);
    }

    // Verificar disponibilidade
    static async verificarDisponibilidade(id, dataInicio, dataFim) {
        const [reservas] = await pool.execute(
            `SELECT id FROM reservas 
             WHERE quarto_id = ? 
             AND status != 'cancelada'
             AND ((data_entrada BETWEEN ? AND ?) 
                  OR (data_saida BETWEEN ? AND ?)
                  OR (data_entrada <= ? AND data_saida >= ?))`,
            [id, dataInicio, dataFim, dataInicio, dataFim, dataInicio, dataFim]
        );
        return reservas.length === 0;
    }

    // Atualizar status do quarto
    static async atualizarStatus(id, status) {
        await pool.execute(
            'UPDATE quartos SET status = ? WHERE id = ?',
            [status, id]
        );
        return this.buscarPorId(id);
    }

    // Buscar ocupação atual
    static async buscarOcupacao() {
        const [result] = await pool.execute(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'ocupado' THEN 1 ELSE 0 END) as ocupados,
                SUM(CASE WHEN status = 'disponivel' THEN 1 ELSE 0 END) as disponiveis,
                SUM(CASE WHEN status = 'manutencao' THEN 1 ELSE 0 END) as manutencao
            FROM quartos
        `);

        const ocupacao = result[0];
        ocupacao.taxa_ocupacao = ocupacao.total > 0 
            ? (ocupacao.ocupados / ocupacao.total) * 100 
            : 0;

        return ocupacao;
    }

    // Buscar histórico de ocupação
    static async buscarHistoricoOcupacao(dias = 7) {
        const [historico] = await pool.execute(`
            SELECT 
                DATE(data_entrada) as data,
                COUNT(*) as total_reservas,
                COUNT(DISTINCT quarto_id) as quartos_ocupados
            FROM reservas
            WHERE data_entrada >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
            AND status != 'cancelada'
            GROUP BY DATE(data_entrada)
            ORDER BY data_entrada`,
            [dias]
        );

        return historico;
    }

    // Buscar faturamento por tipo de quarto
    static async buscarFaturamentoPorTipo(periodo = 30) {
        const [faturamento] = await pool.execute(`
            SELECT 
                q.tipo,
                COUNT(r.id) as total_reservas,
                SUM(r.valor_total) as faturamento_total,
                AVG(r.valor_diaria) as diaria_media
            FROM quartos q
            LEFT JOIN reservas r ON q.id = r.quarto_id
            WHERE r.data_entrada >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
            AND r.status != 'cancelada'
            GROUP BY q.tipo`,
            [periodo]
        );

        return faturamento;
    }
}

module.exports = Quarto; 