const Materia = require('../models/Materia');
const Profesor = require('../models/Profesor');

class MateriasController {
  // Mostrar lista de materias
  async index(req, res) {
    try {
      const materias = await Materia.getAll();
      res.render('materias/index', {
        title: 'Gestión de Materias',
        materias: materias
      });
    } catch (error) {
      res.render('error', {
        title: 'Error',
        message: 'Error al cargar materias: ' + error.message
      });
    }
  }

  // Mostrar formulario para crear materia
  async create(req, res) {
    try {
      const materias = await Materia.getAll();
      res.render('materias/create', {
        title: 'Agregar Materia',
        materias: materias // Para seleccionar prerequisitos
      });
    } catch (error) {
      res.render('error', {
        title: 'Error',
        message: 'Error al cargar formulario: ' + error.message
      });
    }
  }

  // Guardar nueva materia
  async store(req, res) {
    try {
      const materiaData = {
        codigo: req.body.codigo,
        nombre: req.body.nombre,
        creditos: req.body.creditos,
        semestre: req.body.semestre,
        horasTeoria: req.body.horasTeoria,
        horasPractica: req.body.horasPractica,
        horasLaboratorio: req.body.horasLaboratorio,
        prerequisitos: req.body.prerequisitos || [],
        descripcion: req.body.descripcion
      };

      await Materia.create(materiaData);
      req.flash = { success: 'Materia agregada exitosamente' };
      res.redirect('/materias');
    } catch (error) {
      const materias = await Materia.getAll();
      res.render('materias/create', {
        title: 'Agregar Materia',
        error: error.message,
        data: req.body,
        materias: materias
      });
    }
  }

  // Mostrar materia específica
  async show(req, res) {
    try {
      const materia = await Materia.getById(req.params.id);
      if (!materia) {
        return res.status(404).render('error', {
          title: 'Materia no encontrada',
          message: 'La materia solicitada no existe.'
        });
      }

      const prerequisitos = await Materia.getPrerequisitos(req.params.id);
      const totalHoras = await Materia.getTotalHoras(req.params.id);
      const horasSemestrales = await Materia.getHorasSemestrales(req.params.id);

      res.render('materias/show', {
        title: `Materia: ${materia.nombre}`,
        materia: materia,
        prerequisitos: prerequisitos,
        totalHoras: totalHoras,
        horasSemestrales: horasSemestrales
      });
    } catch (error) {
      res.render('error', {
        title: 'Error',
        message: 'Error al cargar materia: ' + error.message
      });
    }
  }

  // Mostrar formulario para editar materia
  async edit(req, res) {
    try {
      const materia = await Materia.getById(req.params.id);
      if (!materia) {
        return res.status(404).render('error', {
          title: 'Materia no encontrada',
          message: 'La materia solicitada no existe.'
        });
      }

      const materias = await Materia.getAll();
      res.render('materias/edit', {
        title: 'Editar Materia',
        materia: materia,
        materias: materias
      });
    } catch (error) {
      res.render('error', {
        title: 'Error',
        message: 'Error al cargar materia: ' + error.message
      });
    }
  }

  // Actualizar materia
  async update(req, res) {
    try {
      const materiaData = {
        codigo: req.body.codigo,
        nombre: req.body.nombre,
        creditos: req.body.creditos,
        semestre: req.body.semestre,
        horasTeoria: req.body.horasTeoria,
        horasPractica: req.body.horasPractica,
        horasLaboratorio: req.body.horasLaboratorio,
        prerequisitos: req.body.prerequisitos || [],
        descripcion: req.body.descripcion
      };

      await Materia.update(req.params.id, materiaData);
      req.flash = { success: 'Materia actualizada exitosamente' };
      res.redirect('/materias');
    } catch (error) {
      const materia = await Materia.getById(req.params.id);
      const materias = await Materia.getAll();
      res.render('materias/edit', {
        title: 'Editar Materia',
        materia: materia,
        materias: materias,
        error: error.message
      });
    }
  }

  // Eliminar materia
  async destroy(req, res) {
    try {
      await Materia.delete(req.params.id);
      res.json({ success: true, message: 'Materia eliminada exitosamente' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Mostrar materias por semestre
  async getBySemestre(req, res) {
    try {
      const semestre = req.params.semestre;
      const materias = await Materia.getBySemestre(semestre);
      
      res.render('materias/semestre', {
        title: `Materias del Semestre ${semestre}`,
        materias: materias,
        semestre: semestre
      });
    } catch (error) {
      res.render('error', {
        title: 'Error',
        message: 'Error al cargar materias del semestre: ' + error.message
      });
    }
  }

  // Cargar malla curricular desde archivo
  async loadFromFile(req, res) {
    try {
      if (!req.file) {
        return res.render('materias/load', {
          title: 'Cargar Malla Curricular',
          error: 'Por favor seleccione un archivo'
        });
      }

      const resultado = await Materia.loadFromFile(req.file.path);
      
      res.render('materias/load', {
        title: 'Cargar Malla Curricular',
        success: `Archivo cargado exitosamente. ${resultado.nuevas} materias nuevas agregadas, ${resultado.existentes} ya existían.`,
        resultado: resultado
      });
    } catch (error) {
      res.render('materias/load', {
        title: 'Cargar Malla Curricular',
        error: 'Error al cargar archivo: ' + error.message
      });
    }
  }

  // Mostrar formulario para cargar archivo
  async showLoadForm(req, res) {
    res.render('materias/load', {
      title: 'Cargar Malla Curricular'
    });
  }

  // Mostrar resumen semestral
  async resumenSemestral(req, res) {
    try {
      const resumen = await Materia.getResumenSemestral();
      
      res.render('materias/resumen', {
        title: 'Resumen Semestral de Materias',
        resumen: resumen
      });
    } catch (error) {
      res.render('error', {
        title: 'Error',
        message: 'Error al generar resumen: ' + error.message
      });
    }
  }

  // Obtener todas las materias (API)
  async getAll(req, res) {
    try {
      const materias = await Materia.getAll();
      res.json(materias);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Obtener materias por semestre (API)
  async getBySemestreApi(req, res) {
    try {
      const semestre = req.params.semestre;
      const materias = await Materia.getBySemestre(semestre);
      res.json(materias);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Obtener prerequisitos de una materia (API)
  async getPrerequisitos(req, res) {
    try {
      const prerequisitos = await Materia.getPrerequisitos(req.params.id);
      res.json(prerequisitos);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new MateriasController(); 