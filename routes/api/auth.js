const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const AuthController = require('../../controllers/AuthController');
const authMiddleware = require('../../middlewares/auth');

// Rotas públicas
router.post('/login', AuthController.login);
router.post('/registro', AuthController.registro);

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
                { id: req.user.id, email: req.user.email },
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

// Rotas protegidas
router.get('/verificar', authMiddleware, AuthController.verificarToken);

module.exports = router; 