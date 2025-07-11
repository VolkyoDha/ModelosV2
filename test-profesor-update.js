const Profesor = require('./models/Profesor');

async function testProfesorUpdate() {
  try {
    console.log('=== TEST: ACTUALIZACIÓN DE PROFESOR ===');
    
    // 1. Obtener profesor existente
    const profesorId = '2';
    console.log(`Obteniendo profesor con ID ${profesorId}...`);
    const profesor = await Profesor.getById(profesorId);
    console.log('Profesor antes de actualizar:', JSON.stringify(profesor, null, 2));
    
    // 2. Datos de actualización (simulando datos del formulario)
    const datosActualizacion = {
      nombre: profesor.nombre,
      apellido: profesor.apellido,
      email: profesor.email,
      especialidad: 'Matemáticas Avanzadas', // Cambiamos la especialidad
      tipo: profesor.tipo || 'medio_tiempo',
      maxHorasSemana: 30 // Cambiamos las horas máximas
    };
    
    console.log('Datos para actualización:', JSON.stringify(datosActualizacion, null, 2));
    
    // 3. Actualizar profesor
    console.log('Actualizando profesor...');
    const profesorActualizado = await Profesor.update(profesorId, datosActualizacion);
    console.log('Profesor después de actualizar:', JSON.stringify(profesorActualizado, null, 2));
    
    // 4. Verificar que se haya actualizado correctamente
    const profesorVerificacion = await Profesor.getById(profesorId);
    console.log('Verificación de actualización:', JSON.stringify(profesorVerificacion, null, 2));
    
    if (profesorVerificacion.especialidad === datosActualizacion.especialidad && 
        profesorVerificacion.maxHorasSemana === datosActualizacion.maxHorasSemana) {
      console.log('✅ TEST EXITOSO: El profesor se actualizó correctamente');
    } else {
      console.log('❌ TEST FALLIDO: El profesor no se actualizó correctamente');
      console.log('Campos esperados:', {
        especialidad: datosActualizacion.especialidad,
        maxHorasSemana: datosActualizacion.maxHorasSemana
      });
      console.log('Campos actuales:', {
        especialidad: profesorVerificacion.especialidad,
        maxHorasSemana: profesorVerificacion.maxHorasSemana
      });
    }
    
    console.log('=== FIN DEL TEST ===');
  } catch (error) {
    console.error('Error durante el test:', error);
  }
}

// Ejecutar el test
testProfesorUpdate();
