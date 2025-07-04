const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const methodOverride = require('method-override');
const session = require('express-session');
const flash = require('connect-flash');

// Importar rutas
const profesoresRoutes = require('./routes/profesores');
const materiasRoutes = require('./routes/materias');
const horariosRoutes = require('./routes/horarios');
const indexRoutes = require('./routes/index');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de logging para depuración
// app.use((req, res, next) => {
//   console.log('Método:', req.method, 'URL:', req.url, 'Body:', req.body);
//   next();
// });

// Configuración de middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configurar sesiones
app.use(session({
  secret: 'gestion-horarios-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Cambiar a true en producción con HTTPS
}));

// Configurar flash messages
app.use(flash());

// Middleware para hacer flash disponible en todas las vistas
app.use((req, res, next) => {
  res.locals.flash = req.flash();
  next();
});

// Configurar EJS como motor de vistas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Configurar layouts
app.use(expressLayouts);
app.set('layout', 'layout');

// Rutas
app.use('/', indexRoutes);
app.use('/profesores', profesoresRoutes);
app.use('/materias', materiasRoutes);
app.use('/horarios', horariosRoutes);

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).render('error', {
    title: 'Página no encontrada',
    message: 'La página que buscas no existe.'
  });
});

// Manejo de errores generales
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', {
    title: 'Error del servidor',
    message: 'Ha ocurrido un error interno del servidor.'
  });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log('Sistema de Gestión de Horarios Universitarios');
}); 