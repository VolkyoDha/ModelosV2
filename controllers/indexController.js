const Profesor = require('../models/Profesor');
const Materia = require('../models/Materia');
const Horario = require('../models/Horario');

class IndexController {
  // Mostrar página de inicio
  async index(req, res) {
    try {
      const profesores = await Profesor.getAll();
      const materias = await Materia.getAll();
      const resumen = await Horario.generarResumenHorario();
      const conflictos = await Horario.validarHorarioCompleto();

      // Asegurar que los arrays existan
      const profesoresArray = Array.isArray(profesores) ? profesores : [];
      const materiasArray = Array.isArray(materias) ? materias : [];
      const resumenObj = resumen || { profesores: [], materias: [], totalHoras: 0 };
      const conflictosArray = Array.isArray(conflictos) ? conflictos : [];

      // Estadísticas rápidas
      const estadisticas = {
        totalProfesores: profesoresArray.length,
        totalMaterias: materiasArray.length,
        totalHoras: resumenObj.totalHoras || 0,
        conflictos: conflictosArray.length,
        materiasCompletadas: (resumenObj.materias || []).filter(m => m && m.completado).length,
        materiasPendientes: (resumenObj.materias || []).filter(m => m && !m.completado).length
      };

      // Profesores con mayor carga
      const profesoresConCarga = (resumenObj.profesores || [])
        .filter(p => p && typeof p.horasAsignadas === 'number')
        .sort((a, b) => b.horasAsignadas - a.horasAsignadas)
        .slice(0, 5);

      // Materias por semestre
      const materiasPorSemestre = {};
      materiasArray.forEach(materia => {
        if (materia && materia.semestre) {
          if (!materiasPorSemestre[materia.semestre]) {
            materiasPorSemestre[materia.semestre] = [];
          }
          materiasPorSemestre[materia.semestre].push(materia);
        }
      });

      res.render('index', {
        title: 'Dashboard - Gestión de Horarios',
        estadisticas: estadisticas,
        profesoresConCarga: profesoresConCarga,
        materiasPorSemestre: materiasPorSemestre,
        conflictos: conflictosArray.slice(0, 5), // Solo mostrar los primeros 5 conflictos
        resumen: resumenObj
      });
    } catch (error) {
      console.error('Error en index controller:', error);
      res.render('error', {
        title: 'Error',
        message: 'Error al cargar la página principal: ' + error.message
      });
    }
  }

  // Mostrar página de ayuda/documentación
  async ayuda(req, res) {
    res.render('ayuda', {
      title: 'Ayuda y Documentación'
    });
  }

  // Mostrar página de configuración
  async configuracion(req, res) {
    res.render('configuracion', {
      title: 'Configuración del Sistema'
    });
  }

  // Mostrar página de estadísticas
  async estadisticas(req, res) {
    try {
      const profesores = await Profesor.getAll();
      const materias = await Materia.getAll();
      const resumen = await Horario.generarResumenHorario();
      const conflictos = await Horario.validarHorarioCompleto();

      // Estadísticas detalladas
      const estadisticas = {
        profesores: {
          total: profesores.length,
          conHorarios: profesores.filter(p => p.horarios.length > 0).length,
          sinHorarios: profesores.filter(p => p.horarios.length === 0).length,
          promedioHoras: resumen.profesores.length > 0 ? 
            Math.round(resumen.profesores.reduce((sum, p) => sum + p.horasAsignadas, 0) / resumen.profesores.length) : 0
        },
        materias: {
          total: materias.length,
          completadas: resumen.materias.filter(m => m.completado).length,
          pendientes: resumen.materias.filter(m => !m.completado).length,
          porSemestre: {}
        },
        horarios: {
          totalHoras: resumen.totalHoras,
          distribucionPorDia: resumen.distribucionPorDia,
          distribucionPorTipo: resumen.distribucionPorTipo,
          conflictos: conflictos.length
        }
      };

      // Materias por semestre
      materias.forEach(materia => {
        if (!estadisticas.materias.porSemestre[materia.semestre]) {
          estadisticas.materias.porSemestre[materia.semestre] = 0;
        }
        estadisticas.materias.porSemestre[materia.semestre]++;
      });

      res.render('estadisticas', {
        title: 'Estadísticas del Sistema',
        estadisticas: estadisticas,
        resumen: resumen,
        conflictos: conflictos
      });
    } catch (error) {
      res.render('error', {
        title: 'Error',
        message: 'Error al cargar estadísticas: ' + error.message
      });
    }
  }

  // Mostrar página de búsqueda
  async buscar(req, res) {
    const query = req.query.q || '';
    const tipo = req.query.tipo || 'todos';

    try {
      let resultados = [];

      if (query.trim()) {
        if (tipo === 'profesores' || tipo === 'todos') {
          const profesores = await Profesor.getAll();
          const profesoresFiltrados = profesores.filter(p => 
            p.nombre.toLowerCase().includes(query.toLowerCase()) ||
            p.apellido.toLowerCase().includes(query.toLowerCase()) ||
            p.especialidad.toLowerCase().includes(query.toLowerCase()) ||
            p.email.toLowerCase().includes(query.toLowerCase())
          );
          resultados.push(...profesoresFiltrados.map(p => ({
            tipo: 'profesor',
            id: p.id,
            titulo: `${p.nombre} ${p.apellido}`,
            subtitulo: p.especialidad,
            descripcion: p.email
          })));
        }

        if (tipo === 'materias' || tipo === 'todos') {
          const materias = await Materia.getAll();
          const materiasFiltradas = materias.filter(m => 
            m.nombre.toLowerCase().includes(query.toLowerCase()) ||
            m.codigo.toLowerCase().includes(query.toLowerCase()) ||
            m.descripcion.toLowerCase().includes(query.toLowerCase())
          );
          resultados.push(...materiasFiltradas.map(m => ({
            tipo: 'materia',
            id: m.id,
            titulo: m.nombre,
            subtitulo: `Código: ${m.codigo}`,
            descripcion: `Semestre ${m.semestre} - ${m.creditos} créditos`
          })));
        }
      }

      res.render('buscar', {
        title: 'Búsqueda',
        query: query,
        tipo: tipo,
        resultados: resultados
      });
    } catch (error) {
      res.render('error', {
        title: 'Error',
        message: 'Error en la búsqueda: ' + error.message
      });
    }
  }

  // API para obtener estadísticas rápidas
  async getEstadisticasApi(req, res) {
    try {
      const profesores = await Profesor.getAll();
      const materias = await Materia.getAll();
      const resumen = await Horario.generarResumenHorario();
      const conflictos = await Horario.validarHorarioCompleto();

      const estadisticas = {
        profesores: profesores.length,
        materias: materias.length,
        totalHoras: resumen.totalHoras,
        conflictos: conflictos.length,
        materiasCompletadas: resumen.materias.filter(m => m.completado).length,
        materiasPendientes: resumen.materias.filter(m => !m.completado).length
      };

      res.json(estadisticas);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new IndexController(); 