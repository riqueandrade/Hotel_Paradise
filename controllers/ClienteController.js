const db = require('../database/db');
const { validarCPF, validarEmail, validarTelefone } = require('../utils/validations');

class ClienteController {
    static async listar(req, res) {
        try {
            const [clientes] = await db.query('SELECT * FROM clientes');
            res.status(200).json(clientes);
        } catch (error) {
            res.status(500).json({
                error: 'Erro interno do servidor',
                message: 'Erro ao buscar clientes'
            });
        }
    }

    static async buscarPorId(req, res) {
        try {
            const { id } = req.params;
            const [clientes] = await db.query('SELECT * FROM clientes WHERE id = ?', [id]);

            if (clientes.length === 0) {
                return res.status(404).json({ message: 'Cliente não encontrado' });
            }

            res.status(200).json(clientes[0]);
        } catch (error) {
            res.status(500).json({
                error: 'Erro interno do servidor',
                message: 'Erro ao buscar cliente'
            });
        }
    }

    static async criar(req, res) {
        try {
            const { nome, cpf, email, telefone } = req.body;

            // Validações
            if (!nome || !cpf || !email || !telefone) {
                return res.status(400).json({ message: 'Dados incompletos' });
            }

            if (!validarCPF(cpf)) {
                return res.status(400).json({ message: 'CPF inválido' });
            }

            if (!validarEmail(email)) {
                return res.status(400).json({ message: 'Email inválido' });
            }

            if (!validarTelefone(telefone)) {
                return res.status(400).json({ message: 'Telefone inválido' });
            }

            // Verifica CPF duplicado
            const [clientesExistentes] = await db.query('SELECT id FROM clientes WHERE cpf = ?', [cpf]);
            if (clientesExistentes.length > 0) {
                return res.status(400).json({ message: 'CPF já cadastrado' });
            }

            // Insere cliente
            const [result] = await db.query(
                'INSERT INTO clientes (nome, cpf, email, telefone) VALUES (?, ?, ?, ?)',
                [nome, cpf, email, telefone]
            );

            res.status(201).json({
                message: 'Cliente criado com sucesso',
                id: result.insertId
            });
        } catch (error) {
            res.status(500).json({
                error: 'Erro interno do servidor',
                message: 'Erro ao criar cliente'
            });
        }
    }

    static async atualizar(req, res) {
        try {
            const { id } = req.params;
            const { nome, cpf, email, telefone } = req.body;

            // Verifica se cliente existe
            const [clienteExistente] = await db.query('SELECT id FROM clientes WHERE id = ?', [id]);
            if (clienteExistente.length === 0) {
                return res.status(404).json({ message: 'Cliente não encontrado' });
            }

            // Validações
            if (cpf && !validarCPF(cpf)) {
                return res.status(400).json({ message: 'CPF inválido' });
            }

            if (email && !validarEmail(email)) {
                return res.status(400).json({ message: 'Email inválido' });
            }

            if (telefone && !validarTelefone(telefone)) {
                return res.status(400).json({ message: 'Telefone inválido' });
            }

            // Verifica CPF duplicado se estiver sendo atualizado
            if (cpf) {
                const [cpfExistente] = await db.query(
                    'SELECT id FROM clientes WHERE cpf = ? AND id != ?',
                    [cpf, id]
                );
                if (cpfExistente.length > 0) {
                    return res.status(400).json({ message: 'CPF já cadastrado' });
                }
            }

            // Monta query de atualização
            const campos = [];
            const valores = [];
            if (nome) {
                campos.push('nome = ?');
                valores.push(nome);
            }
            if (cpf) {
                campos.push('cpf = ?');
                valores.push(cpf);
            }
            if (email) {
                campos.push('email = ?');
                valores.push(email);
            }
            if (telefone) {
                campos.push('telefone = ?');
                valores.push(telefone);
            }

            if (campos.length === 0) {
                return res.status(400).json({ message: 'Nenhum dado para atualizar' });
            }

            valores.push(id);
            await db.query(
                `UPDATE clientes SET ${campos.join(', ')} WHERE id = ?`,
                valores
            );

            res.status(200).json({ message: 'Cliente atualizado com sucesso' });
        } catch (error) {
            res.status(500).json({
                error: 'Erro interno do servidor',
                message: 'Erro ao atualizar cliente'
            });
        }
    }

    static async buscarHistorico(req, res) {
        try {
            const { id } = req.params;
            const [historico] = await db.query(
                `SELECT r.id, r.data_entrada, r.data_saida, r.status
                FROM reservas r
                WHERE r.cliente_id = ?
                ORDER BY r.data_entrada DESC`,
                [id]
            );
            res.status(200).json(historico);
        } catch (error) {
            res.status(500).json({
                error: 'Erro interno do servidor',
                message: 'Erro ao buscar histórico do cliente'
            });
        }
    }
}

module.exports = ClienteController; 