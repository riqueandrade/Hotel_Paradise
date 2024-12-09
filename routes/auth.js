const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const pool = require('../config/database');
const { authMiddleware } = require('../middlewares/auth');

// Middleware para verificar o token JWT
router.get('/verify', authMiddleware, async (req, res) => {
    try {
        // Busca o usuário pelo ID
        const [users] = await pool.execute(
            'SELECT u.*, c.nome as cargo_nome FROM usuarios u JOIN cargos c ON u.cargo_id = c.id WHERE u.id = ?',
            [req.userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        const user = users[0];

        res.json({
            valid: true,
            user: {
                id: user.id,
                nome: user.nome,
                email: user.email,
                cargo: user.cargo_nome
            }
        });
    } catch (error) {
        console.error('Erro ao verificar token:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
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
            process.env.JWT_SECRET || 'hotel_paradise_secret',
            { expiresIn: '24h' }
        );

        console.log('Token gerado:', token);
        console.log('Dados do usuário:', {
            id: user.id,
            nome: user.nome,
            email: user.email,
            cargo: user.cargo_nome
        });

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
                process.env.JWT_SECRET || 'hotel_paradise_secret',
                { expiresIn: '24h' }
            );
            
            // Redireciona para uma página que salvará o token e redirecionará para o dashboard
            res.send(`
                <html>
                <body>
                    <script>
                        try {
                            // Salva o token no localStorage
                            localStorage.setItem('token', '${token}');
                            console.log('Token salvo:', '${token}');
                            // Redireciona para o dashboard
                            window.location.href = '/html/dashboard.html';
                        } catch (error) {
                            console.error('Erro ao salvar token:', error);
                            alert('Erro ao fazer login. Por favor, tente novamente.');
                            window.location.href = '/html/login.html';
                        }
                    </script>
                </body>
                </html>
            `);
        } catch (error) {
            console.error('Erro no callback do Google:', error);
            res.redirect('/html/login.html');
        }
    }
);

module.exports = router; 