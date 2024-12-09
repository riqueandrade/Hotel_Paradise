const express = require('express');
const router = express.Router();
const AuthController = require('../../controllers/AuthController');
const authMiddleware = require('../../middlewares/auth');

// Rotas públicas
router.post('/login', AuthController.login);
router.post('/registro', AuthController.registro);

// Rotas protegidas
router.get('/verificar', authMiddleware, AuthController.verificarToken);

module.exports = router; 