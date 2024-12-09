const express = require('express');
const router = express.Router();
const multer = require('multer');
const ConfiguracaoController = require('../../controllers/ConfiguracaoController');
const { authMiddleware, authorize } = require('../../middlewares/auth');

const upload = multer({ storage: multer.memoryStorage() });

// Aplica autenticação em todas as rotas
router.use(authMiddleware);

// Rotas de configurações com autorização específica
router.get('/', authorize(['configuracoes']), ConfiguracaoController.getConfiguracoes);
router.put('/', authorize(['configuracoes']), ConfiguracaoController.atualizarConfiguracoes);

// Rotas de backup
router.get('/backup', authorize(['configuracoes']), ConfiguracaoController.fazerBackup);
router.post('/backup/restaurar', authorize(['configuracoes']), upload.single('backup'), ConfiguracaoController.restaurarBackup);

module.exports = router; 