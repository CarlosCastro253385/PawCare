require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const mascotasRoutes = require('./routes/mascotasRoutes');
const serviciosRoutes = require('./routes/serviciosRoutes');
const citasRoutes = require('./routes/citasRoutes');
const gananciasRoutes = require('./routes/gananciasRoutes');
const perfilRoutes = require('./routes/perfilRoutes');

const path = require('path');
const app = express();

// Permite que Vercel (HTTPS) haga peticiones a tu AWS (HTTP) sin ser bloqueado
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
// 1. AUMENTAR EL LÍMITE DE TAMAÑO PARA IMÁGENES BASE64 (20MB)
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

app.use(express.static(path.join(__dirname)));

// Ruta raíz, carga la página principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Rutas de la API
app.use('/api', authRoutes);
app.use('/api/mascotas', mascotasRoutes);
app.use('/api/servicios', serviciosRoutes);
app.use('/api/citas', citasRoutes);
app.use('/api/ganancias', gananciasRoutes);
app.use('/api/perfil', perfilRoutes);

const PORT = process.env.PORT || 8080;

// 2. CORRECCIÓN EN EL CONSOLE.LOG (Uso de template literals ``)
app.listen(PORT, () => {
  console.log(`PawCARE API corriendo en el puerto ${PORT}`);
});