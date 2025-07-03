const Profesor = require('./Profesor');
const Materia = require('./Materia');

class Horario {
  constructor() {
    this.dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    this.horasDisponibles = Array.from({length: 14}, (_, i) => i + 7); // 7:00 a 20:00
  }

  async calcularHorarioSugerido(materiasIds, profesoresIds, restricciones = {}) {
    const materias = await Materia.getAll();
    const profesores = await Profesor.getAll();
    
    // Filtrar materias y profesores seleccionados
    const materiasSeleccionadas = materias.filter(m => materiasIds.includes(m.id));
    const profesoresSeleccionados = profesores.filter(p => profesoresIds.includes(p.id));
    
    const horarioSugerido = {
      materias: [],
      conflictos: [],
      resumen: {
        materiasAsignadas: 0,
        materiasSinAsignar: 0,
        totalHoras: 0
      }
    };

    // Ordenar materias por semestre y horas
    materiasSeleccionadas.sort((a, b) => {
      if (a.semestre !== b.semestre) {
        return a.semestre - b.semestre;
      }
      return (b.horasTeoria + b.horasPractica + b.horasLaboratorio) - 
             (a.horasTeoria + a.horasPractica + a.horasLaboratorio);
    });

    for (const materia of materiasSeleccionadas) {
      const asignacion = await this.asignarMateria(materia, profesoresSeleccionados, restricciones);
      
      if (asignacion.exito) {
        horarioSugerido.materias.push(asignacion);
        horarioSugerido.resumen.materiasAsignadas++;
        horarioSugerido.resumen.totalHoras += asignacion.horasAsignadas;
      } else {
        horarioSugerido.conflictos.push({
          materia: materia,
          razon: asignacion.razon
        });
        horarioSugerido.resumen.materiasSinAsignar++;
      }
    }

    return horarioSugerido;
  }

  async asignarMateria(materia, profesores, restricciones) {
    const horasNecesarias = materia.horasTeoria + materia.horasPractica + materia.horasLaboratorio;
    const asignaciones = [];
    let horasAsignadas = 0;

    // Filtrar profesores por especialidad o disponibilidad
    const profesoresDisponibles = profesores.filter(p => {
      return p.especialidad.toLowerCase().includes('general') || 
             p.especialidad.toLowerCase().includes(materia.nombre.toLowerCase()) ||
             p.especialidad.toLowerCase().includes('computacion') ||
             p.especialidad.toLowerCase().includes('ingenieria');
    });

    if (profesoresDisponibles.length === 0) {
      return {
        exito: false,
        razon: 'No hay profesores disponibles para esta materia'
      };
    }

    // Intentar asignar horas de teoría
    if (materia.horasTeoria > 0) {
      const asignacionTeoria = await this.asignarHoras(
        materia, 
        profesoresDisponibles, 
        materia.horasTeoria, 
        'teoria',
        restricciones
      );
      
      if (asignacionTeoria.exito) {
        asignaciones.push(...asignacionTeoria.asignaciones);
        horasAsignadas += asignacionTeoria.horasAsignadas;
      }
    }

    // Intentar asignar horas de práctica
    if (materia.horasPractica > 0) {
      const asignacionPractica = await this.asignarHoras(
        materia, 
        profesoresDisponibles, 
        materia.horasPractica, 
        'practica',
        restricciones
      );
      
      if (asignacionPractica.exito) {
        asignaciones.push(...asignacionPractica.asignaciones);
        horasAsignadas += asignacionPractica.horasAsignadas;
      }
    }

    // Intentar asignar horas de laboratorio
    if (materia.horasLaboratorio > 0) {
      const asignacionLab = await this.asignarHoras(
        materia, 
        profesoresDisponibles, 
        materia.horasLaboratorio, 
        'laboratorio',
        restricciones
      );
      
      if (asignacionLab.exito) {
        asignaciones.push(...asignacionLab.asignaciones);
        horasAsignadas += asignacionLab.horasAsignadas;
      }
    }

    if (horasAsignadas === 0) {
      return {
        exito: false,
        razon: 'No se pudieron asignar horarios para esta materia'
      };
    }

    return {
      exito: true,
      materia: materia,
      asignaciones: asignaciones,
      horasAsignadas: horasAsignadas,
      horasNecesarias: horasNecesarias,
      completado: horasAsignadas === horasNecesarias
    };
  }

