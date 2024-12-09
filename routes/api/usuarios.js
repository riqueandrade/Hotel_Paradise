const express = require('express');
const router = express.Router();
const UsuarioController = require('../../controllers/UsuarioController');
const authMiddleware = require('../../middlewares/auth');

router.use(authMiddleware);

// Rotas do perfil
router.get('/perfil', UsuarioController.getPerfil);
router.put('/perfil', UsuarioController.atualizarPerfil);

module.exports = router; 