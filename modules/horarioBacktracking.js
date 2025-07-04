// Módulo para asignación de horarios a profesores usando backtracking

/**
 * Asigna horarios a profesores usando backtracking.
 * @param {Array} profesores - Lista de profesores (id, nombre, tipo, maxHorasClase, materias, disponibilidad).
 * @param {Array} materias - Lista de materias (nombre, codigo, semestre, profesorAsignado).
 * @param {Array} horariosDisponibles - Lista de objetos { dia, horaInicio, horaFin }.
 * @param {Object} opciones - Restricciones adicionales.
 * @returns {Object} - Asignaciones por profesor.
 */
function asignarHorariosBacktracking({ profesores, materias, horariosDisponibles, opciones = {} }) {
  // Ordenar materias por semestre descendente
  const materiasOrdenadas = [...materias].sort((a, b) => b.semestre - a.semestre);

  // Estado de asignaciones: { profesorId: [ { materia, dia, horaInicio, horaFin } ] }
  const asignaciones = {};
  profesores.forEach(p => asignaciones[p.id] = []);

  // Estado de horarios ocupados: { dia: { horaInicio-horaFin: profesorId } }
  const ocupados = {};
  horariosDisponibles.forEach(h => {
    if (!ocupados[h.dia]) ocupados[h.dia] = {};
    ocupados[h.dia][`${h.horaInicio}-${h.horaFin}`] = null;
  });

  // Validación de restricciones para una asignación tentativa
  function esValido(profesor, materia, horario) {
    // 1. El profesor debe dictar la materia
    if (!profesor.materias.includes(materia.codigo)) return false;
    // 2. No más de 2 clases por día
    const clasesDia = asignaciones[profesor.id].filter(a => a.dia === horario.dia).length;
    if (clasesDia >= 2) return false;
    // 3. No clases en horario de almuerzo
    if (horario.horaInicio < 13 && horario.horaFin > 12) return false;
    // 4. No solapamientos
    for (const a of asignaciones[profesor.id]) {
      if (a.dia === horario.dia && (
        (horario.horaInicio < a.horaFin && horario.horaFin > a.horaInicio)
      )) return false;
    }
    // 5. No sobrecarga de horas
    const horasAsignadas = asignaciones[profesor.id].reduce((sum, a) => sum + (a.horaFin - a.horaInicio), 0);
    if (horasAsignadas + (horario.horaFin - horario.horaInicio) > profesor.maxHorasClase) return false;
    // 6. El horario debe estar disponible
    if (ocupados[horario.dia][`${horario.horaInicio}-${horario.horaFin}`]) return false;
    // 7. Restricción de disponibilidad del profesor
    if (profesor.disponibilidad) {
      const disponible = profesor.disponibilidad.some(disp =>
        disp.dia === horario.dia &&
        disp.horaInicio <= horario.horaInicio &&
        disp.horaFin >= horario.horaFin
      );
      if (!disponible) return false;
    }
    // 8. Restricción de evitar fines de semana
    if (opciones.avoidWeekends && (horario.dia === 'Sábado' || horario.dia === 'Domingo')) return false;
    return true;
  }

  // Backtracking principal
  function backtrack(idx) {
    if (idx === materiasOrdenadas.length) return true; // Todas asignadas
    const materia = materiasOrdenadas[idx];
    // Buscar profesores que pueden dictar la materia
    const posiblesProfesores = profesores.filter(p => p.materias.includes(materia.codigo));
    for (const profesor of posiblesProfesores) {
      for (const horario of horariosDisponibles) {
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
          // Recursión
          if (backtrack(idx + 1)) return true;
          // Deshacer
          asignaciones[profesor.id].pop();
          ocupados[horario.dia][`${horario.horaInicio}-${horario.horaFin}`] = null;
        }
      }
    }
    return false; // No se pudo asignar
  }

  const exito = backtrack(0);
  return {
    exito,
    asignaciones,
    resumen: generarResumen(asignaciones, profesores)
  };
}

// Genera un resumen imprimible
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