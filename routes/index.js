const express = require('express');
const router = express.Router();
const indexController = require('../controllers/indexController');

// Ruta principal - Dashboard
router.get('/', indexController.index);

// Ruta para estadísticas
router.get('/estadisticas', indexController.estadisticas);

// Ruta para búsqueda
router.get('/buscar', indexController.buscar);

// API para estadísticas
router.get('/api/estadisticas', indexController.getEstadisticasApi);

module.exports = router; 