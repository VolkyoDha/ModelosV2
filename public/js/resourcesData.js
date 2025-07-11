/**
 * Archivo generado dinámicamente con los recursos para el calendario
 * Última actualización: 11/7/2025, 3:43:06 p. m.
 */

const calendarResources = [

  
    {
      id: '2',
      title: 'Dr. Juan Pérez',
      eventColor: getColorForProfesor('2'),
      children: [
        
      ]
    },
  
    {
      id: '3',
      title: 'Prof. Carlos Rodríguez',
      eventColor: getColorForProfesor('3'),
      children: [
        
      ]
    },
  
    {
      id: '1751423071831',
      title: 'Universidad Ecuador)',
      eventColor: getColorForProfesor('1751423071831'),
      children: [
        
      ]
    },
  
    {
      id: '1752186428733',
      title: 'Profe  Feoooooo',
      eventColor: getColorForProfesor('1752186428733'),
      children: [
        
      ]
    }
  

];

// Función para obtener un color basado en el ID del profesor
function getColorForProfesor(profesorId) {
  // Colores predefinidos para profesores
  const colores = [
    '#4285F4', // Azul Google
    '#EA4335', // Rojo Google
    '#FBBC05', // Amarillo Google
    '#34A853', // Verde Google
    '#3498db', // Azul claro
    '#e74c3c', // Rojo
    '#2ecc71', // Verde
    '#f39c12', // Naranja
    '#9b59b6', // Morado
    '#1abc9c'  // Turquesa
  ];
  
  // Usar el hash del ID para seleccionar un color
  const hash = profesorId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  return colores[Math.abs(hash) % colores.length];
}

// Función para obtener un color basado en el ID de la materia
function getColorForMateria(materiaId) {
  // Colores predefinidos para materias
  const colores = [
    '#4285F4', // Azul Google
    '#EA4335', // Rojo Google
    '#FBBC05', // Amarillo Google
    '#34A853', // Verde Google
    '#3498db', // Azul claro
    '#e74c3c', // Rojo
    '#2ecc71', // Verde
    '#f39c12', // Naranja
    '#9b59b6', // Morado
    '#1abc9c'  // Turquesa
  ];
  
  // Usar el hash del ID para seleccionar un color
  const hash = materiaId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  return colores[Math.abs(hash) % colores.length];
}