  async asignarHoras(materia, profesores, horasNecesarias, tipo, restricciones) {
    const asignaciones = [];
    let horasAsignadas = 0;

    // Ordenar profesores por disponibilidad
    const profesoresOrdenados = await this.ordenarProfesoresPorDisponibilidad(profesores);

    for (const profesor of profesoresOrdenados) {
      if (horasAsignadas >= horasNecesarias) break;

      const horasDisponibles = await this.obtenerHorasDisponibles(profesor, restricciones);
      
      for (const horario of horasDisponibles) {
        if (horasAsignadas >= horasNecesarias) break;

        const horasBloque = Math.min(2, horasNecesarias - horasAsignadas);
        
        const nuevaAsignacion = {
          materiaId: materia.id,
          materiaNombre: materia.nombre,
          profesorId: profesor.id,
          profesorNombre: `${profesor.nombre} ${profesor.apellido}`,
          dia: horario.dia,
          horaInicio: horario.horaInicio,
          horaFin: horario.horaInicio + horasBloque,
          tipo: tipo,
          horas: horasBloque
        };

        // Verificar conflictos antes de asignar
        const conflictos = await Profesor.checkConflictos(profesor.id, {
          dia: nuevaAsignacion.dia,
          horaInicio: nuevaAsignacion.horaInicio,
          horaFin: nuevaAsignacion.horaFin
        });

        if (conflictos.length === 0) {
          asignaciones.push(nuevaAsignacion);
          horasAsignadas += horasBloque;
          
          // Actualizar el horario del profesor
          await Profesor.addHorario(profesor.id, {
            materiaId: materia.id,
            dia: nuevaAsignacion.dia,
            horaInicio: nuevaAsignacion.horaInicio,
            horaFin: nuevaAsignacion.horaFin,
            tipo: tipo
          });
        }
      }
    }

    return {
      exito: horasAsignadas > 0,
      asignaciones: asignaciones,
      horasAsignadas: horasAsignadas
    };
  }

  async ordenarProfesoresPorDisponibilidad(profesores) {
    const profesoresConCarga = await Promise.all(
      profesores.map(async (profesor) => {
        const carga = await Profesor.getCargaHoraria(profesor.id);
        return {
          ...profesor,
          cargaActual: carga.totalHoras,
          disponible: carga.disponible
        };
      })
    );

    return profesoresConCarga.sort((a, b) => {
      if (a.disponible !== b.disponible) {
        return b.disponible - a.disponible;
      }
      return a.especialidad.localeCompare(b.especialidad);
    });
  }

  async obtenerHorasDisponibles(profesor, restricciones) {
    const carga = await Profesor.getCargaHoraria(profesor.id);
    const horasDisponibles = [];

    for (const dia of this.dias) {
      if (restricciones.diasExcluidos && restricciones.diasExcluidos.includes(dia)) {
        continue;
      }

      for (let hora = 7; hora <= 18; hora++) {
        if (restricciones.horasExcluidas && restricciones.horasExcluidas.includes(hora)) {
          continue;
        }

        const tieneConflicto = carga.profesor.horarios.some(horario => 
          horario.dia === dia && 
          parseInt(horario.horaInicio) <= hora && 
          parseInt(horario.horaFin) > hora
        );

        if (!tieneConflicto) {
          horasDisponibles.push({
            dia: dia,
            horaInicio: hora,
            horaFin: hora + 1
          });
        }
      }
    }

    return horasDisponibles;
  }

