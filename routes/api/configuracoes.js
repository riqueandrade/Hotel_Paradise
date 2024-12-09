const express = require('express');
const router = express.Router();
const multer = require('multer');
const ConfiguracaoController = require('../../controllers/ConfiguracaoController');
const authMiddleware = require('../../middlewares/auth');

const upload = multer({ storage: multer.memoryStorage() });

router.use(authMiddleware);

// Rotas de configurações
router.get('/', ConfiguracaoController.getConfiguracoes);
router.put('/', ConfiguracaoController.atualizarConfiguracoes);

// Rotas de backup
router.get('/backup', ConfiguracaoController.fazerBackup);
router.post('/backup/restaurar', upload.single('backup'), ConfiguracaoController.restaurarBackup);

module.exports = router; 