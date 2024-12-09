const express = require('express');
const router = express.Router();
const DashboardController = require('../../controllers/DashboardController');
const verifyToken = require('../../middlewares/auth');

// Rota para buscar estatísticas do dashboard
router.get('/stats', verifyToken, DashboardController.getStats);

module.exports = router; 