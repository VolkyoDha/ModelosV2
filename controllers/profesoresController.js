const Profesor = require('../models/Profesor');
const Materia = require('../models/Materia');

class ProfesoresController {
  // Mostrar lista de profesores
  async index(req, res) {
    try {
      const profesores = await Profesor.getAll();
      res.render('profesores/index', {
        title: 'Gestión de Profesores',
        profesores: profesores
      });
    } catch (error) {
      res.render('error', {
        title: 'Error',
        message: 'Error al cargar profesores: ' + error.message
      });
    }
  }

  // Mostrar formulario para crear profesor
  async create(req, res) {
    res.render('profesores/create', {
      title: 'Agregar Profesor',
      data: {},
      error: null
    });
  }

  // Guardar nuevo profesor
  async store(req, res) {
    try {
      const profesorData = {
        nombre: req.body.nombre,
        apellido: req.body.apellido,
        email: req.body.email,
        especialidad: req.body.especialidad,
        maxHorasSemana: req.body.maxHorasSemana
      };

      await Profesor.create(profesorData);
      req.flash('success', 'Profesor agregado exitosamente');
      res.redirect('/profesores');
    } catch (error) {
      res.render('profesores/create', {
        title: 'Agregar Profesor',
        error: error.message,
        data: req.body
      });
    }
  }

  // Mostrar profesor específico
  async show(req, res) {
    try {
      const profesor = await Profesor.getById(req.params.id);
      if (!profesor) {
        return res.status(404).render('error', {
          title: 'Profesor no encontrado',
          message: 'El profesor solicitado no existe.'
        });
      }

      const cargaHoraria = await Profesor.getCargaHoraria(req.params.id);
      const materias = await Materia.getAll();
      
      // Detectar conflictos de horario
      const conflictos = await Profesor.checkConflictos(req.params.id, {});

      res.render('profesores/show', {
        title: `Profesor: ${profesor.nombre} ${profesor.apellido}`,
        profesor: profesor,
        cargaHoraria: cargaHoraria,
        materias: materias,
        conflictos: conflictos || []
      });
    } catch (error) {
      res.render('error', {
        title: 'Error',
        message: 'Error al cargar profesor: ' + error.message
      });
    }
  }

  // Mostrar formulario para editar profesor
  async edit(req, res) {
    try {
      const profesor = await Profesor.getById(req.params.id);
      if (!profesor) {
        return res.status(404).render('error', {
          title: 'Profesor no encontrado',
          message: 'El profesor solicitado no existe.'
        });
      }

      res.render('profesores/edit', {
        title: 'Editar Profesor',
        profesor: profesor
      });
    } catch (error) {
      res.render('error', {
        title: 'Error',
        message: 'Error al cargar profesor: ' + error.message
      });
    }
  }

  // Actualizar profesor
  async update(req, res) {
    try {
      console.log('=== INICIO ACTUALIZACIÓN PROFESOR ===');
      console.log('ID del profesor:', req.params.id);
      console.log('Tipo de ID:', typeof req.params.id);
      console.log('Datos recibidos:', req.body);
      
      // Validar que el profesor existe antes de actualizar
      const profesorExistente = await Profesor.getById(req.params.id);
      if (!profesorExistente) {
        console.log('Profesor no encontrado en la base de datos');
        req.flash('error', 'Profesor no encontrado');
        return res.redirect('/profesores');
      }
      
      console.log('Profesor encontrado:', profesorExistente);
      
      const profesorData = {
        nombre: req.body.nombre,
        apellido: req.body.apellido,
        email: req.body.email,
        especialidad: req.body.especialidad,
        maxHorasSemana: req.body.maxHorasSemana
      };

      console.log('Datos a actualizar:', profesorData);
      
      const profesorActualizado = await Profesor.update(req.params.id, profesorData);
      console.log('Profesor actualizado exitosamente:', profesorActualizado);
      
      req.flash('success', 'Profesor actualizado exitosamente');
      console.log('=== FIN ACTUALIZACIÓN PROFESOR ===');
      res.redirect(`/profesores/${req.params.id}`);
    } catch (error) {
      console.error('=== ERROR EN ACTUALIZACIÓN ===');
      console.error('Error completo:', error);
      console.error('Stack trace:', error.stack);
      
      // Intentar obtener el profesor para mostrar el formulario con error
      try {
        const profesor = await Profesor.getById(req.params.id);
        res.render('profesores/edit', {
          title: 'Editar Profesor',
          profesor: profesor,
          error: error.message
        });
      } catch (getError) {
        console.error('Error al obtener profesor para mostrar formulario:', getError);
        req.flash('error', 'Error al cargar profesor: ' + error.message);
        res.redirect('/profesores');
      }
    }
  }

  // Eliminar profesor
  async destroy(req, res) {
    try {
      await Profesor.delete(req.params.id);
      res.json({ success: true, message: 'Profesor eliminado exitosamente' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Agregar horario a profesor
  async addHorario(req, res) {
    try {
      const horarioData = {
        materiaId: req.body.materiaId,
        dia: req.body.dia,
        horaInicio: req.body.horaInicio,
        horaFin: req.body.horaFin,
        tipo: req.body.tipo
      };

      // Verificar conflictos antes de agregar
      const conflictos = await Profesor.checkConflictos(req.params.id, horarioData);
      
      if (conflictos.length > 0) {
        return res.json({
          success: false,
          conflictos: conflictos,
          message: 'Existen conflictos de horario'
        });
      }

      await Profesor.addHorario(req.params.id, horarioData);
      res.json({ success: true, message: 'Horario agregado exitosamente' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Eliminar horario de profesor
  async removeHorario(req, res) {
    try {
      await Profesor.removeHorario(req.params.profesorId, req.params.horarioId);
      res.json({ success: true, message: 'Horario eliminado exitosamente' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Obtener carga horaria de profesor
  async getCargaHoraria(req, res) {
    try {
      const cargaHoraria = await Profesor.getCargaHoraria(req.params.id);
      res.json(cargaHoraria);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Verificar conflictos de horario
  async checkConflictos(req, res) {
    try {
      const horarioData = {
        dia: req.body.dia,
        horaInicio: req.body.horaInicio,
        horaFin: req.body.horaFin
      };

      const conflictos = await Profesor.checkConflictos(req.params.id, horarioData);
      res.json({ conflictos: conflictos });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Obtener todos los profesores (API)
  async getAll(req, res) {
    try {
      const profesores = await Profesor.getAll();
      res.json(profesores);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new ProfesoresController(); 