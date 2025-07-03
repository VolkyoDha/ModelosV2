# Sistema de Gestión de Horarios Universitarios

Un sistema completo para la gestión de horarios de profesores y materias universitarias, desarrollado en Node.js con arquitectura MVC y almacenamiento en archivos JSON.

## 🚀 Características

### Gestión de Profesores
- ✅ Agregar, editar y eliminar profesores
- ✅ Asignar horarios semanales con validación de conflictos
- ✅ Control de carga horaria máxima por profesor
- ✅ Visualización de resumen de carga horaria
- ✅ Validación de conflictos de horario

### Gestión de Materias
- ✅ Agregar, editar y eliminar materias
- ✅ Definir horas de teoría, práctica y laboratorio
- ✅ Gestión de prerequisitos entre materias
- ✅ Organización por semestres
- ✅ Carga masiva desde archivos JSON

### Cálculo de Horarios
- ✅ Algoritmo inteligente de asignación de horarios
- ✅ Selección de profesores y materias para cálculo
- ✅ Validación de conflictos en tiempo real
- ✅ Respeto a límites de horas por profesor
- ✅ Generación de horarios sugeridos

### Interfaz Web
- ✅ Diseño moderno y responsivo
- ✅ Menú lateral con navegación intuitiva
- ✅ Dashboard con estadísticas en tiempo real
- ✅ Formularios validados y fáciles de usar
- ✅ Notificaciones y alertas visuales

## 📋 Requisitos Previos

- Node.js (versión 14 o superior)
- npm o yarn

## 🛠️ Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <url-del-repositorio>
   cd gestion-horarios-universitarios
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Crear carpetas necesarias**
   ```bash
   mkdir uploads
   ```

4. **Ejecutar el proyecto**
   ```bash
   # Modo desarrollo (con nodemon)
   npm run dev
   
   # Modo producción
   npm start
   ```

5. **Acceder a la aplicación**
   ```
   http://localhost:3000
   ```

## 📁 Estructura del Proyecto

```
gestion-horarios-universitarios/
├── app.js                 # Archivo principal de la aplicación
├── package.json           # Dependencias y scripts
├── README.md             # Documentación
│
├── controllers/          # Controladores MVC
│   ├── indexController.js
│   ├── profesoresController.js
│   ├── materiasController.js
│   └── horariosController.js
│
├── models/              # Modelos de datos
│   ├── Profesor.js
│   ├── Materia.js
│   └── Horario.js
│
├── routes/              # Definición de rutas
│   ├── index.js
│   ├── profesores.js
│   ├── materias.js
│   └── horarios.js
│
├── views/               # Vistas EJS
│   ├── layout.ejs
│   ├── index.ejs
│   ├── error.ejs
│   ├── profesores/
│   ├── materias/
│   └── horarios/
│
├── public/              # Archivos estáticos
│   ├── css/
│   │   ├── style.css
│   │   └── sidebar.css
│   └── js/
│       ├── main.js
│       └── sidebar.js
│
├── resources/           # Datos JSON
│   ├── profesores.json
│   └── materias.json
│
└── uploads/            # Archivos subidos
```

## 🎯 Funcionalidades Principales

### 1. Gestión de Profesores

**Agregar Profesor:**
- Nombre y apellido
- Email de contacto
- Especialidad
- Máximo de horas semanales

**Asignar Horarios:**
- Selección de materia
- Día de la semana
- Hora de inicio y fin
- Tipo de clase (teoría, práctica, laboratorio)

**Validaciones:**
- Conflictos de horario
- Límite de horas semanales
- Disponibilidad del profesor

### 2. Gestión de Materias

**Crear Materia:**
- Código único
- Nombre descriptivo
- Créditos académicos
- Semestre de impartición
- Horas de teoría, práctica y laboratorio
- Prerequisitos (opcional)

**Carga Masiva:**
- Importar desde archivo JSON
- Validación de datos
- Evitar duplicados por código

### 3. Cálculo de Horarios

**Proceso de Cálculo:**
1. Seleccionar materias a incluir
2. Seleccionar profesores disponibles
3. Definir restricciones (días/horas excluidas)
4. Ejecutar algoritmo de asignación
5. Revisar conflictos y sugerencias

**Algoritmo Inteligente:**
- Prioriza materias por semestre
- Distribuye carga equitativamente
- Respeta límites de profesores
- Evita conflictos de horario

## 📊 Cómo Agregar Materias desde JSON

### Formato del Archivo JSON

```json
[
  {
    "codigo": "CS101",
    "nombre": "Introducción a la Programación",
    "creditos": 4,
    "semestre": 1,
    "horasTeoria": 3,
    "horasPractica": 2,
    "horasLaboratorio": 0,
    "prerequisitos": [],
    "descripcion": "Fundamentos de programación"
  }
]
```

