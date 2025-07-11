// Script para identificar y corregir errores en horarios.js
const fs = require('fs');
const path = require('path');

// Leer el archivo original
const filePath = path.join(__dirname, 'horarios.js');
let content = fs.readFileSync(filePath, 'utf8');

// Corregir el error de try sin catch (línea 787)
content = content.replace(
  /function initCalendar\(\) \{\s+console\.log\('Inicializando calendario\.\.\.'\);\s+\s+try \{/,
  "function initCalendar() {\n    console.log('Inicializando calendario...');"
);

// Asegurarse de que todas las llaves estén balanceadas
let openBraces = 0;
let closeBraces = 0;
for (let i = 0; i < content.length; i++) {
  if (content[i] === '{') openBraces++;
  if (content[i] === '}') closeBraces++;
}

console.log(`Llaves abiertas: ${openBraces}, Llaves cerradas: ${closeBraces}`);

// Si falta una llave de cierre, añadirla al final de la función showEventDetails
if (openBraces > closeBraces) {
  content = content.replace(
    /function showEventDetails\(profesorId, materiaId\) \{\s+console\.log\(`Mostrando detalles para profesor \${profesorId} y materia \${materiaId}`\);\s+\s+\/\/ Esta función se completaría con la lógica para mostrar un modal con detalles\s+\}/,
    "function showEventDetails(profesorId, materiaId) {\n    console.log(`Mostrando detalles para profesor ${profesorId} y materia ${materiaId}`);\n    \n    // Esta función se completaría con la lógica para mostrar un modal con detalles\n}"
  );
}

// Guardar el archivo corregido
fs.writeFileSync(path.join(__dirname, 'horarios_fixed.js'), content);
console.log('Archivo corregido guardado como horarios_fixed.js');
