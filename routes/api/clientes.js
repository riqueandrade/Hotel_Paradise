const express = require('express');
const router = express.Router();
const ClienteController = require('../../controllers/ClienteController');
const { authMiddleware, authorize } = require('../../middlewares/auth');

// Aplica autenticação em todas as rotas
router.use(authMiddleware);

// Rotas de clientes com autorização específica
router.get('/', authorize(['clientes.visualizar']), ClienteController.listar);
router.get('/:id', authorize(['clientes.visualizar']), ClienteController.buscarPorId);
router.post('/', authorize(['clientes.criar']), ClienteController.criar);
router.put('/:id', authorize(['clientes.editar']), ClienteController.atualizar);
router.delete('/:id', authorize(['clientes.gerenciar']), ClienteController.excluir);
router.get('/:id/historico', authorize(['clientes.visualizar']), ClienteController.buscarHistorico);

module.exports = router; 