  async validarHorarioCompleto() {
    const profesores = await Profesor.getAll();
    const conflictos = [];

    for (const profesor of profesores) {
      const carga = await Profesor.getCargaHoraria(profesor.id);
      
      if (carga.totalHoras > profesor.maxHorasSemana) {
        conflictos.push({
          tipo: 'limite_excedido',
          profesor: profesor,
          mensaje: `El profesor ${profesor.nombre} ${profesor.apellido} excede su límite de ${profesor.maxHorasSemana} horas semanales (actual: ${carga.totalHoras})`
        });
      }

      for (let i = 0; i < profesor.horarios.length; i++) {
        for (let j = i + 1; j < profesor.horarios.length; j++) {
          const horario1 = profesor.horarios[i];
          const horario2 = profesor.horarios[j];

          if (horario1.dia === horario2.dia) {
            const inicio1 = parseInt(horario1.horaInicio);
            const fin1 = parseInt(horario1.horaFin);
            const inicio2 = parseInt(horario2.horaInicio);
            const fin2 = parseInt(horario2.horaFin);

            if ((inicio1 < fin2 && fin1 > inicio2)) {
              conflictos.push({
                tipo: 'conflicto_horario',
                profesor: profesor,
                mensaje: `Conflicto de horario para ${profesor.nombre} ${profesor.apellido}: ${horario1.dia} ${horario1.horaInicio}-${horario1.horaFin} vs ${horario2.dia} ${horario2.horaInicio}-${horario2.horaFin}`,
                horario1: horario1,
                horario2: horario2
              });
            }
          }
        }
      }
    }

    return conflictos;
  }

  async generarResumenHorario() {
    const profesores = await Profesor.getAll();
    const materias = await Materia.getAll();
    const resumen = {
      profesores: [],
      materias: [],
      totalHoras: 0,
      distribucionPorDia: {},
      distribucionPorTipo: {
        teoria: 0,
        practica: 0,
        laboratorio: 0
      }
    };

    for (const profesor of profesores) {
      const carga = await Profesor.getCargaHoraria(profesor.id);
      resumen.profesores.push({
        id: profesor.id,
        nombre: `${profesor.nombre} ${profesor.apellido}`,
        especialidad: profesor.especialidad,
        horasAsignadas: carga.totalHoras,
        maxHoras: profesor.maxHorasSemana,
        disponible: carga.disponible,
        porcentajeUso: Math.round((carga.totalHoras / profesor.maxHorasSemana) * 100)
      });
      resumen.totalHoras += carga.totalHoras;
    }

    for (const materia of materias) {
      const horasAsignadas = await this.contarHorasPorMateria(materia.id);
      resumen.materias.push({
        id: materia.id,
        codigo: materia.codigo,
        nombre: materia.nombre,
        semestre: materia.semestre,
        horasNecesarias: materia.horasTeoria + materia.horasPractica + materia.horasLaboratorio,
        horasAsignadas: horasAsignadas,
        completado: horasAsignadas >= (materia.horasTeoria + materia.horasPractica + materia.horasLaboratorio)
      });
    }

    for (const profesor of profesores) {
      for (const horario of profesor.horarios) {
        if (!resumen.distribucionPorDia[horario.dia]) {
          resumen.distribucionPorDia[horario.dia] = 0;
        }
        resumen.distribucionPorDia[horario.dia] += parseInt(horario.horaFin) - parseInt(horario.horaInicio);
        
        if (!resumen.distribucionPorTipo[horario.tipo]) {
          resumen.distribucionPorTipo[horario.tipo] = 0;
        }
        resumen.distribucionPorTipo[horario.tipo] += parseInt(horario.horaFin) - parseInt(horario.horaInicio);
      }
    }

    return resumen;
  }

  async contarHorasPorMateria(materiaId) {
    const profesores = await Profesor.getAll();
    let totalHoras = 0;

    for (const profesor of profesores) {
      for (const horario of profesor.horarios) {
        if (horario.materiaId === materiaId) {
          totalHoras += parseInt(horario.horaFin) - parseInt(horario.horaInicio);
        }
      }
    }

    return totalHoras;
  }
}

module.exports = new Horario(); 