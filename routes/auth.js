const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const pool = require('../config/database');
const verifyToken = require('../middlewares/auth');

// Middleware para verificar o token JWT
router.get('/verify', verifyToken, (req, res) => {
    res.json({ valid: true, user: req.user });
});

// Login com email e senha
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Busca o usuário pelo email
        const [users] = await pool.execute(
            'SELECT u.*, c.nome as cargo_nome FROM usuarios u JOIN cargos c ON u.cargo_id = c.id WHERE u.email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ message: 'Email ou senha inválidos' });
        }

        const user = users[0];

        // Verifica se a senha está correta
        const validPassword = await bcrypt.compare(password, user.senha);
        if (!validPassword) {
            return res.status(401).json({ message: 'Email ou senha inválidos' });
        }

        // Gera o token JWT
        const token = jwt.sign(
            { 
                id: user.id,
                nome: user.nome,
                email: user.email,
                cargo: user.cargo_nome
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                nome: user.nome,
                email: user.email,
                cargo: user.cargo_nome
            }
        });
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

// Login com Google
router.get('/google',
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        prompt: 'select_account'
    })
);

// Callback do Google
router.get('/google/callback',
    passport.authenticate('google', { session: false }),
    (req, res) => {
        try {
            const token = jwt.sign(
                { 
                    id: req.user.id,
                    nome: req.user.nome,
                    email: req.user.email,
                    cargo: req.user.cargo_nome
                },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );
            
            // Redireciona para a página de sucesso com o token
            res.redirect(`/html/auth-success.html?token=${token}`);
        } catch (error) {
            console.error('Erro no callback do Google:', error);
            res.redirect('/html/auth-error.html');
        }
    }
);

module.exports = router; 