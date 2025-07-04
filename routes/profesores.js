const express = require('express');
const router = express.Router();
const profesoresController = require('../controllers/profesoresController');

// Rutas para vistas
router.get('/', profesoresController.index);
router.get('/create', profesoresController.create);
router.post('/', profesoresController.store);
router.get('/:id/edit', profesoresController.edit);
router.put('/:id', profesoresController.update);
router.delete('/:id', profesoresController.destroy);

// Rutas para horarios de profesores
router.post('/:id/horarios', profesoresController.addHorario);
router.delete('/:profesorId/horarios/:horarioId', profesoresController.removeHorario);
router.get('/:id/carga-horaria', profesoresController.getCargaHoraria);
router.post('/:id/check-conflictos', profesoresController.checkConflictos);

// API
router.get('/api/all', profesoresController.getAll);

// Ruta para mostrar un profesor específico (debe ir después de las rutas más específicas)
router.get('/:id', profesoresController.show);

module.exports = router; 