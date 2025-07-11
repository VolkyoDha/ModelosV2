// Módulo para asignación de horarios a profesores usando backtracking optimizado

/**
 * Asigna horarios a profesores usando backtracking con optimizaciones.
 * @param {Array} profesores - Lista de profesores (id, nombre, tipo, maxHorasClase, materias, disponibilidad).
 * @param {Array} materias - Lista de materias (nombre, codigo, semestre, profesorAsignado).
 * @param {Array} horariosDisponibles - Lista de objetos { dia, horaInicio, horaFin }.
 * @param {Object} opciones - Restricciones adicionales y configuración.
 * @returns {Object} - Asignaciones por profesor con estadísticas.
 */
function asignarHorariosBacktracking({ profesores, materias, horariosDisponibles, opciones = {} }) {
  console.log('=== INICIANDO ALGORITMO DE BACKTRACKING ===');
  console.log(`Profesores recibidos: ${profesores.length}`);
  console.log(`Materias recibidas: ${materias.length}`);
  console.log(`Horarios disponibles: ${horariosDisponibles.length}`);
  
  // Mostrar la relación entre profesores y materias
  console.log('\nRelación Profesor-Materias:');
  profesores.forEach(profesor => {
    console.log(`Profesor: ${profesor.nombre} (ID: ${profesor.id})`);
    console.log(`  Materias asignables: ${profesor.materias ? profesor.materias.length : 0}`);
    if (profesor.materias && profesor.materias.length > 0) {
      console.log(`  IDs de materias: ${profesor.materias.join(', ')}`);
    } else {
      console.log('  No tiene materias asignadas');
    }
  });
  
  console.log('\nDetalles de materias:');
  materias.forEach(materia => {
    console.log(`Materia: ${materia.nombre} (ID: ${materia.id})`);
  });
  console.time('tiempoAsignacion');
  
  // Opciones con valores por defecto
  const TIEMPO_LIMITE_MS = opciones.tiempoLimite || 30000;
  const MAX_HORAS_POR_DIA = opciones.maxHoursPerDay || 8;
  const HORA_INICIO_PREFERIDA = opciones.preferredStartTime || 8;
  const HORA_FIN_PREFERIDA = opciones.preferredEndTime || 18;
  const EVITAR_FINES_DE_SEMANA = opciones.avoidWeekends || false;
  const USAR_HEURISTICAS = opciones.usarHeuristicas !== undefined ? opciones.usarHeuristicas : true;
  const USAR_MEMOIZACION = opciones.usarMemoizacion !== undefined ? opciones.usarMemoizacion : true;
  
  const tiempoInicio = Date.now();
  let mejorSolucion = null;
  let mejorPuntuacion = -1;
  let nodosExplorados = 0;
  let podas = 0;
  
  // Memoización para estados ya explorados
  const estadosFallidos = new Set();
  const cacheSoluciones = new Map();
  const materiasConDificultad = materias.map(materia => {
    // Verificar si el código de la materia existe y está en formato string
    const materiaId = materia.id || materia.codigo;
    
    // Contar profesores que pueden impartir esta materia
    const profesoresDisponibles = profesores.filter(p => {
      // Verificar si el profesor tiene materias asignadas
      if (!p.materias || !Array.isArray(p.materias)) return false;
      
      // Verificar si el profesor puede impartir esta materia
      return p.materias.some(m => {
        if (typeof m === 'string') return m === materiaId;
        return m.id === materiaId || m.codigo === materiaId;
      });
    }).length;
    
    // Evitar división por cero
    const dificultad = (materia.semestre * 10) + (profesoresDisponibles > 0 ? 20 / profesoresDisponibles : 100);
    return { ...materia, dificultad };
  });
  
  const materiasOrdenadas = [...materiasConDificultad].sort((a, b) => b.dificultad - a.dificultad);
  console.log(`Materias ordenadas por dificultad: ${materiasOrdenadas.map(m => `${m.nombre}(${m.dificultad.toFixed(1)})`).join(', ')}`);
  
  const profesoresPorMateria = {};
  materiasOrdenadas.forEach(materia => {
    const materiaId = materia.id || materia.codigo;
    profesoresPorMateria[materiaId] = profesores
      .filter(p => {
        if (!p.materias || !Array.isArray(p.materias)) return false;
        return p.materias.some(m => {
          if (typeof m === 'string') return m === materiaId;
          return m.id === materiaId || m.codigo === materiaId;
        });
      })
      .sort((a, b) => a.materias.length - b.materias.length);
    
    // Si no hay profesores disponibles para esta materia, mostrar advertencia
    if (profesoresPorMateria[materiaId].length === 0) {
      console.warn(`Advertencia: No hay profesores disponibles para la materia ${materia.nombre} (${materiaId})`);
    }
  });
  
  const horariosCompatibles = {};
  profesores.forEach(profesor => {
    horariosCompatibles[profesor.id] = horariosDisponibles.filter(horario => {
      if (profesor.disponibilidad) {
        return profesor.disponibilidad.some(disp => 
          disp.dia === horario.dia &&
          disp.horaInicio <= horario.horaInicio &&
          disp.horaFin >= horario.horaFin
        );
      }
      return true;
    });
    
    horariosCompatibles[profesor.id] = horariosCompatibles[profesor.id]
      .filter(h => !(h.horaInicio < 13 && h.horaFin > 12));
      
    if (opciones.avoidWeekends) {
      horariosCompatibles[profesor.id] = horariosCompatibles[profesor.id]
        .filter(h => h.dia !== 'Sábado' && h.dia !== 'Domingo');
    }
  });

  const asignaciones = {};
  profesores.forEach(p => asignaciones[p.id] = []);

  const ocupados = {};
  horariosDisponibles.forEach(h => {
    if (!ocupados[h.dia]) ocupados[h.dia] = {};
    ocupados[h.dia][`${h.horaInicio}-${h.horaFin}`] = null;
  });
  
  function obtenerHashEstado(idx) {
    let hash = `${idx}|`;
    profesores.forEach(p => {
      hash += `${p.id}:[${asignaciones[p.id].map(a => `${a.codigo}-${a.dia}-${a.horaInicio}`).join(',')}];`;
    });
    return hash;
  }
  function esValido(profesor, materia, horario) {
  nodosExplorados++;
  
  // Verificar si el profesor puede impartir la materia
  if (!profesor.materias || !profesor.materias.includes(materia.id)) {
    console.log(`Profesor ${profesor.nombre} no puede impartir materia ${materia.nombre} (ID: ${materia.id})`);
    console.log(`  Materias asignables al profesor: ${profesor.materias ? profesor.materias.join(', ') : 'ninguna'}`);
    podas++;
    return false;
  }
  
  // OPTIMIZACIÓN: Verificación rápida de restricciones básicas
    
    // 1. Verificar si el horario está ocupado
    if (ocupados[horario.dia][`${horario.horaInicio}-${horario.horaFin}`]) {
      podas++;
      return false;
    }
    
    // 2. Verificar restricción de máximo de horas por día
    const clasesDia = asignaciones[profesor.id].filter(a => a.dia === horario.dia).length;
    if (clasesDia >= MAX_HORAS_POR_DIA / 2) { // Asumiendo clases de 1 hora, dividimos por 2
      podas++;
      return false;
    }
    
    // 3. Verificar conflictos de horario para el profesor
    for (const a of asignaciones[profesor.id]) {
      if (a.dia === horario.dia && (
        (horario.horaInicio < a.horaFin && horario.horaFin > a.horaInicio)
      )) {
        podas++;
        return false;
      }
    }
    
    // 4. Verificar límite de horas totales del profesor
    const horasAsignadas = asignaciones[profesor.id].reduce((sum, a) => sum + (a.horaFin - a.horaInicio), 0);
    if (horasAsignadas + (horario.horaFin - horario.horaInicio) > profesor.maxHorasClase) {
      podas++;
      return false;
    }
    
    // 5. Verificar preferencias de horario
    if (horario.horaInicio < HORA_INICIO_PREFERIDA || horario.horaFin > HORA_FIN_PREFERIDA) {
      // No lo rechazamos, pero lo penalizaremos en la puntuación
      // Esta es una restricción suave
    }
    
    // 6. Verificar restricción de fines de semana
    if (EVITAR_FINES_DE_SEMANA && (horario.dia === 'Sábado' || horario.dia === 'Domingo')) {
      podas++;
      return false;
    }
    
    // 7. Verificar disponibilidad específica del profesor si existe
    if (profesor.disponibilidad && Array.isArray(profesor.disponibilidad) && profesor.disponibilidad.length > 0) {
      const disponible = profesor.disponibilidad.some(disp => 
        disp.dia === horario.dia &&
        disp.horaInicio <= horario.horaInicio &&
        disp.horaFin >= horario.horaFin
      );
      
      if (!disponible) {
        podas++;
        return false;
      }
    }
    
    return true;
  }

  function backtrack(idx) {
    // Verificar tiempo límite para evitar bloqueos
    if (Date.now() - tiempoInicio > TIEMPO_LIMITE_MS) {
      console.log(`Se alcanzó el límite de tiempo (${TIEMPO_LIMITE_MS/1000}s). Retornando mejor solución parcial.`);
      return false;
    }
    
    // Caso base: todas las materias asignadas
    if (idx >= materiasOrdenadas.length) {
      const solucionActual = JSON.parse(JSON.stringify(asignaciones));
      const puntuacion = calcularPuntuacion(solucionActual);
      
      if (puntuacion > mejorPuntuacion) {
        mejorSolucion = solucionActual;
        mejorPuntuacion = puntuacion;
        console.log(`Nueva mejor solución encontrada con puntuación: ${mejorPuntuacion}`);
      }
      return true;
    }
    
    // Memoización: verificar si ya exploramos este estado
    const estadoActual = obtenerHashEstado(idx);
    if (USAR_MEMOIZACION) {
      if (estadosFallidos.has(estadoActual)) {
        podas++;
        return false;
      }
      
      // Verificar si ya tenemos una solución para este estado
      if (cacheSoluciones.has(estadoActual)) {
        const [resultado, solucionCache] = cacheSoluciones.get(estadoActual);
        if (resultado) {
          // Copiar la solución cacheada
          Object.keys(solucionCache).forEach(profId => {
            asignaciones[profId] = [...solucionCache[profId]];
          });
          return true;
        } else {
          return false;
        }
      }
    }
    
    const materia = materiasOrdenadas[idx];
    let exito = false;
    
    // Usar el ID correcto de la materia
    const materiaId = materia.id || materia.codigo;
    
    // Forward checking: verificar si hay profesores disponibles para esta materia
    if (!profesoresPorMateria[materiaId] || profesoresPorMateria[materiaId].length === 0) {
      console.warn(`No hay profesores disponibles para la materia ${materia.nombre}. Saltando...`);
      // Intentar con la siguiente materia
      return backtrack(idx + 1);
    }
    
    // Obtener profesores disponibles para esta materia
    const posiblesProfesores = profesoresPorMateria[materiaId];
    
    // Intentar asignar la materia a cada profesor disponible
    for (const profesor of posiblesProfesores) {
      // Forward checking: verificar si el profesor tiene horarios compatibles
      if (!horariosCompatibles[profesor.id] || horariosCompatibles[profesor.id].length === 0) {
        continue;
      }
      
      const horariosProfesor = horariosCompatibles[profesor.id];
      
      // Heurística: priorizar horarios según criterios
      let horariosPriorizados = [...horariosProfesor];
      
      if (USAR_HEURISTICAS) {
        // 1. Priorizar horarios que ya tienen clases asignadas en el mismo día
        // 2. Priorizar horarios dentro del rango de horas preferidas
        horariosPriorizados.sort((a, b) => {
          // Prioridad por clases ya asignadas en el mismo día
          const clasesA = asignaciones[profesor.id].filter(x => x.dia === a.dia).length;
          const clasesB = asignaciones[profesor.id].filter(x => x.dia === b.dia).length;
          if (clasesA === 1 && clasesB !== 1) return -1;
          if (clasesB === 1 && clasesA !== 1) return 1;
          
          // Prioridad por horas preferidas
          const aEnRango = a.horaInicio >= HORA_INICIO_PREFERIDA && a.horaFin <= HORA_FIN_PREFERIDA;
          const bEnRango = b.horaInicio >= HORA_INICIO_PREFERIDA && b.horaFin <= HORA_FIN_PREFERIDA;
          if (aEnRango && !bEnRango) return -1;
          if (bEnRango && !aEnRango) return 1;
          
          // Prioridad por días de semana (lunes a viernes antes que fines de semana)
          const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
          const indexA = diasSemana.indexOf(a.dia);
          const indexB = diasSemana.indexOf(b.dia);
          return indexA - indexB;
        });
      }
      
      // Probar cada horario posible
      for (const horario of horariosPriorizados) {
        if (esValido(profesor, materia, horario)) {
          // Asignar horario
          asignaciones[profesor.id].push({
            materia: materia.nombre,
            codigo: materiaId,
            dia: horario.dia,
            horaInicio: horario.horaInicio,
            horaFin: horario.horaFin
          });
          ocupados[horario.dia][`${horario.horaInicio}-${horario.horaFin}`] = profesor.id;
          
          // Guardar solución parcial periódicamente
          if (idx > materiasOrdenadas.length * 0.5 && (!mejorSolucion || idx > materiasOrdenadas.length * 0.8)) {
            mejorSolucion = JSON.parse(JSON.stringify(asignaciones));
            mejorPuntuacion = calcularPuntuacion(mejorSolucion);
          }
          
          // Continuar con la siguiente materia
          if (backtrack(idx + 1)) {
            exito = true;
            break;
          }
          
          // Deshacer asignación (backtracking)
          asignaciones[profesor.id].pop();
          ocupados[horario.dia][`${horario.horaInicio}-${horario.horaFin}`] = null;
        }
      }
      
      if (exito) break;
    }
    
    // Memoización: guardar resultado para este estado
    if (USAR_MEMOIZACION) {
      if (exito) {
        cacheSoluciones.set(estadoActual, [true, JSON.parse(JSON.stringify(asignaciones))]);
      } else {
        estadosFallidos.add(estadoActual);
        cacheSoluciones.set(estadoActual, [false, null]);
      }
    }
    
    // Si no se encontró solución, guardar la mejor solución parcial
    if (!exito && !mejorSolucion) {
      mejorSolucion = JSON.parse(JSON.stringify(asignaciones));
      mejorPuntuacion = calcularPuntuacion(mejorSolucion);
      console.log(`Guardando solución parcial en el índice ${idx}/${materiasOrdenadas.length}`);
    }
    
    return exito;
  }
  
  function calcularPuntuacion(solucion) {
    let puntuacion = 0;
    const profesoresAsignados = new Set();
    const materiasAsignadas = new Set();
    
    // Contar profesores y materias asignadas
    Object.keys(solucion).forEach(profesorId => {
      if (solucion[profesorId].length > 0) {
        profesoresAsignados.add(profesorId);
        solucion[profesorId].forEach(asignacion => {
          materiasAsignadas.add(asignacion.codigo);
        });
      }
    });
    
    // 1. Puntuación base por cobertura de materias (factor más importante)
    const coberturaMaterias = materiasAsignadas.size / materiasOrdenadas.length;
    puntuacion += coberturaMaterias * 100;
    
    // Si no hay materias asignadas, la solución es muy mala
    if (materiasAsignadas.size === 0) {
      return -100;
    }
    
    // 2. Distribución de profesores (balance de carga)
    const profesoresUtilizados = profesoresAsignados.size / profesores.length;
    puntuacion += profesoresUtilizados * 20;
    
    // 3. Evaluar restricciones suaves para cada asignación
    let penalizacionHorarios = 0;
    let penalizacionDias = 0;
    let bonificacionCompacto = 0;
    
    Object.keys(solucion).forEach(profesorId => {
      const asignacionesProfesor = solucion[profesorId];
      const diasOcupados = new Set();
      const horasPorDia = {};
      
      // Verificar horarios fuera de preferencias
      asignacionesProfesor.forEach(asignacion => {
        diasOcupados.add(asignacion.dia);
        
        // Inicializar contador de horas por día
        if (!horasPorDia[asignacion.dia]) {
          horasPorDia[asignacion.dia] = 0;
        }
        horasPorDia[asignacion.dia] += (asignacion.horaFin - asignacion.horaInicio);
        
        // Penalizar horarios fuera del rango preferido
        if (asignacion.horaInicio < HORA_INICIO_PREFERIDA) {
          penalizacionHorarios += 2 * (HORA_INICIO_PREFERIDA - asignacion.horaInicio);
        }
        if (asignacion.horaFin > HORA_FIN_PREFERIDA) {
          penalizacionHorarios += 2 * (asignacion.horaFin - HORA_FIN_PREFERIDA);
        }
        
        // Penalizar fines de semana si se deben evitar
        if (EVITAR_FINES_DE_SEMANA && (asignacion.dia === 'Sábado' || asignacion.dia === 'Domingo')) {
          penalizacionDias += 10;
        }
      });
      
      // Bonificar horarios compactos (clases en menos días)
      if (asignacionesProfesor.length > 0) {
        const eficienciaDias = asignacionesProfesor.length / diasOcupados.size;
        bonificacionCompacto += eficienciaDias * 5;
        
        // Bonificar si las horas por día están cerca del máximo permitido
        Object.keys(horasPorDia).forEach(dia => {
          const horasAsignadas = horasPorDia[dia];
          const eficienciaHoras = horasAsignadas / MAX_HORAS_POR_DIA;
          if (eficienciaHoras > 0.7 && eficienciaHoras <= 1) {
            bonificacionCompacto += 5;
          }
        });
      }
    });
    
    // Aplicar bonificaciones y penalizaciones
    puntuacion -= penalizacionHorarios;
    puntuacion -= penalizacionDias;
    puntuacion += bonificacionCompacto;
    
    // 4. Bonificación por asignar materias difíciles
    const materiasDificiles = materiasOrdenadas.slice(0, Math.ceil(materiasOrdenadas.length * 0.3));
    const materiasDificilesAsignadas = materiasDificiles.filter(m => {
      const materiaId = m.id || m.codigo;
      return materiasAsignadas.has(materiaId);
    }).length;
    
    puntuacion += (materiasDificilesAsignadas / materiasDificiles.length) * 30;
    
    return puntuacion;
  }
  
  function calcularDesviacionEstandar(numeros) {
    const n = numeros.length;
    if (n === 0) return 0;
    const media = numeros.reduce((sum, val) => sum + val, 0) / n;
    const varianza = numeros.reduce((sum, val) => sum + Math.pow(val - media, 2), 0) / n;
    return Math.sqrt(varianza);
  }

  const exito = backtrack(0);
  
  const solucionFinal = exito ? asignaciones : mejorSolucion;
  
  console.timeEnd('tiempoAsignacion');
  console.log(`Nodos explorados: ${nodosExplorados}, Podas realizadas: ${podas}`);
  console.log(`Solución ${exito ? 'completa' : 'parcial'} encontrada con puntuación: ${mejorPuntuacion}`);
  
  return {
    exito,
    completo: exito,
    asignaciones: solucionFinal || {},
    estadisticas: {
      nodosExplorados,
      podas,
      tiempoMs: Date.now() - tiempoInicio,
      puntuacion: mejorPuntuacion
    },
    resumen: solucionFinal ? generarResumen(solucionFinal, profesores) : "No se encontró solución"
  };
}

function generarResumen(asignaciones, profesores) {
  let resumen = '';
  profesores.forEach(p => {
    resumen += `Profesor ${p.nombre} (${p.id}):\n`;
    if (asignaciones[p.id].length === 0) {
      resumen += '  - Sin asignaciones\n';
    } else {
      asignaciones[p.id].forEach(a => {
        resumen += `  - ${a.materia} (${a.codigo}) → ${a.dia} ${a.horaInicio}:00-${a.horaFin}:00\n`;
      });
    }
    resumen += '\n';
  });
  return resumen;
}

module.exports = {
  asignarHorariosBacktracking,
  generarResumen
}; 