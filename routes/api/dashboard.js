const express = require('express');
const router = express.Router();
const DashboardController = require('../../controllers/DashboardController');
const { authMiddleware, authorize } = require('../../middlewares/auth');

// Aplica autenticação em todas as rotas
router.use(authMiddleware);

// Rota para buscar estatísticas do dashboard
router.get('/stats', authorize(['dashboard.basico', 'dashboard.financeiro']), DashboardController.getStats);

module.exports = router; 