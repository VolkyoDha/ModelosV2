const fs = require('fs').promises;
const path = require('path');

class Profesor {
  constructor() {
    this.filePath = path.join(__dirname, '../resources/profesores.json');
  }

  async getAll() {
    try {
      const data = await fs.readFile(this.filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Si el archivo no existe, crear uno vacío
        await this.saveAll([]);
        return [];
      }
      throw error;
    }
  }

  async saveAll(profesores) {
    await fs.writeFile(this.filePath, JSON.stringify(profesores, null, 2));
  }

  async getById(id) {
    const profesores = await this.getAll();
    return profesores.find(p => p.id === id.toString());
  }

  async create(profesorData) {
    const profesores = await this.getAll();
    const newProfesor = {
      id: Date.now().toString(),
      nombre: profesorData.nombre,
      apellido: profesorData.apellido,
      email: profesorData.email,
      especialidad: profesorData.especialidad,
      maxHorasSemana: parseInt(profesorData.maxHorasSemana) || 20,
      horarios: [],
      createdAt: new Date().toISOString()
    };
    
    profesores.push(newProfesor);
    await this.saveAll(profesores);
    return newProfesor;
  }

  async update(id, profesorData) {
    console.log('Modelo: Actualizando profesor ID:', id);
    const profesores = await this.getAll();
    console.log('Modelo: Profesores encontrados:', profesores.length);
    console.log('Modelo: Buscando ID:', id.toString());
    
    const index = profesores.findIndex(p => p.id === id.toString());
    console.log('Modelo: Índice encontrado:', index);
    
    if (index === -1) {
      console.log('Modelo: Profesor no encontrado');
      throw new Error('Profesor no encontrado');
    }

    console.log('Modelo: Profesor encontrado:', profesores[index]);
    console.log('Modelo: Datos a actualizar:', profesorData);

    profesores[index] = {
      ...profesores[index],
      id: profesores[index].id,
      nombre: profesorData.nombre,
      apellido: profesorData.apellido,
      email: profesorData.email,
      especialidad: profesorData.especialidad,
      maxHorasSemana: parseInt(profesorData.maxHorasSemana) || 20,
      updatedAt: new Date().toISOString()
    };

    console.log('Modelo: Profesor actualizado:', profesores[index]);
    await this.saveAll(profesores);
    console.log('Modelo: Datos guardados exitosamente');
    return profesores[index];
  }

  async delete(id) {
    const profesores = await this.getAll();
    const filteredProfesores = profesores.filter(p => p.id !== id.toString());
    
    if (filteredProfesores.length === profesores.length) {
      throw new Error('Profesor no encontrado');
    }

    await this.saveAll(filteredProfesores);
    return true;
  }

  async addHorario(profesorId, horarioData) {
    const profesores = await this.getAll();
    const profesor = profesores.find(p => p.id === profesorId.toString());
    
    if (!profesor) {
      throw new Error('Profesor no encontrado');
    }

    const nuevoHorario = {
      id: Date.now().toString(),
      materiaId: horarioData.materiaId,
      dia: horarioData.dia,
      horaInicio: horarioData.horaInicio,
      horaFin: horarioData.horaFin,
      tipo: horarioData.tipo || 'teoria', // teoria, practica, laboratorio
      createdAt: new Date().toISOString()
    };

    profesor.horarios.push(nuevoHorario);
    await this.saveAll(profesores);
    return nuevoHorario;
  }

  async removeHorario(profesorId, horarioId) {
    const profesores = await this.getAll();
    const profesor = profesores.find(p => p.id === profesorId.toString());
    
    if (!profesor) {
      throw new Error('Profesor no encontrado');
    }

    profesor.horarios = profesor.horarios.filter(h => h.id !== horarioId);
    await this.saveAll(profesores);
    return true;
  }

  async getCargaHoraria(profesorId) {
    const profesor = await this.getById(profesorId.toString());
    if (!profesor) {
      throw new Error('Profesor no encontrado');
    }

    const horasPorDia = {};
    let totalHoras = 0;

    profesor.horarios.forEach(horario => {
      const horaInicio = parseInt(horario.horaInicio);
      const horaFin = parseInt(horario.horaFin);
      const horas = horaFin - horaInicio;
      
      if (!horasPorDia[horario.dia]) {
        horasPorDia[horario.dia] = 0;
      }
      horasPorDia[horario.dia] += horas;
      totalHoras += horas;
    });

    return {
      profesor: profesor,
      horasPorDia: horasPorDia,
      totalHoras: totalHoras,
      maxHoras: profesor.maxHorasSemana,
      disponible: profesor.maxHorasSemana - totalHoras
    };
  }

  async checkConflictos(profesorId, nuevoHorario) {
    const profesor = await this.getById(profesorId.toString());
    if (!profesor) {
      throw new Error('Profesor no encontrado');
    }

    const conflictos = [];
    
    // Verificar conflictos con horarios existentes del mismo profesor
    profesor.horarios.forEach(horario => {
      if (horario.dia === nuevoHorario.dia) {
        const inicioExistente = parseInt(horario.horaInicio);
        const finExistente = parseInt(horario.horaFin);
        const inicioNuevo = parseInt(nuevoHorario.horaInicio);
        const finNuevo = parseInt(nuevoHorario.horaFin);

        if ((inicioNuevo < finExistente && finNuevo > inicioExistente)) {
          conflictos.push({
            tipo: 'conflicto_horario',
            mensaje: `Conflicto con horario existente: ${horario.dia} ${horario.horaInicio}-${horario.horaFin}`,
            horarioExistente: horario
          });
        }
      }
    });

    // Verificar límite de horas semanales
    const cargaActual = await this.getCargaHoraria(profesorId);
    const horasNuevoHorario = parseInt(nuevoHorario.horaFin) - parseInt(nuevoHorario.horaInicio);
    
    if (cargaActual.totalHoras + horasNuevoHorario > profesor.maxHorasSemana) {
      conflictos.push({
        tipo: 'limite_horas',
        mensaje: `Excede el límite de ${profesor.maxHorasSemana} horas semanales. Actual: ${cargaActual.totalHoras}, Nuevo: +${horasNuevoHorario}`,
        horasActuales: cargaActual.totalHoras,
        horasNuevas: horasNuevoHorario,
        limite: profesor.maxHorasSemana
      });
    }

    return conflictos;
  }
}

module.exports = new Profesor(); 