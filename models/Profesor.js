const fs = require('fs').promises;
const path = require('path');

class Profesor {
  constructor() {
    this.filePath = path.join(__dirname, '../resources/profesores.json');
    // Definir los tipos de profesor y sus horas correspondientes
    this.tiposProfesor = {
      'tiempo_parcial': {
        nombre: 'Tiempo Parcial',
        horasTotales: 10,
        horasClase: 8
      },
      'medio_tiempo': {
        nombre: 'Medio Tiempo',
        horasTotales: 20,
        horasClase: 16
      },
      'tiempo_completo': {
        nombre: 'Tiempo Completo',
        horasTotales: 40,
        horasClase: 24
      }
    };
  }

  // Método para obtener las horas según el tipo de profesor
  getHorasPorTipo(tipo) {
    return this.tiposProfesor[tipo] || this.tiposProfesor['medio_tiempo'];
  }

  // Método para validar el tipo de profesor
  validarTipo(tipo) {
    return Object.keys(this.tiposProfesor).includes(tipo);
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

    // Validar y obtener el tipo de profesor
    const tipo = profesorData.tipo || 'medio_tiempo';
    if (!this.validarTipo(tipo)) {
      throw new Error('Tipo de profesor inválido');
    }

    const horasConfig = this.getHorasPorTipo(tipo);

    const newProfesor = {
      id: Date.now().toString(),
      nombre: profesorData.nombre,
      apellido: profesorData.apellido,
      email: profesorData.email,
      especialidad: profesorData.especialidad,
      tipo: tipo,
      maxHorasTotales: horasConfig.horasTotales,
      maxHorasClase: horasConfig.horasClase,
      horarios: [],
      createdAt: new Date().toISOString()
    };

    profesores.push(newProfesor);
    await this.saveAll(profesores);
    return newProfesor;
  }

  async update(id, profesorData) {
    console.log('=== MODELO: INICIO ACTUALIZACIÓN ===');
    console.log('Modelo: ID recibido:', id);
    console.log('Modelo: Datos a actualizar:', profesorData);

    const profesores = await this.getAll();
    const idString = id.toString();
    const index = profesores.findIndex(p => p.id === idString);

    if (index === -1) {
      throw new Error(`Profesor con ID ${idString} no encontrado`);
    }

    // Validar y obtener el tipo de profesor
    const tipo = profesorData.tipo || profesores[index].tipo || 'medio_tiempo';
    if (!this.validarTipo(tipo)) {
      throw new Error('Tipo de profesor inválido');
    }

    const horasConfig = this.getHorasPorTipo(tipo);

    // Construir el objeto actualizado sin usar maxHorasSemana
    const profesorActualizado = {
      ...profesores[index],
      nombre: profesorData.nombre,
      apellido: profesorData.apellido,
      email: profesorData.email,
      especialidad: profesorData.especialidad,
      tipo: tipo,
      maxHorasTotales: horasConfig.horasTotales,
      maxHorasClase: horasConfig.horasClase,
      updatedAt: new Date().toISOString()
    };

    profesores[index] = profesorActualizado;
    await this.saveAll(profesores);

    console.log('Modelo: Profesor actualizado:', profesorActualizado);
    console.log('=== MODELO: FIN ACTUALIZACIÓN ===');
    return profesorActualizado;
  }

  async delete(id) {
    const profesores = await this.getAll();
    const filtered = profesores.filter(p => p.id !== id.toString());
    if (filtered.length === profesores.length) {
      throw new Error('Profesor no encontrado');
    }
    await this.saveAll(filtered);
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
      tipo: horarioData.tipo || 'teoria',
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
    const profesor = await this.getById(profesorId);
    if (!profesor) {
      throw new Error('Profesor no encontrado');
    }

    const horasPorDia = {};
    let totalHoras = 0;

    for (const h of profesor.horarios) {
      const inicio = parseInt(h.horaInicio, 10);
      const fin    = parseInt(h.horaFin, 10);
      const dur    = fin - inicio;
      horasPorDia[h.dia] = (horasPorDia[h.dia] || 0) + dur;
      totalHoras += dur;
    }

    // Usar sólo maxHorasClase y maxHorasTotales
    const maxClase = profesor.maxHorasClase;
    const maxTotal = profesor.maxHorasTotales;

    return {
      profesor,
      horasPorDia,
      totalHoras,
      maxHorasClase: maxClase,
      maxHorasTotales: maxTotal,
      disponibleClase: maxClase - totalHoras,
      disponibleTotal: maxTotal - totalHoras
    };
  }

  async checkConflictos(profesorId, nuevoHorario) {
    const profesor = await this.getById(profesorId);
    if (!profesor) {
      throw new Error('Profesor no encontrado');
    }

    const conflictos = [];

    // Conflictos de solapamiento
    for (const h of profesor.horarios) {
      if (h.dia === nuevoHorario.dia) {
        const ie = parseInt(h.horaInicio, 10);
        const fe = parseInt(h.horaFin, 10);
        const in_ = parseInt(nuevoHorario.horaInicio, 10);
        const fn  = parseInt(nuevoHorario.horaFin, 10);
        if (in_ < fe && fn > ie) {
          conflictos.push({
            tipo: 'conflicto_horario',
            mensaje: `Conflicto: ${h.dia} ${h.horaInicio}-${h.horaFin}`,
            horarioExistente: h
          });
        }
      }
    }

    // Conflictos de límite de horas de clase semanales
    const carga = await this.getCargaHoraria(profesorId);
    const horasNuevas = parseInt(nuevoHorario.horaFin, 10) - parseInt(nuevoHorario.horaInicio, 10);
    if (carga.totalHoras + horasNuevas > profesor.maxHorasClase) {
      conflictos.push({
        tipo: 'limite_horas_clase',
        mensaje: `Excede límite de clases (${profesor.maxHorasClase}h). Actuales: ${carga.totalHoras}, Nuevas: ${horasNuevas}`
      });
    }

    return conflictos;
  }
}

module.exports = new Profesor();
