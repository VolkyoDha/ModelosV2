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
  console.time('tiempoAsignacion');
  
  const TIEMPO_LIMITE_MS = opciones.tiempoLimite || 30000;
  const tiempoInicio = Date.now();
  let mejorSolucion = null;
  let mejorPuntuacion = -1;
  let nodosExplorados = 0;
  let podas = 0;
  
  const estadosFallidos = new Set();
  const materiasConDificultad = materias.map(materia => {
    const profesoresDisponibles = profesores.filter(p => p.materias.includes(materia.codigo)).length;
    const dificultad = (materia.semestre * 10) + (20 / profesoresDisponibles);
    return { ...materia, dificultad };
  });
  
  const materiasOrdenadas = [...materiasConDificultad].sort((a, b) => b.dificultad - a.dificultad);
  console.log(`Materias ordenadas por dificultad: ${materiasOrdenadas.map(m => `${m.nombre}(${m.dificultad.toFixed(1)})`).join(', ')}`);
  
  const profesoresPorMateria = {};
  materiasOrdenadas.forEach(materia => {
    profesoresPorMateria[materia.codigo] = profesores
      .filter(p => p.materias.includes(materia.codigo))
      .sort((a, b) => a.materias.length - b.materias.length);
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
    const clasesDia = asignaciones[profesor.id].filter(a => a.dia === horario.dia).length;
    if (clasesDia >= 2) {
      podas++;
      return false;
    }
    
    for (const a of asignaciones[profesor.id]) {
      if (a.dia === horario.dia && (
        (horario.horaInicio < a.horaFin && horario.horaFin > a.horaInicio)
      )) {
        podas++;
        return false;
      }
    }
    
    const horasAsignadas = asignaciones[profesor.id].reduce((sum, a) => sum + (a.horaFin - a.horaInicio), 0);
    if (horasAsignadas + (horario.horaFin - horario.horaInicio) > profesor.maxHorasClase) {
      podas++;
      return false;
    }
    
    if (ocupados[horario.dia][`${horario.horaInicio}-${horario.horaFin}`]) {
      podas++;
      return false;
    }
    
    return true;
  }

  function backtrack(idx) {
    if (Date.now() - tiempoInicio > TIEMPO_LIMITE_MS) {
      console.log(`Se alcanzó el límite de tiempo (${TIEMPO_LIMITE_MS/1000}s). Retornando mejor solución parcial.`);
      return false;
    }
    if (idx === materiasOrdenadas.length) {
      const solucion = JSON.parse(JSON.stringify(asignaciones));
      const puntuacion = calcularPuntuacion(solucion);
      
      if (puntuacion > mejorPuntuacion) {
        mejorSolucion = solucion;
        mejorPuntuacion = puntuacion;
      }
      return true;
    }
    
    const estadoActual = obtenerHashEstado(idx);
    if (estadosFallidos.has(estadoActual)) {
      podas++;
      return false;
    }
    
    const materia = materiasOrdenadas[idx];
    let exito = false;
    
    const posiblesProfesores = profesoresPorMateria[materia.codigo];
    
    for (const profesor of posiblesProfesores) {
      const horariosProfesor = horariosCompatibles[profesor.id];
      
      const horariosPriorizados = [...horariosProfesor].sort((a, b) => {
        const clasesA = asignaciones[profesor.id].filter(x => x.dia === a.dia).length;
        const clasesB = asignaciones[profesor.id].filter(x => x.dia === b.dia).length;
        return (clasesA === 1) ? -1 : (clasesB === 1) ? 1 : 0;
      });
      
      for (const horario of horariosPriorizados) {
        if (esValido(profesor, materia, horario)) {
          // Asignar
          asignaciones[profesor.id].push({
            materia: materia.nombre,
            codigo: materia.codigo,
            dia: horario.dia,
            horaInicio: horario.horaInicio,
            horaFin: horario.horaFin
          });
          ocupados[horario.dia][`${horario.horaInicio}-${horario.horaFin}`] = profesor.id;
          
          // ---- OPTIMIZACIÓN 5: Guardar solución parcial ----
          if (idx > materiasOrdenadas.length * 0.7 && !mejorSolucion) {
            mejorSolucion = JSON.parse(JSON.stringify(asignaciones));
            mejorPuntuacion = calcularPuntuacion(mejorSolucion);
          }
          
          if (backtrack(idx + 1)) {
            exito = true;
            break;
          }
          
          asignaciones[profesor.id].pop();
          ocupados[horario.dia][`${horario.horaInicio}-${horario.horaFin}`] = null;
        }
      }
      
      if (exito) break;
    }
    
    if (!exito) {
      estadosFallidos.add(estadoActual);
    }
    
    return exito;
  }
  
  function calcularPuntuacion(solucion) {
    let puntuacion = 0;
    
    const materiasAsignadas = new Set();
    profesores.forEach(p => {
      solucion[p.id].forEach(a => materiasAsignadas.add(a.codigo));
    });
    
    puntuacion += materiasAsignadas.size * 100;
    
    const cargasPorProfesor = profesores.map(p => solucion[p.id].length);
    const desviacion = calcularDesviacionEstandar(cargasPorProfesor);
    puntuacion -= desviacion * 5;
    
    profesores.forEach(p => {
      const diasUsados = new Set(solucion[p.id].map(a => a.dia));
      puntuacion -= diasUsados.size * 2;
    });
    
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