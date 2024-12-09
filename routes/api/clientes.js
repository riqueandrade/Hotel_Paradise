const express = require('express');
const router = express.Router();
const ClienteController = require('../../controllers/ClienteController');
const { authMiddleware, authorize } = require('../../middlewares/auth');

// Aplica autenticação em todas as rotas
router.use(authMiddleware);

// Rotas de clientes com autorização específica
router.get('/', authorize(['clientes']), ClienteController.listar);
router.get('/:id', authorize(['clientes']), ClienteController.buscarPorId);
router.post('/', authorize(['clientes']), ClienteController.criar);
router.put('/:id', authorize(['clientes']), ClienteController.atualizar);
router.delete('/:id', authorize(['clientes']), ClienteController.excluir);
router.get('/:id/historico', authorize(['clientes']), ClienteController.buscarHistorico);

module.exports = router; 