const express = require('express');
const router = express.Router();
const ReservaController = require('../../controllers/ReservaController');
const verifyToken = require('../../middleware/verifyToken');

// Rotas de reservas
router.get('/', verifyToken, ReservaController.listar);
router.get('/estatisticas', verifyToken, ReservaController.buscarEstatisticas);
router.get('/:id', verifyToken, ReservaController.buscarPorId);
router.post('/', verifyToken, ReservaController.criar);
router.put('/:id', verifyToken, ReservaController.atualizar);
router.post('/:id/checkin', verifyToken, ReservaController.realizarCheckin);
router.post('/:id/checkout', verifyToken, ReservaController.realizarCheckout);
router.post('/:id/cancelar', verifyToken, ReservaController.cancelar);

module.exports = router; 