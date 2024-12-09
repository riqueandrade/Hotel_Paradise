const pool = require('../config/database');

class Produto {
    // Buscar todos os produtos
    static async buscarTodos() {
        const [produtos] = await pool.execute(
            `SELECT 
                id,
                nome,
                categoria,
                preco,
                estoque,
                estoque_minimo,
                descricao,
                created_at,
                updated_at
             FROM produtos
             ORDER BY nome`
        );
        return produtos;
    }

    // Buscar produto por ID
    static async buscarPorId(id) {
        const [produtos] = await pool.execute(
            `SELECT 
                id,
                nome,
                categoria,
                preco,
                estoque,
                estoque_minimo,
                descricao,
                created_at,
                updated_at
             FROM produtos
             WHERE id = ?`,
            [id]
        );
        return produtos[0] || null;
    }

    // Criar novo produto
    static async criar(dados) {
        const {
            nome,
            categoria,
            preco,
            estoque,
            estoque_minimo,
            descricao
        } = dados;

        const [result] = await pool.execute(
            `INSERT INTO produtos (
                nome,
                categoria,
                preco,
                estoque,
                estoque_minimo,
                descricao
            ) VALUES (?, ?, ?, ?, ?, ?)`,
            [nome, categoria, preco, estoque, estoque_minimo, descricao]
        );

        return this.buscarPorId(result.insertId);
    }

    // Atualizar produto
    static async atualizar(id, dados) {
        const {
            nome,
            categoria,
            preco,
            estoque,
            estoque_minimo,
            descricao
        } = dados;

        await pool.execute(
            `UPDATE produtos SET
                nome = ?,
                categoria = ?,
                preco = ?,
                estoque = ?,
                estoque_minimo = ?,
                descricao = ?,
                updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [nome, categoria, preco, estoque, estoque_minimo, descricao, id]
        );

        return this.buscarPorId(id);
    }

    // Excluir produto
    static async excluir(id) {
        await pool.execute('DELETE FROM produtos WHERE id = ?', [id]);
    }

    // Atualizar estoque
    static async atualizarEstoque(id, quantidade) {
        await pool.execute(
            'UPDATE produtos SET estoque = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [quantidade, id]
        );
        return this.buscarPorId(id);
    }

    // Buscar estatísticas
    static async buscarEstatisticas() {
        const [produtos] = await pool.execute(
            `SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN estoque > estoque_minimo THEN 1 ELSE 0 END) as em_estoque,
                SUM(CASE WHEN estoque > 0 AND estoque <= estoque_minimo THEN 1 ELSE 0 END) as estoque_baixo,
                SUM(CASE WHEN estoque = 0 THEN 1 ELSE 0 END) as sem_estoque
             FROM produtos`
        );
        return produtos[0];
    }
}

module.exports = Produto; 