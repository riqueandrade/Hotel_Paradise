const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const AuthController = require('../../controllers/AuthController');
const { authMiddleware } = require('../../middlewares/auth');

// Rotas públicas
router.post('/login', async (req, res) => {
    try {
        console.log('Tentativa de login:', req.body.email);
        await AuthController.login(req, res);
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ 
            message: 'Erro interno do servidor',
            error: error.message 
        });
    }
});

router.post('/registro', async (req, res) => {
    try {
        await AuthController.registro(req, res);
    } catch (error) {
        console.error('Erro no registro:', error);
        res.status(500).json({ 
            message: 'Erro interno do servidor',
            error: error.message 
        });
    }
});

// Rotas do Google OAuth
router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/html/login.html' }),
    (req, res) => {
        try {
            console.log('User from Google:', req.user);

            // Gera o token JWT após autenticação bem-sucedida
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

            console.log('Token gerado:', token);
            console.log('Dados do usuário:', {
                id: req.user.id,
                nome: req.user.nome,
                email: req.user.email,
                cargo: req.user.cargo_nome
            });
            
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

// Rotas protegidas
router.get('/verify', authMiddleware, async (req, res) => {
    try {
        console.log('Verificando token para usuário:', req.userId);
        await AuthController.verificarToken(req, res);
    } catch (error) {
        console.error('Erro na verificação do token:', error);
        res.status(401).json({ 
            message: 'Erro na verificação do token',
            error: error.message 
        });
    }
});

module.exports = router; 