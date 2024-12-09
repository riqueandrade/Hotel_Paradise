const pool = require('../config/database');
const { validarCPF, validarEmail, validarTelefone } = require('../utils/validations');

class Cliente {
    // Buscar todos os clientes
    static async buscarTodos() {
        const [clientes] = await pool.execute(
            `SELECT 
                id, nome, email, telefone, cpf,
                data_nascimento, cidade, estado,
                created_at, updated_at
             FROM clientes 
             ORDER BY nome`
        );
        return clientes;
    }

    // Buscar cliente por ID
    static async buscarPorId(id) {
        const [clientes] = await pool.execute(
            `SELECT * FROM clientes WHERE id = ?`,
            [id]
        );
        return clientes[0];
    }

    // Criar novo cliente
    static async criar(dados) {
        // Validações
        if (!validarCPF(dados.cpf)) {
            throw new Error('CPF inválido');
        }
        if (dados.email && !validarEmail(dados.email)) {
            throw new Error('Email inválido');
        }
        if (dados.telefone && !validarTelefone(dados.telefone)) {
            throw new Error('Telefone inválido');
        }

        // Verifica se o CPF já existe
        const [existentes] = await pool.execute(
            'SELECT id FROM clientes WHERE cpf = ?',
            [dados.cpf]
        );
        if (existentes.length > 0) {
            throw new Error('CPF já cadastrado');
        }

        const {
            nome,
            email,
            telefone,
            cpf,
            data_nascimento,
            endereco,
            cidade,
            estado,
            cep,
            profissao,
            motivo_visita,
            origem,
            observacoes
        } = dados;

        const [result] = await pool.execute(
            `INSERT INTO clientes (
                nome, email, telefone, cpf, data_nascimento,
                endereco, cidade, estado, cep, profissao,
                motivo_visita, origem, observacoes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                nome, email, telefone, cpf, data_nascimento,
                endereco, cidade, estado, cep, profissao,
                motivo_visita, origem, observacoes
            ]
        );

        return {
            id: result.insertId,
            ...dados
        };
    }

    // Atualizar cliente
    static async atualizar(id, dados) {
        // Validações
        if (dados.cpf && !validarCPF(dados.cpf)) {
            throw new Error('CPF inválido');
        }
        if (dados.email && !validarEmail(dados.email)) {
            throw new Error('Email inválido');
        }
        if (dados.telefone && !validarTelefone(dados.telefone)) {
            throw new Error('Telefone inválido');
        }

        // Verifica se o CPF já existe para outro cliente
        if (dados.cpf) {
            const [existentes] = await pool.execute(
                'SELECT id FROM clientes WHERE cpf = ? AND id != ?',
                [dados.cpf, id]
            );
            if (existentes.length > 0) {
                throw new Error('CPF já cadastrado para outro cliente');
            }
        }

        const {
            nome,
            email,
            telefone,
            cpf,
            data_nascimento,
            endereco,
            cidade,
            estado,
            cep,
            profissao,
            motivo_visita,
            origem,
            observacoes
        } = dados;

        await pool.execute(
            `UPDATE clientes SET
                nome = ?,
                email = ?,
                telefone = ?,
                cpf = ?,
                data_nascimento = ?,
                endereco = ?,
                cidade = ?,
                estado = ?,
                cep = ?,
                profissao = ?,
                motivo_visita = ?,
                origem = ?,
                observacoes = ?
            WHERE id = ?`,
            [
                nome, email, telefone, cpf, data_nascimento,
                endereco, cidade, estado, cep, profissao,
                motivo_visita, origem, observacoes, id
            ]
        );

        return {
            id,
            ...dados
        };
    }

    // Excluir cliente
    static async excluir(id) {
        // Verifica se há reservas para este cliente
        const [reservas] = await pool.execute(
            'SELECT id FROM reservas WHERE cliente_id = ? AND status != "cancelada" LIMIT 1',
            [id]
        );

        if (reservas.length > 0) {
            throw new Error('Não é possível excluir um cliente com reservas ativas');
        }

        await pool.execute('DELETE FROM clientes WHERE id = ?', [id]);
    }

    // Buscar histórico de reservas do cliente
    static async buscarHistorico(id) {
        const [reservas] = await pool.execute(
            `SELECT 
                r.*,
                q.numero as quarto_numero,
                tq.nome as tipo_quarto,
                tq.preco_diaria
             FROM reservas r
             JOIN quartos q ON r.quarto_id = q.id
             JOIN tipos_quarto tq ON q.tipo_id = tq.id
             WHERE r.cliente_id = ?
             ORDER BY r.data_entrada DESC`,
            [id]
        );
        return reservas;
    }
}

module.exports = Cliente; 