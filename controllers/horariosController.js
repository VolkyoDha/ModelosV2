const Horario = require('../models/Horario');
const Profesor = require('../models/Profesor');
const Materia = require('../models/Materia');
const horarioBacktracking = require('../modules/horarioBacktracking');

class HorariosController {
  // Mostrar página principal de horarios
  async index(req, res) {
    try {
      const profesores = await Profesor.getAll();
      const materias = await Materia.getAll();
      const resumen = await Horario.generarResumenHorario();
      
      res.render('horarios/index', {
        title: 'Gestión de Horarios',
        profesores: profesores,
        materias: materias,
        resumen: resumen
      });
    } catch (error) {
      res.render('error', {
        title: 'Error',
        message: 'Error al cargar horarios: ' + error.message
      });
    }
  }

  // Mostrar formulario para calcular horario sugerido
  async calcularForm(req, res) {
    try {
      const profesores = await Profesor.getAll();
      const materias = await Materia.getAll();
      
      res.render('horarios/calcular', {
        title: 'Calcular Horario Sugerido',
        profesores: profesores,
        materias: materias
      });
    } catch (error) {
      res.render('error', {
        title: 'Error',
        message: 'Error al cargar formulario: ' + error.message
      });
    }
  }

  // Calcular horario sugerido
  async calcular(req, res) {
    try {
      const materiasIds = req.body.materias || [];
      const profesoresIds = req.body.profesores || [];
      const maxHoursPerDay = parseInt(req.body.maxHoursPerDay) || 8;
      const preferredStartTime = parseInt(req.body.preferredStartTime) || 8;
      const preferredEndTime = parseInt(req.body.preferredEndTime) || 18;
      const avoidWeekends = req.body.avoidWeekends === 'on' || req.body.avoidWeekends === true;

      if (materiasIds.length === 0) {
        return res.render('horarios/calcular', {
          title: 'Calcular Horario Sugerido',
          error: 'Debe seleccionar al menos una materia',
          profesores: await Profesor.getAll(),
          materias: await Materia.getAll(),
          data: req.body
        });
      }

      if (profesoresIds.length === 0) {
        return res.render('horarios/calcular', {
          title: 'Calcular Horario Sugerido',
          error: 'Debe seleccionar al menos un profesor',
          profesores: await Profesor.getAll(),
          materias: await Materia.getAll(),
          data: req.body
        });
      }

      // Obtener datos completos
      const materiasAll = await Materia.getAll();
      const profesoresAll = await Profesor.getAll();
      const materias = materiasAll.filter(m => materiasIds.includes(m.id));
      const profesores = profesoresAll.filter(p => profesoresIds.includes(p.id));

      // Generar slots de horarios disponibles
      const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
      if (!avoidWeekends) dias.push('Sábado');
      const horariosDisponibles = [];
      for (const dia of dias) {
        for (let h = preferredStartTime; h + 1 <= preferredEndTime; h++) {
          if (h === 12) continue; // Saltar almuerzo
          horariosDisponibles.push({ dia, horaInicio: h, horaFin: h + 1 });
        }
      }

      // Mapear materias y profesores para el algoritmo
      const materiasInput = materias.map(m => ({
        nombre: m.nombre,
        codigo: m.codigo,
        semestre: m.semestre
      }));
      const profesoresInput = profesores.map(p => ({
        id: p.id,
        nombre: p.nombre + ' ' + (p.apellido || ''),
        tipo: p.tipo,
        maxHorasClase: p.maxHorasClase || 20,
        materias: p.materias || [],
        disponibilidad: p.disponibilidad || null
      }));

      // Ejecutar algoritmo de backtracking
      const resultado = horarioBacktracking.asignarHorariosBacktracking({
        profesores: profesoresInput,
        materias: materiasInput,
        horariosDisponibles,
        opciones: { avoidWeekends }
      });

      // Renderizar la misma vista con el resultado
      res.render('horarios/calcular', {
        title: 'Calcular Horario Sugerido',
        profesores: await Profesor.getAll(),
        materias: await Materia.getAll(),
        resultado
      });
    } catch (error) {
      res.render('error', {
        title: 'Error',
        message: 'Error al calcular horario: ' + error.message
      });
    }
  }

  // Mostrar horario completo
  async show(req, res) {
    try {
      const profesores = await Profesor.getAll();
      const materias = await Materia.getAll();
      const conflictos = await Horario.validarHorarioCompleto();
      const resumen = await Horario.generarResumenHorario();

      // Organizar horarios por día y hora
      const horariosOrganizados = this.organizarHorariosPorDia(profesores);

      res.render('horarios/show', {
        title: 'Horario Completo',
        profesores: profesores,
        materias: materias,
        horariosOrganizados: horariosOrganizados,
        conflictos: conflictos,
        resumen: resumen
      });
    } catch (error) {
      res.render('error', {
        title: 'Error',
        message: 'Error al mostrar horario: ' + error.message
      });
    }
  }

