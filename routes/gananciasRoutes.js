const express = require('express');
const router = express.Router();
const {
  obtenerEspacio,
  obtenerGananciasMensuales,
  obtenerIngresosPorServicio,
  actualizarCapacidad,        // 👈 Asegúrate de que esté aquí
  registrarIngresosManuales   // 👈 Asegúrate de que esté aquí
} = require('../controllers/gananciasController');

router.get('/espacio', obtenerEspacio);
router.get('/mensuales', obtenerGananciasMensuales);
router.get('/por-servicio', obtenerIngresosPorServicio);

// 👇 ESTAS DOS LÍNEAS SON LAS QUE EVITAN EL 404
router.put('/capacidad', actualizarCapacidad);
router.post('/registrar-ingresos-manuales', registrarIngresosManuales);

module.exports = router;