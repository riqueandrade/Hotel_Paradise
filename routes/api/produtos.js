const express = require('express');
const router = express.Router();
const ProdutoController = require('../../controllers/ProdutoController');
const { authMiddleware, authorize } = require('../../middlewares/auth');

// Aplica autenticação em todas as rotas
router.use(authMiddleware);

// Rotas de produtos com autorização específica
router.get('/', authorize(['produtos.visualizar']), ProdutoController.listar);
router.get('/estatisticas', authorize(['relatorios']), ProdutoController.buscarEstatisticas);
router.get('/:id', authorize(['produtos.visualizar']), ProdutoController.buscarPorId);
router.post('/', authorize(['produtos.gerenciar']), ProdutoController.criar);
router.put('/:id', authorize(['produtos.gerenciar', 'produtos.precos']), ProdutoController.atualizar);
router.delete('/:id', authorize(['produtos.gerenciar']), ProdutoController.excluir);
router.patch('/:id/estoque', authorize(['produtos.gerenciar']), ProdutoController.atualizarEstoque);

module.exports = router; 