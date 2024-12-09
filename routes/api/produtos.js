const express = require('express');
const router = express.Router();
const ProdutoController = require('../../controllers/ProdutoController');
const verifyToken = require('../../middlewares/auth');

// Rotas de produtos
router.get('/', verifyToken, ProdutoController.listar.bind(ProdutoController));
router.get('/estatisticas', verifyToken, ProdutoController.buscarEstatisticas.bind(ProdutoController));
router.get('/:id', verifyToken, ProdutoController.buscarPorId.bind(ProdutoController));
router.post('/', verifyToken, ProdutoController.criar.bind(ProdutoController));
router.put('/:id', verifyToken, ProdutoController.atualizar.bind(ProdutoController));
router.delete('/:id', verifyToken, ProdutoController.excluir.bind(ProdutoController));
router.patch('/:id/estoque', verifyToken, ProdutoController.atualizarEstoque.bind(ProdutoController));

module.exports = router; 