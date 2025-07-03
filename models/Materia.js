const fs = require('fs').promises;
const path = require('path');

class Materia {
  constructor() {
    this.filePath = path.join(__dirname, '../resources/materias.json');
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

  async saveAll(materias) {
    await fs.writeFile(this.filePath, JSON.stringify(materias, null, 2));
  }

  async getById(id) {
    const materias = await this.getAll();
    return materias.find(m => m.id === id);
  }

  async create(materiaData) {
    const materias = await this.getAll();
    const newMateria = {
      id: Date.now().toString(),
      codigo: materiaData.codigo,
      nombre: materiaData.nombre,
      creditos: parseInt(materiaData.creditos) || 3,
      semestre: parseInt(materiaData.semestre) || 1,
      horasTeoria: parseInt(materiaData.horasTeoria) || 2,
      horasPractica: parseInt(materiaData.horasPractica) || 1,
      horasLaboratorio: parseInt(materiaData.horasLaboratorio) || 0,
      prerequisitos: materiaData.prerequisitos || [],
      descripcion: materiaData.descripcion || '',
      createdAt: new Date().toISOString()
    };
    
    materias.push(newMateria);
    await this.saveAll(materias);
    return newMateria;
  }

  async update(id, materiaData) {
    const materias = await this.getAll();
    const index = materias.findIndex(m => m.id === id);
    
    if (index === -1) {
      throw new Error('Materia no encontrada');
    }

    materias[index] = {
      ...materias[index],
      codigo: materiaData.codigo,
      nombre: materiaData.nombre,
      creditos: parseInt(materiaData.creditos) || 3,
      semestre: parseInt(materiaData.semestre) || 1,
      horasTeoria: parseInt(materiaData.horasTeoria) || 2,
      horasPractica: parseInt(materiaData.horasPractica) || 1,
      horasLaboratorio: parseInt(materiaData.horasLaboratorio) || 0,
      prerequisitos: materiaData.prerequisitos || [],
      descripcion: materiaData.descripcion || '',
      updatedAt: new Date().toISOString()
    };

    await this.saveAll(materias);
    return materias[index];
  }

  async delete(id) {
    const materias = await this.getAll();
    const filteredMaterias = materias.filter(m => m.id !== id);
    
    if (filteredMaterias.length === materias.length) {
      throw new Error('Materia no encontrada');
    }

    await this.saveAll(filteredMaterias);
    return true;
  }

  async getBySemestre(semestre) {
    const materias = await this.getAll();
    return materias.filter(m => m.semestre === parseInt(semestre));
  }

  async getPrerequisitos(materiaId) {
    const materia = await this.getById(materiaId);
    if (!materia || !materia.prerequisitos.length) {
      return [];
    }

    const materias = await this.getAll();
    return materias.filter(m => materia.prerequisitos.includes(m.id));
  }

  async getTotalHoras(materiaId) {
    const materia = await this.getById(materiaId);
    if (!materia) {
      return 0;
    }

    return materia.horasTeoria + materia.horasPractica + materia.horasLaboratorio;
  }

  async getHorasSemestrales(materiaId) {
    const materia = await this.getById(materiaId);
    if (!materia) {
      return 0;
    }

    // Asumiendo 16 semanas por semestre
    const semanasPorSemestre = 16;
    const horasSemana = materia.horasTeoria + materia.horasPractica + materia.horasLaboratorio;
    
    return horasSemana * semanasPorSemestre;
  }

  async loadFromFile(filePath) {
    try {
      const data = await fs.readFile(filePath, 'utf8');
      const materiasImportadas = JSON.parse(data);
      
      // Validar estructura de datos
      if (!Array.isArray(materiasImportadas)) {
        throw new Error('El archivo debe contener un array de materias');
      }

      const materias = await this.getAll();
      const nuevasMaterias = [];

      for (const materiaData of materiasImportadas) {
        // Verificar si la materia ya existe por código
        const existe = materias.find(m => m.codigo === materiaData.codigo);
        
        if (!existe) {
          const newMateria = await this.create(materiaData);
          nuevasMaterias.push(newMateria);
        }
      }

      return {
        total: materiasImportadas.length,
        nuevas: nuevasMaterias.length,
        existentes: materiasImportadas.length - nuevasMaterias.length,
        materias: nuevasMaterias
      };
    } catch (error) {
      throw new Error(`Error al cargar archivo: ${error.message}`);
    }
  }

  async getResumenSemestral() {
    const materias = await this.getAll();
    const resumen = {};

    materias.forEach(materia => {
      const semestre = materia.semestre;
      if (!resumen[semestre]) {
        resumen[semestre] = {
          materias: [],
          totalCreditos: 0,
          totalHorasSemana: 0,
          totalHorasSemestre: 0
        };
      }

      const horasSemana = materia.horasTeoria + materia.horasPractica + materia.horasLaboratorio;
      const horasSemestre = horasSemana * 16; // 16 semanas por semestre

      resumen[semestre].materias.push({
        id: materia.id,
        codigo: materia.codigo,
        nombre: materia.nombre,
        creditos: materia.creditos,
        horasTeoria: materia.horasTeoria,
        horasPractica: materia.horasPractica,
        horasLaboratorio: materia.horasLaboratorio,
        horasSemana: horasSemana,
        horasSemestre: horasSemestre
      });

      resumen[semestre].totalCreditos += materia.creditos;
      resumen[semestre].totalHorasSemana += horasSemana;
      resumen[semestre].totalHorasSemestre += horasSemestre;
    });

    return resumen;
  }
}

module.exports = new Materia(); 