const express = require('express');
const router = express.Router();
const UsuarioController = require('../../controllers/UsuarioController');
const verifyToken = require('../../middleware/verifyToken');

// Rotas públicas
router.post('/login', UsuarioController.login);
router.post('/registrar', UsuarioController.registrar);

// Rotas protegidas
router.get('/me', verifyToken, UsuarioController.buscarUsuarioAtual);
router.put('/me', verifyToken, UsuarioController.atualizarPerfil);

// Rotas administrativas (requerem token e cargo de admin)
router.get('/', verifyToken, UsuarioController.listar);
router.delete('/:id', verifyToken, UsuarioController.excluir);

module.exports = router; 