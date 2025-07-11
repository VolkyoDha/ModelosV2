const Profesor = require('./models/Profesor');

async function testUpdate() {
  try {
    console.log('=== PRUEBA DE ACTUALIZACIÓN ===');
    
    // Obtener todos los profesores
    const profesores = await Profesor.getAll();
    console.log('Profesores existentes:', profesores);
    
    if (profesores.length === 0) {
      console.log('No hay profesores para probar');
      return;
    }
    
    // Probar con el primer profesor
    const primerProfesor = profesores[0];
    console.log('Profesor a actualizar:', primerProfesor);
    
    // Datos de pruebal
    const datosActualizacion = {
      nombre: 'Dr. Juan',
      apellido: 'Pérez',
      email: 'juan.perez@universidad.edu',
      especialidad: 'Matemáticas',
      maxHorasSemana: '25'
    };
    
    console.log('Datos de actualización:', datosActualizacion);
    
    // Intentar actualizar
    const resultado = await Profesor.update(primerProfesor.id, datosActualizacion);
    console.log('Resultado de actualización:', resultado);
    
    // Verificar que se guardó
    const profesoresActualizados = await Profesor.getAll();
    console.log('Profesores después de actualización:', profesoresActualizados);
    
    console.log('=== PRUEBA COMPLETADA ===');
    
  } catch (error) {
    console.error('Error en la prueba:', error);
  }
}

testUpdate(); 