  // Mostrar resumen de carga horaria
  async resumen(req, res) {
    try {
      const resumen = await Horario.generarResumenHorario();
      
      res.render('horarios/resumen', {
        title: 'Resumen de Carga Horaria',
        resumen: resumen
      });
    } catch (error) {
      res.render('error', {
        title: 'Error',
        message: 'Error al generar resumen: ' + error.message
      });
    }
  }

  // Mostrar conflictos de horario
  async conflictos(req, res) {
    try {
      const conflictos = await Horario.validarHorarioCompleto();
      
      res.render('horarios/conflictos', {
        title: 'Conflictos de Horario',
        conflictos: conflictos
      });
    } catch (error) {
      res.render('error', {
        title: 'Error',
        message: 'Error al validar conflictos: ' + error.message
      });
    }
  }

  // Limpiar todos los horarios
  async limpiar(req, res) {
    try {
      const profesores = await Profesor.getAll();
      
      for (const profesor of profesores) {
        // Limpiar horarios del profesor
        profesor.horarios = [];
        await Profesor.saveAll(profesores);
      }

      res.json({ success: true, message: 'Todos los horarios han sido limpiados' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Exportar horario a JSON
  async exportar(req, res) {
    try {
      const profesores = await Profesor.getAll();
      const materias = await Materia.getAll();
      const resumen = await Horario.generarResumenHorario();

      const datosExportar = {
        fecha: new Date().toISOString(),
        profesores: profesores,
        materias: materias,
        resumen: resumen
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=horario.json');
      res.json(datosExportar);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Obtener horario en formato JSON (API)
  async getHorarioApi(req, res) {
    try {
      const profesores = await Profesor.getAll();
      const materias = await Materia.getAll();
      const resumen = await Horario.generarResumenHorario();

      res.json({
        profesores: profesores,
        materias: materias,
        resumen: resumen
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Obtener conflictos en formato JSON (API)
  async getConflictosApi(req, res) {
    try {
      const conflictos = await Horario.validarHorarioCompleto();
      res.json({ conflictos: conflictos });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Método auxiliar para organizar horarios por día
  organizarHorariosPorDia(profesores) {
    const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const horas = Array.from({length: 14}, (_, i) => i + 7); // 7:00 a 20:00
    const horariosOrganizados = {};

    // Inicializar estructura
    dias.forEach(dia => {
      horariosOrganizados[dia] = {};
      horas.forEach(hora => {
        horariosOrganizados[dia][hora] = [];
      });
    });

    // Llenar con horarios existentes
    profesores.forEach(profesor => {
      profesor.horarios.forEach(horario => {
        const dia = horario.dia;
        const horaInicio = parseInt(horario.horaInicio);
        const horaFin = parseInt(horario.horaFin);

        for (let hora = horaInicio; hora < horaFin; hora++) {
          if (horariosOrganizados[dia] && horariosOrganizados[dia][hora]) {
            horariosOrganizados[dia][hora].push({
              profesor: profesor,
              horario: horario
            });
          }
        }
      });
    });

    return horariosOrganizados;
  }

  // Mostrar vista de horario por profesor
  async horarioPorProfesor(req, res) {
    try {
      const profesorId = req.params.id;
      const profesor = await Profesor.getById(profesorId);
      
      if (!profesor) {
        return res.status(404).render('error', {
          title: 'Profesor no encontrado',
          message: 'El profesor solicitado no existe.'
        });
      }

      const cargaHoraria = await Profesor.getCargaHoraria(profesorId);
      const materias = await Materia.getAll();

      res.render('horarios/profesor', {
        title: `Horario de ${profesor.nombre} ${profesor.apellido}`,
        profesor: profesor,
        cargaHoraria: cargaHoraria,
        materias: materias
      });
    } catch (error) {
      res.render('error', {
        title: 'Error',
        message: 'Error al cargar horario del profesor: ' + error.message
      });
    }
  }

  // Mostrar vista de horario por materia
  async horarioPorMateria(req, res) {
    try {
      const materiaId = req.params.id;
      const materia = await Materia.getById(materiaId);
      
      if (!materia) {
        return res.status(404).render('error', {
          title: 'Materia no encontrada',
          message: 'La materia solicitada no existe.'
        });
      }

      const profesores = await Profesor.getAll();
      const horariosMateria = [];

      // Buscar todos los horarios de esta materia
      profesores.forEach(profesor => {
        profesor.horarios.forEach(horario => {
          if (horario.materiaId === materiaId) {
            horariosMateria.push({
              profesor: profesor,
              horario: horario
            });
          }
        });
      });

      res.render('horarios/materia', {
        title: `Horarios de ${materia.nombre}`,
        materia: materia,
        horarios: horariosMateria
      });
    } catch (error) {
      res.render('error', {
        title: 'Error',
        message: 'Error al cargar horarios de la materia: ' + error.message
      });
    }
  }
}

module.exports = new HorariosController(); 