const db = require('../database/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class AuthController {
    async login(req, res) {
        const { email, senha } = req.body;

        try {
            // Busca o usuário pelo email
            const [usuarios] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
            const usuario = usuarios[0];

            if (!usuario) {
                return res.status(401).json({ error: 'Usuário não encontrado' });
            }

            // Verifica a senha
            const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
            if (!senhaCorreta) {
                return res.status(401).json({ error: 'Senha incorreta' });
            }

            // Gera o token JWT
            const token = jwt.sign(
                { id: usuario.id, email: usuario.email },
                process.env.JWT_SECRET || 'hotel_paradise_secret',
                { expiresIn: '24h' }
            );

            // Remove a senha do objeto de resposta
            delete usuario.senha;

            res.json({
                usuario,
                token
            });
        } catch (error) {
            console.error('Erro no login:', error);
            res.status(500).json({ error: 'Erro ao realizar login' });
        }
    }

    async registro(req, res) {
        const { nome, email, senha } = req.body;

        try {
            // Verifica se o email já está em uso
            const [usuarios] = await db.query('SELECT id FROM usuarios WHERE email = ?', [email]);
            if (usuarios.length > 0) {
                return res.status(400).json({ error: 'Email já está em uso' });
            }

            // Hash da senha
            const salt = await bcrypt.genSalt(10);
            const senhaHash = await bcrypt.hash(senha, salt);

            // Insere o novo usuário
            const [resultado] = await db.query(
                'INSERT INTO usuarios (nome, email, senha, cargo) VALUES (?, ?, ?, ?)',
                [nome, email, senhaHash, 'funcionario']
            );

            // Gera o token JWT
            const token = jwt.sign(
                { id: resultado.insertId, email },
                process.env.JWT_SECRET || 'hotel_paradise_secret',
                { expiresIn: '24h' }
            );

            res.status(201).json({
                usuario: {
                    id: resultado.insertId,
                    nome,
                    email,
                    cargo: 'funcionario'
                },
                token
            });
        } catch (error) {
            console.error('Erro no registro:', error);
            res.status(500).json({ error: 'Erro ao registrar usuário' });
        }
    }

    async verificarToken(req, res) {
        // O middleware de autenticação já verificou o token
        res.json({ valid: true });
    }
}

module.exports = new AuthController(); 