### Pasos para Cargar:

1. Ir a **Materias > Cargar Malla**
2. Seleccionar archivo JSON
3. Hacer clic en "Cargar Archivo"
4. Revisar resultados de la importación

### Validaciones:

- ✅ Formato JSON válido
- ✅ Campos requeridos presentes
- ✅ Código único por materia
- ✅ Valores numéricos válidos

## ⏰ Cómo se Actualiza el Horario

### Proceso de Actualización:

1. **Cálculo Automático:**
   - Al ejecutar "Calcular Horario"
   - Sistema asigna materias a profesores
   - Respeta restricciones y límites

2. **Asignación Manual:**
   - Desde perfil del profesor
   - Agregar horarios individuales
   - Validación en tiempo real

3. **Validación Continua:**
   - Verificación de conflictos
   - Control de carga horaria
   - Alertas automáticas

### Conflictos Detectados:

- **Conflicto de Horario:** Mismo profesor en horarios solapados
- **Límite Excedido:** Profesor supera horas máximas
- **Materia Sin Asignar:** No hay profesores disponibles

## 🔧 Configuración Avanzada

### Variables de Entorno

Crear archivo `.env`:
```env
PORT=3000
NODE_ENV=development
```

### Personalización de Horarios

**Días Disponibles:**
- Lunes a Sábado (configurable en `models/Horario.js`)

**Horas Disponibles:**
- 7:00 a 20:00 (configurable en `models/Horario.js`)

**Límites por Defecto:**
- Máximo 20 horas por profesor (configurable)

## 📱 Uso de la Interfaz

### Navegación Principal:

- **Inicio:** Dashboard con estadísticas
- **Profesores:** Gestión completa de profesores
- **Materias:** Gestión de materias y malla curricular
- **Horarios:** Cálculo y visualización de horarios

### Acciones Rápidas:

- **Ctrl/Cmd + K:** Búsqueda global
- **Ctrl/Cmd + N:** Nuevo elemento
- **Escape:** Cerrar modales

### Responsive Design:

- ✅ Desktop: Menú lateral fijo
- ✅ Tablet: Menú colapsable
- ✅ Mobile: Menú deslizable

## 🚀 Posibles Futuras Mejoras

### Funcionalidades Adicionales:

1. **Autenticación y Autorización:**
   - Sistema de login
   - Roles de usuario (admin, coordinador, profesor)
   - Permisos granulares

2. **Base de Datos:**
   - Migración a PostgreSQL/MySQL
   - Transacciones y integridad referencial
   - Backup automático

3. **Algoritmos Avanzados:**
   - Optimización multi-objetivo
   - Preferencias de profesores
   - Restricciones de aulas

4. **Reportes y Analytics:**
   - Generación de PDF
   - Gráficos interactivos
   - Métricas de eficiencia

5. **Integración Externa:**
   - API REST completa
   - Sincronización con sistemas universitarios
   - Notificaciones por email

6. **Interfaz Mejorada:**
   - Drag & drop para horarios
   - Vista de calendario
   - Modo oscuro

### Mejoras Técnicas:

1. **Testing:**
   - Tests unitarios (Jest)
   - Tests de integración
   - Tests end-to-end

2. **Performance:**
   - Caché con Redis
   - Optimización de consultas
   - Lazy loading

3. **DevOps:**
   - Docker containerization
   - CI/CD pipeline
   - Monitoreo y logs

4. **Seguridad:**
   - Validación de entrada
   - Sanitización de datos
   - Rate limiting

## 🐛 Solución de Problemas

### Problemas Comunes:

**Error: "Cannot find module"**
```bash
npm install
```

**Error: "Port already in use"**
```bash
# Cambiar puerto en app.js o
lsof -ti:3000 | xargs kill -9
```

**Error: "File not found"**
```bash
# Crear carpetas necesarias
mkdir -p resources uploads
```

### Logs y Debugging:

```bash
# Modo debug
DEBUG=* npm run dev

# Ver logs detallados
NODE_ENV=development npm start
```

## 📞 Soporte

Para reportar bugs o solicitar nuevas funcionalidades:

1. Crear un issue en el repositorio
2. Incluir pasos para reproducir
3. Especificar versión de Node.js
4. Adjuntar logs de error si aplica

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver archivo `LICENSE` para más detalles.

## 🤝 Contribuciones

Las contribuciones son bienvenidas:

1. Fork el proyecto
2. Crear rama para feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

---

**Desarrollado con ❤️ para la gestión eficiente de horarios universitarios** 