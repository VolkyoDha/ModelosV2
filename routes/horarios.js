const express = require('express');
const router = express.Router();
const horariosController = require('../controllers/horariosController');

// Rutas para vistas
router.get('/', horariosController.index);
router.get('/calcular', horariosController.calcularForm);
router.post('/calcular', horariosController.calcular);
router.get('/show', horariosController.show);
router.get('/resumen', horariosController.resumen);
router.get('/conflictos', horariosController.conflictos);

// Rutas para horarios específicos
router.get('/profesor/:id', horariosController.horarioPorProfesor);
router.get('/materia/:id', horariosController.horarioPorMateria);

// Rutas para acciones
router.post('/limpiar', horariosController.limpiar);
router.get('/exportar', horariosController.exportar);

// APIs
router.get('/api/horario', horariosController.getHorarioApi);
router.get('/api/conflictos', horariosController.getConflictosApi);

module.exports = router; 