const express = require('express');
const router = express.Router();
const passport = require('passport');
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
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
        // Gera o token JWT após autenticação bem-sucedida
        const token = AuthController.generateToken(req.user);
        // Redireciona para a página inicial com o token
        res.redirect(`/?token=${token}`);
    }
);

// Rotas protegidas
router.get('/verificar', authMiddleware, AuthController.verificarToken);

module.exports = router; 