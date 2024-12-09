const express = require('express');
const router = express.Router();
const RelatorioController = require('../../controllers/RelatorioController');
const authMiddleware = require('../../middlewares/auth');

router.use(authMiddleware);

// Rota para obter relatórios
router.get('/', RelatorioController.getRelatorio.bind(RelatorioController));

module.exports = router; 