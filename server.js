// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const mascotasRoutes = require('./routes/mascotasRoutes');
const serviciosRoutes = require('./routes/serviciosRoutes');
const citasRoutes = require('./routes/citasRoutes');
const gananciasRoutes = require('./routes/gananciasRoutes');
const perfilRoutes = require('./routes/perfilRoutes');

const app = express();

app.use(cors()); // permite que tu frontend en Vercel le hable a esta API
app.use(express.json()); // permite leer JSON en el body de las peticiones

// Ruta raíz, solo para confirmar que la API está viva (como ya hacías antes)
app.get('/', (req, res) => {
  res.json({ ok: true, mensaje: 'PawCARE API funcionando correctamente.' });
});

app.use('/api', authRoutes);
app.use('/api/mascotas', mascotasRoutes);
app.use('/api/servicios', serviciosRoutes);
app.use('/api/citas', citasRoutes);
app.use('/api/ganancias', gananciasRoutes);
app.use('/api/perfil', perfilRoutes);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`PawCARE API corriendo en el puerto ${PORT}`);
});
