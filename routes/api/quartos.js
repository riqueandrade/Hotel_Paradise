const express = require('express');
const router = express.Router();
const QuartoController = require('../../controllers/QuartoController');
const { authMiddleware, authorize } = require('../../middlewares/auth');

// Aplica autenticação em todas as rotas
router.use(authMiddleware);

// Rotas de quartos com autorização específica
router.get('/disponiveis', authorize(['quartos.visualizar']), QuartoController.buscarDisponiveis);
router.get('/', authorize(['quartos.visualizar']), QuartoController.listar);
router.get('/ocupacao', authorize(['relatorios']), QuartoController.buscarOcupacao);
router.get('/:id', authorize(['quartos.visualizar']), QuartoController.buscarPorId);
router.post('/', authorize(['quartos.gerenciar']), QuartoController.criar);
router.put('/:id', authorize(['quartos.gerenciar']), QuartoController.atualizar);
router.delete('/:id', authorize(['quartos.gerenciar']), QuartoController.excluir);
router.patch('/:id/status', authorize(['quartos.status', 'quartos.manutencao']), QuartoController.atualizarStatus);

module.exports = router; 