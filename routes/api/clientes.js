const express = require('express');
const router = express.Router();
const ClienteController = require('../../controllers/ClienteController');
const verifyToken = require('../../middleware/verifyToken');

// Rotas de clientes
router.get('/', verifyToken, ClienteController.listar);
router.get('/:id', verifyToken, ClienteController.buscarPorId);
router.post('/', verifyToken, ClienteController.criar);
router.put('/:id', verifyToken, ClienteController.atualizar);
router.delete('/:id', verifyToken, ClienteController.excluir);
router.get('/:id/historico', verifyToken, ClienteController.buscarHistorico);

module.exports = router; 