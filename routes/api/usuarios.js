const express = require('express');
const router = express.Router();
const UsuarioController = require('../../controllers/UsuarioController');
const auth = require('../../middlewares/auth');

// Rotas públicas
router.post('/login', UsuarioController.login);
router.post('/cadastro', UsuarioController.cadastrar);

// Rotas protegidas
router.use(auth);
router.get('/perfil', UsuarioController.getPerfil);
router.put('/perfil', UsuarioController.atualizarPerfil);
router.put('/senha', UsuarioController.alterarSenha);

module.exports = router; 