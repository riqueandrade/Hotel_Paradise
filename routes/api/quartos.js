const express = require('express');
const router = express.Router();
const QuartoController = require('../../controllers/QuartoController');
const { authMiddleware, authorize } = require('../../middlewares/auth');

// Aplica autenticação em todas as rotas
router.use(authMiddleware);

// Rotas de quartos com autorização específica
router.get('/disponiveis', authorize(['quartos']), QuartoController.buscarDisponiveis);
router.get('/', authorize(['quartos']), QuartoController.listar);
router.get('/ocupacao', authorize(['quartos']), QuartoController.buscarOcupacao);
router.get('/:id', authorize(['quartos']), QuartoController.buscarPorId);
router.post('/', authorize(['quartos']), QuartoController.criar);
router.put('/:id', authorize(['quartos']), QuartoController.atualizar);
router.delete('/:id', authorize(['quartos']), QuartoController.excluir);
router.patch('/:id/status', authorize(['quartos']), QuartoController.atualizarStatus);

module.exports = router; 