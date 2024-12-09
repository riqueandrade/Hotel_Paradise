const express = require('express');
const router = express.Router();
const UsuarioController = require('../../controllers/UsuarioController');
const { authMiddleware, authorize } = require('../../middlewares/auth');

// Rotas públicas
router.post('/login', UsuarioController.login);
router.post('/cadastro', UsuarioController.cadastrar);

// Rotas protegidas
router.use(authMiddleware);
router.get('/perfil', authorize(['*']), UsuarioController.getPerfil);
router.put('/perfil', authorize(['*']), UsuarioController.atualizarPerfil);
router.put('/senha', authorize(['*']), UsuarioController.alterarSenha);

module.exports = router; 