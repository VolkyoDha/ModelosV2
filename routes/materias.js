const express = require('express');
const router = express.Router();
const materiasController = require('../controllers/materiasController');
const multer = require('multer');
const path = require('path');

// Configurar multer para subida de archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype === 'application/json') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos JSON'), false);
    }
  }
});

// Rutas para vistas
router.get('/', materiasController.index);
router.get('/create', materiasController.create);
router.post('/', materiasController.store);
router.get('/:id', materiasController.show);
router.get('/:id/edit', materiasController.edit);
router.put('/:id', materiasController.update);
router.delete('/:id', materiasController.destroy);

// Rutas especiales
router.get('/semestre/:semestre', materiasController.getBySemestre);
router.get('/load', materiasController.showLoadForm);
router.post('/load', upload.single('archivo'), materiasController.loadFromFile);
router.get('/resumen/semestral', materiasController.resumenSemestral);

// APIs
router.get('/api/all', materiasController.getAll);
router.get('/api/semestre/:semestre', materiasController.getBySemestreApi);
router.get('/api/:id/prerequisitos', materiasController.getPrerequisitos);

module.exports = router; 