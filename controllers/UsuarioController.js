const db = require('../database/db');
const bcrypt = require('bcryptjs');

class UsuarioController {
    async getPerfil(req, res) {
        try {
            const [usuarios] = await db.query(
                'SELECT id, nome, email, cargo FROM usuarios WHERE id = ?',
                [req.userId]
            );

            if (usuarios.length === 0) {
                return res.status(404).json({ error: 'Usuário não encontrado' });
            }

            res.json(usuarios[0]);
        } catch (error) {
            console.error('Erro ao buscar perfil:', error);
            res.status(500).json({ error: 'Erro ao buscar perfil' });
        }
    }

    async atualizarPerfil(req, res) {
        const { nome, email, senha } = req.body;

        try {
            // Verifica se o email já está em uso por outro usuário
            const [usuarios] = await db.query(
                'SELECT id FROM usuarios WHERE email = ? AND id != ?',
                [email, req.userId]
            );

            if (usuarios.length > 0) {
                return res.status(400).json({ error: 'Email já está em uso' });
            }

            // Prepara a query de atualização
            let query = 'UPDATE usuarios SET nome = ?, email = ?';
            let params = [nome, email];

            // Se uma nova senha foi fornecida, faz o hash
            if (senha) {
                const salt = await bcrypt.genSalt(10);
                const senhaHash = await bcrypt.hash(senha, salt);
                query += ', senha = ?';
                params.push(senhaHash);
            }

            query += ' WHERE id = ?';
            params.push(req.userId);

            // Executa a atualização
            await db.query(query, params);

            res.json({ message: 'Perfil atualizado com sucesso' });
        } catch (error) {
            console.error('Erro ao atualizar perfil:', error);
            res.status(500).json({ error: 'Erro ao atualizar perfil' });
        }
    }
}

module.exports = new UsuarioController(); 