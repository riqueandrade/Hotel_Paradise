const express = require('express');
const router = express.Router();
const QuartoController = require('../../controllers/QuartoController');
const verifyToken = require('../../middleware/verifyToken');

// Rota de teste
router.get('/teste', (req, res) => {
    res.json({ message: 'Rota de teste funcionando' });
});

// Rotas de quartos
router.get('/disponiveis', verifyToken, QuartoController.buscarDisponiveis.bind(QuartoController));
router.get('/', verifyToken, QuartoController.listar.bind(QuartoController));
router.get('/ocupacao', verifyToken, QuartoController.buscarOcupacao.bind(QuartoController));
router.get('/:id', verifyToken, QuartoController.buscarPorId.bind(QuartoController));
router.post('/', verifyToken, QuartoController.criar.bind(QuartoController));
router.put('/:id', verifyToken, QuartoController.atualizar.bind(QuartoController));
router.delete('/:id', verifyToken, QuartoController.excluir.bind(QuartoController));
router.patch('/:id/status', verifyToken, QuartoController.atualizarStatus.bind(QuartoController));

module.exports = router; 