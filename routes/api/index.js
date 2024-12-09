const express = require('express');
const router = express.Router();

// Importa as rotas
const reservasRoutes = require('./reservas');
const clientesRoutes = require('./clientes');
const quartosRoutes = require('./quartos');
const usuariosRoutes = require('./usuarios');

// Usa as rotas
router.use('/reservas', reservasRoutes);
router.use('/clientes', clientesRoutes);
router.use('/quartos', quartosRoutes);
router.use('/usuarios', usuariosRoutes);

module.exports = router; 