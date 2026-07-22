require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const mascotasRoutes = require('./routes/mascotasRoutes');
const serviciosRoutes = require('./routes/serviciosRoutes');
const citasRoutes = require('./routes/citasRoutes');
const gananciasRoutes = require('./routes/gananciasRoutes');
const perfilRoutes = require('./routes/perfilRoutes');
const reservasRoutes = require('./routes/reservasRoutes'); // 👈 Se importa la ruta de Reservas

const path = require('path');
const app = express();

// Permite que Vercel (HTTPS) haga peticiones a tu servidor sin ser bloqueado
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  // ⚡ SE AGREGA 'bypass-tunnel-reminder' PARA QUE LOCALTUNNEL NO BLOQUEE LAS PETICIONES
  allowedHeaders: ['Content-Type', 'Authorization', 'bypass-tunnel-reminder']
}));

// AUMENTAR EL LÍMITE DE TAMAÑO PARA IMÁGENES BASE64 (20MB)
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

app.use(express.static(path.join(__dirname)));

// Ruta raíz, carga la página principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// =========================================================
// RUTAS DE LA API (ORDEN CORREGIDO PARA EVITAR BLOQUEOS)
// =========================================================
app.use('/api/mascotas', mascotasRoutes);
app.use('/api/servicios', serviciosRoutes);
app.use('/api/citas', citasRoutes);
app.use('/api/reservas', reservasRoutes); // 👈 Se monta el endpoint de Reservas
app.use('/api/ganancias', gananciasRoutes);
app.use('/api/perfil', perfilRoutes);

// Auth va al final para que no intercepte las demás rutas /api/...
app.use('/api', authRoutes);

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`PawCARE API corriendo en el puerto ${PORT}`);
});