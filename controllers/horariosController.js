const Horario = require('../models/Horario');
const Profesor = require('../models/Profesor');
const Materia = require('../models/Materia');
const horarioBacktracking = require('../modules/horarioBacktracking');

class HorariosController {
  // Genera un color consistente basado en el ID del profesor
  getRandomColor(id) {
    // Convertir el ID a un número si es string
    const numericId = typeof id === 'string' ? id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : parseInt(id, 10);
    
    // Lista de colores predefinidos para el calendario
    const colors = [
      '#4285F4', // Google Blue
      '#EA4335', // Google Red
      '#FBBC05', // Google Yellow
      '#34A853', // Google Green
      '#673AB7', // Deep Purple
      '#3F51B5', // Indigo
      '#2196F3', // Blue
      '#009688', // Teal
      '#4CAF50', // Green
      '#8BC34A', // Light Green
      '#CDDC39', // Lime
      '#FFC107', // Amber
      '#FF9800', // Orange
      '#FF5722', // Deep Orange
      '#795548', // Brown
      '#607D8B'  // Blue Grey
    ];
    
    // Usar el ID para seleccionar un color de manera consistente
    return colors[Math.abs(numericId) % colors.length];
  }
  // Mostrar página principal de horarios
  async index(req, res) {
    try {
      const profesores = await Profesor.getAll();
      const materias = await Materia.getAll();
      const resumen = await Horario.generarResumenHorario();
      const conflictos = await Horario.validarHorarioCompleto();
      
      // Calcular estadísticas para la vista
      const totalHorarios = profesores.reduce((total, profesor) => {
        return total + (profesor.horarios ? profesor.horarios.length : 0);
      }, 0);
      
      const profesoresConHorarios = profesores.filter(profesor => {
        return profesor.horarios && profesor.horarios.length > 0;
      }).length;
      
      const conflictosDetectados = conflictos.length;
      
      // Calcular porcentaje de materias con horarios completos
      const materiasConHorariosCompletos = materias.filter(materia => {
        const horasNecesarias = materia.horasTeoria + materia.horasPractica + materia.horasLaboratorio;
        const horasAsignadas = resumen.materias.find(m => m.id === materia.id)?.horasAsignadas || 0;
        return horasAsignadas >= horasNecesarias;
      }).length;
      
      const porcentajeCompletado = materias.length > 0 ? 
        Math.round((materiasConHorariosCompletos / materias.length) * 100) : 0;
      
      // Preparar datos para la vista semanal
      const allHorarios = [];
      profesores.forEach(profesor => {
        if (profesor.horarios && profesor.horarios.length > 0) {
          profesor.horarios.forEach(horario => {
            const materia = materias.find(m => m.id === horario.materiaId);
            allHorarios.push({
              ...horario,
              profesorNombre: `${profesor.nombre} ${profesor.apellido || ''}`,
              materiaNombre: materia ? materia.nombre : 'Desconocida'
            });
          });
        }
      });
      
      // Enriquecer los datos de profesores con sus materias asignadas para la vista
      const profesoresConMaterias = profesores.map(profesor => {
        // Crear un Set para evitar materias duplicadas
        const materiasIds = new Set();
        const materiasAsignadas = [];
        
        if (profesor.horarios && profesor.horarios.length > 0) {
          profesor.horarios.forEach(horario => {
            if (!materiasIds.has(horario.materiaId)) {
              const materia = materias.find(m => m.id === horario.materiaId);
              if (materia) {
                materiasIds.add(horario.materiaId);
                materiasAsignadas.push({
                  id: materia.id,
                  nombre: materia.nombre
                });
              }
            }
          });
        }
        
        return {
          ...profesor,
          materias: materiasAsignadas
        };
      });
      
      // Enriquecer los datos de profesores con sus materias asignadas
      profesores.forEach(profesor => {
        if (profesor.horarios && profesor.horarios.length > 0) {
          const materiasIds = [...new Set(profesor.horarios.map(h => h.materiaId))];
          profesor.materias = materiasIds.map(id => {
            const materia = materias.find(m => m.id === id);
            return materia ? { id: materia.id, nombre: materia.nombre } : null;
          }).filter(Boolean);
        } else {
          profesor.materias = [];
        }
      });
      
      // Generar archivo de recursos para el calendario
      try {
        const fs = require('fs');
        const path = require('path');
        const ejs = require('ejs');
        
        // Verificar si existe la plantilla
        const templatePath = path.join(__dirname, '../views/horarios/resourcesTemplate.ejs');
        if (fs.existsSync(templatePath)) {
          const resourcesTemplate = fs.readFileSync(templatePath, 'utf8');
          const resourcesContent = ejs.render(resourcesTemplate, { profesores });
          fs.writeFileSync(path.join(__dirname, '../public/js/resourcesData.js'), resourcesContent);
          console.log('Archivo resourcesData.js generado correctamente');
        } else {
          console.error('No se encontró la plantilla de recursos');
        }
      } catch (error) {
        console.error('Error al generar el archivo de recursos:', error);
      }
      
      // Asegurarse de que todos los datos necesarios estén disponibles
      res.render('horarios/index', {
        title: 'Gestión de Horarios',
        profesores: profesores || [],
        materias: materias || [],
        resumen: resumen || { profesores: [], materias: [] },
        totalHorarios: totalHorarios || 0,
        profesoresConHorarios: profesoresConHorarios || 0,
        conflictosDetectados: conflictosDetectados || 0,
        porcentajeCompletado: porcentajeCompletado || 0,
        allHorarios: allHorarios || []
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

  // Mostrar el resultado del cálculo de horarios
  async mostrarResultadoCalculo(req, res) {
    try {
      const { profesoresCalendar, horarioEvents, mensajeResultado } = req.session;
      
      // Si no hay datos en la sesión, redirigir a la página de cálculo
      if (!profesoresCalendar || !horarioEvents) {
        req.flash('warning', 'No hay resultados de cálculo disponibles. Por favor, realice un nuevo cálculo.');
        return res.redirect('/horarios/calcular');
      }
      
      res.render('horarios/resultado', {
        title: 'Resultado del Cálculo de Horarios',
        profesoresCalendar,
        horarioEvents,
        mensajeResultado
      });
    } catch (error) {
      console.error('Error al mostrar resultado del cálculo:', error);
      req.flash('error', 'Error al mostrar el resultado del cálculo.');
      res.redirect('/horarios');
    }
  }
  
  // API para obtener datos del horario mediante AJAX
  async getDatosHorario(req, res) {
    try {
      const { profesoresCalendar, horarioEvents, mensajeResultado } = req.session;
      
      // Si no hay datos en la sesión, devolver datos vacíos
      if (!profesoresCalendar || !horarioEvents) {
        return res.json({
          profesoresCalendar: [],
          horarioEvents: [],
          mensajeResultado: 'No hay resultados de cálculo disponibles. Por favor, realice un nuevo cálculo.'
        });
      }
      
      // Devolver los datos en formato JSON
      res.json({
        profesoresCalendar,
        horarioEvents,
        mensajeResultado
      });
    } catch (error) {
      console.error('Error al obtener datos del horario:', error);
      res.status(500).json({
        error: 'Error al obtener datos del horario',
        message: error.message
      });
    }
  }

  // Calcular horario sugerido
  async calcular(req, res) {
    try {
      console.log('=== INICIANDO CÁLCULO DE HORARIOS ===');
      console.log('Datos recibidos del formulario:', req.body);
      const materiasIds = req.body.materias || [];
      const profesoresIds = req.body.profesores || [];
      const profesorMaterias = req.body.profesor_materias || {};
      const maxHoursPerDay = parseInt(req.body.maxHoursPerDay) || 8;
      const preferredStartTime = parseInt(req.body.preferredStartTime) || 8;
      const preferredEndTime = parseInt(req.body.preferredEndTime) || 18;
      const avoidWeekends = req.body.avoidWeekends === 'on' || req.body.avoidWeekends === true;

      // Obtener todos los profesores y materias para mostrar en la vista
      const todosLosProfesores = await Profesor.getAll();
      const todasLasMaterias = await Materia.getAll();

      // Validación del lado del servidor
      const errores = [];

      if (profesoresIds.length === 0) {
        errores.push('Debe seleccionar al menos un profesor');
      }
      
      // Verificar que cada profesor tenga al menos una materia asignada
      const profesoresSinMaterias = [];
      for (const profesorId of profesoresIds) {
        const materiasDeProfesores = profesorMaterias[profesorId] || [];
        if (materiasDeProfesores.length === 0) {
          const profesor = todosLosProfesores.find(p => p.id === parseInt(profesorId));
          if (profesor) {
            profesoresSinMaterias.push(profesor.nombre);
          }
        }
      }
      
      if (profesoresSinMaterias.length > 0) {
        errores.push(`Los siguientes profesores no tienen materias asignadas: ${profesoresSinMaterias.join(', ')}`);
      }
      
      // Si hay errores, mostrar la vista con los errores
      if (errores.length > 0) {
        return res.render('horarios/calcular', {
          title: 'Calcular Horario Sugerido',
          error: errores.join('<br>'),
          profesores: todosLosProfesores,
          materias: todasLasMaterias,
          data: req.body
        });
      }
      
      // Verificar que se hayan asignado materias a profesores
      let hayAsignaciones = false;
      for (const profesorId of profesoresIds) {
        if (profesorMaterias[profesorId] && profesorMaterias[profesorId].length > 0) {
          hayAsignaciones = true;
          break;
        }
      }
      
      if (!hayAsignaciones) {
        return res.render('horarios/calcular', {
          title: 'Calcular Horario Sugerido',
          error: 'Debe asignar al menos una materia a un profesor',
          profesores: todosLosProfesores,
          materias: todasLasMaterias,
          data: req.body
        });
      }

      // Obtener datos completos
      const materiasAll = await Materia.getAll();
      const profesoresAll = await Profesor.getAll();
      
      // Recopilar todas las materias asignadas a profesores
      const materiasAsignadasIds = new Set();
      for (const profesorId of profesoresIds) {
        const materiasDeProfesores = profesorMaterias[profesorId] || [];
        materiasDeProfesores.forEach(materiaId => materiasAsignadasIds.add(materiaId));
      }
      
      // Filtrar materias y profesores
      const materias = materiasAll.filter(m => materiasAsignadasIds.has(m.id));
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
        id: m.id,
        nombre: m.nombre,
        codigo: m.codigo,
        semestre: m.semestre
      }));
      
      // Asignar materias a profesores según la selección del usuario
      const profesoresInput = profesores.map(p => {
        // Obtener las materias que el usuario asignó a este profesor
        const materiasAsignadas = profesorMaterias[p.id] || [];
        
        // Filtrar solo las materias que están en la selección general
        const materiasValidas = materiasAsignadas.filter(mId => materiasIds.includes(mId));
        
        return {
          id: p.id,
          nombre: p.nombre + ' ' + (p.apellido || ''),
          tipo: p.tipo,
          maxHorasClase: p.maxHorasClase || 20,
          // Asignar las materias seleccionadas para este profesor
          materias: materiasValidas,
          disponibilidad: p.disponibilidad || null
        };
      });
      
      console.log('Asignaciones de materias a profesores:');
      profesoresInput.forEach(p => {
        console.log(`${p.nombre}: ${p.materias.length} materias asignadas`);
      });

      // Ejecutar algoritmo de backtracking con todas las restricciones
      console.log('Ejecutando algoritmo de backtracking con las siguientes restricciones:');
      console.log(`- Máximo de horas por día: ${maxHoursPerDay}`);
      console.log(`- Hora de inicio preferida: ${preferredStartTime}:00`);
      console.log(`- Hora de fin preferida: ${preferredEndTime}:00`);
      console.log(`- Evitar fines de semana: ${avoidWeekends ? 'Sí' : 'No'}`);
      console.log(`- Materias seleccionadas: ${materiasInput.length}`);
      console.log(`- Profesores seleccionados: ${profesoresInput.length}`);
      
      const resultado = horarioBacktracking.asignarHorariosBacktracking({
        profesores: profesoresInput,
        materias: materiasInput,
        horariosDisponibles,
        opciones: { 
          avoidWeekends,
          maxHoursPerDay,
          preferredStartTime,
          preferredEndTime,
          tiempoLimite: 60000, // 60 segundos máximo para evitar bloqueos
          usarHeuristicas: true,
          usarMemoizacion: true,
          usarPoda: true
        }
      });

      // Preparar datos de horario para el calendario
      let horarioEvents = [];
      let mensajeResultado = '';
      
      if (resultado) {
        // Verificar si el algoritmo encontró una solución o es parcial
        if (resultado.exito) {
          mensajeResultado = 'Se ha generado un horario completo satisfaciendo todas las restricciones.';
        } else if (resultado.asignaciones && Object.keys(resultado.asignaciones).length > 0) {
          mensajeResultado = 'Se ha generado un horario parcial. No fue posible asignar todas las materias respetando las restricciones.';
          console.log('Solución parcial generada:', resultado.estadisticas);
        } else {
          mensajeResultado = 'No fue posible generar un horario completo en el tiempo límite. Se mostrarán algunos ejemplos de asignaciones posibles.';
          
          // Crear algunos ejemplos de asignaciones si no hay resultados
          // Esto es solo para demostrar la funcionalidad del calendario
          console.log('Generando datos de ejemplo para visualización...');
          
          // Usar los profesores y materias seleccionados para crear ejemplos realistas
          const diasSemana = [1, 2, 3, 4, 5]; // Lunes a viernes
          const horasInicio = ['08:00', '10:00', '12:00', '14:00', '16:00'];
          
          // Asignar al menos una materia a cada profesor seleccionado
          profesoresInput.forEach((profesor, pIndex) => {
            if (profesor.materias && profesor.materias.length > 0) {
              // Tomar hasta 2 materias por profesor para los ejemplos
              const materiasProfesor = profesor.materias.slice(0, 2);
              
              materiasProfesor.forEach((materiaId, mIndex) => {
                const materia = materiasInput.find(m => m.id === materiaId);
                if (materia) {
                  // Crear un horario de ejemplo para esta combinación profesor-materia
                  const diaIndex = (pIndex + mIndex) % diasSemana.length;
                  const horaIndex = (pIndex + mIndex) % horasInicio.length;
                  
                  const horaInicio = horasInicio[horaIndex];
                  const [hora, minutos] = horaInicio.split(':').map(Number);
                  const horaFin = `${hora + 2}:${minutos.toString().padStart(2, '0')}`;
                  
                  horarioEvents.push({
                    profesorId: profesor.id,
                    profesorNombre: profesor.nombre,
                    materiaId: materia.id,
                    materiaNombre: materia.nombre,
                    dia: diasSemana[diaIndex],
                    horaInicio: horaInicio,
                    horaFin: horaFin
                  });
                }
              });
            }
          });
          
          // Agregar nota de que son datos de ejemplo
          mensajeResultado += ' NOTA: Los datos mostrados son ejemplos y no representan una solución real del algoritmo.';
        }
        
        if (resultado.asignaciones) {
          const profesoresMap = {};
          const materiasMap = {};
          
          // Crear mapas para búsqueda rápida
          profesoresAll.forEach(p => { profesoresMap[p.id] = p; });
          materiasAll.forEach(m => { materiasMap[m.codigo] = m; });
          
          // Convertir asignaciones a eventos de calendario
          Object.keys(resultado.asignaciones).forEach(profesorId => {
            if (Array.isArray(resultado.asignaciones[profesorId])) {
              resultado.asignaciones[profesorId].forEach(horario => {
                const profesor = profesoresMap[profesorId];
                const materia = materiasMap[horario.codigo];
                
                if (profesor && materia) {
                  horarioEvents.push({
                    profesorId: profesorId,
                    profesorNombre: profesor.nombre + ' ' + (profesor.apellido || ''),
                    materiaId: materia.id,
                    materiaNombre: materia.nombre,
                    dia: horario.dia,
                    horaInicio: horario.horaInicio,
                    horaFin: horario.horaFin
                  });
                }
              });
            }
          });
          
          // Agregar estadísticas al mensaje de resultado
          if (resultado.estadisticas) {
            const tiempoSegundos = (resultado.estadisticas.tiempoMs / 1000).toFixed(2);
            mensajeResultado += ` (Tiempo: ${tiempoSegundos}s, Nodos: ${resultado.estadisticas.nodosExplorados}, Puntuación: ${resultado.estadisticas.puntuacion.toFixed(2)})`;
          }
        }
      }
      
      // Convertir a JSON para pasar a la vista
      const horarioEventsJSON = JSON.stringify(horarioEvents, null, 2);
      
      // Generar archivo JavaScript con los datos de horario
      const fs = require('fs');
      const path = require('path');
      const horarioDataPath = path.join(__dirname, '../public/js/horarioData.js');
      
      // Crear contenido del archivo
      const horarioDataContent = `/**
 * Este archivo se genera dinámicamente desde el servidor
 * Contiene los datos de horario para el calendario
 * Generado: ${new Date().toLocaleString()}
 * Resultado: ${mensajeResultado.replace(/'/g, "\'")}
 */
window.horarioEvents = ${horarioEventsJSON};
window.mensajeResultado = '${mensajeResultado.replace(/'/g, "\'")}';
`;
      
      // Escribir archivo de horarios
      try {
        fs.writeFileSync(horarioDataPath, horarioDataContent, 'utf8');
        console.log('Archivo horarioData.js generado correctamente');
        
        // Generar archivo de recursos para el calendario
        // Enriquecer los datos de profesores con sus materias asignadas
        const profesoresConMaterias = profesores.map(profesor => {
          const materiasAsignadas = [];
          if (resultado && resultado.asignaciones && resultado.asignaciones[profesor.id]) {
            const materiasIds = new Set();
            resultado.asignaciones[profesor.id].forEach(horario => {
              const materia = materiasMap[horario.codigo];
              if (materia && !materiasIds.has(materia.id)) {
                materiasIds.add(materia.id);
                materiasAsignadas.push({
                  id: materia.id,
                  nombre: materia.nombre
                });
              }
            });
          }
          return {
            ...profesor,
            materias: materiasAsignadas
          };
        });
        
        // Generar archivo de recursos
        const resourcesTemplate = fs.readFileSync(path.join(__dirname, '../views/horarios/resourcesTemplate.ejs'), 'utf8');
        const resourcesContent = require('ejs').render(resourcesTemplate, { profesores: profesoresConMaterias });
        fs.writeFileSync(path.join(__dirname, '../public/js/resourcesData.js'), resourcesContent);
        console.log('Archivo resourcesData.js generado correctamente');
      } catch (err) {
        console.error('Error al generar archivos de datos:', err);
      }
      
      // Preparar datos de profesores para el calendario
      const profesoresCalendar = profesores.map(profesor => {
        return {
          id: profesor.id,
          title: profesor.nombre + ' ' + (profesor.apellido || ''),
          eventColor: this.getRandomColor(profesor.id)
        };
      });
      
      // Imprimir resumen para depuración
      console.log('=== RESUMEN DE DATOS PARA LA VISTA ===');
      console.log(`Profesores: ${profesores.length}`);
      console.log(`Materias: ${materias.length}`);
      console.log(`Eventos generados: ${horarioEvents.length}`);
      console.log(`Mensaje de resultado: ${mensajeResultado}`);
      
      // Renderizar la misma vista con el resultado
      res.render('horarios/calcular', {
        title: 'Calcular Horario Sugerido',
        profesores: await Profesor.getAll(),
        materias: await Materia.getAll(),
        resultado,
        mensajeResultado,
        horarioEvents, // Pasar los eventos directamente a la vista
        profesoresCalendar, // Pasar los profesores formateados para el calendario
        timestamp: new Date().getTime() // Para evitar caché del archivo JS
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