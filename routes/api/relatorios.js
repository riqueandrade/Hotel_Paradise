const express = require('express');
const router = express.Router();
const RelatorioController = require('../../controllers/RelatorioController');
const { authMiddleware, authorize } = require('../../middlewares/auth');

// Aplica autenticação em todas as rotas
router.use(authMiddleware);

// Rotas de relatórios com autorização específica
router.get('/', authorize(['relatorios']), RelatorioController.getRelatorio);

module.exports = router; 