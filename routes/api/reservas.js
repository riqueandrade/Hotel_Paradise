const express = require('express');
const router = express.Router();
const ReservaController = require('../../controllers/ReservaController');
const { authMiddleware, authorize } = require('../../middlewares/auth');

// Aplica autenticação em todas as rotas
router.use(authMiddleware);

// Rotas de reservas com autorização específica
router.get('/', authorize(['reservas']), ReservaController.listar);
router.get('/estatisticas', authorize(['reservas']), ReservaController.buscarEstatisticas);
router.get('/:id', authorize(['reservas']), ReservaController.buscarPorId);
router.post('/', authorize(['reservas']), ReservaController.criar);
router.put('/:id', authorize(['reservas']), ReservaController.atualizar);
router.post('/:id/checkin', authorize(['reservas', 'checkin']), ReservaController.realizarCheckin);
router.post('/:id/checkout', authorize(['reservas', 'checkout']), ReservaController.realizarCheckout);
router.post('/:id/cancelar', authorize(['reservas']), ReservaController.cancelar);

module.exports = router; 