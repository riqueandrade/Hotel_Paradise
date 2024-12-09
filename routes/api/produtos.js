const express = require('express');
const router = express.Router();
const ProdutoController = require('../../controllers/ProdutoController');
const { authMiddleware, authorize } = require('../../middlewares/auth');

// Aplica autenticação em todas as rotas
router.use(authMiddleware);

// Rotas de produtos com autorização específica
router.get('/', authorize(['produtos', 'consumos']), ProdutoController.listar);
router.get('/estatisticas', authorize(['produtos', 'relatorios']), ProdutoController.buscarEstatisticas);
router.get('/:id', authorize(['produtos', 'consumos']), ProdutoController.buscarPorId);
router.post('/', authorize(['produtos']), ProdutoController.criar);
router.put('/:id', authorize(['produtos']), ProdutoController.atualizar);
router.delete('/:id', authorize(['produtos']), ProdutoController.excluir);
router.patch('/:id/estoque', authorize(['produtos']), ProdutoController.atualizarEstoque);

module.exports = router; 