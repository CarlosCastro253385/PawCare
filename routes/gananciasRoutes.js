const express = require('express');
const router = express.Router();
const {
  obtenerEspacio,
  obtenerGananciasMensuales,
  obtenerIngresosPorServicio,
} = require('../controllers/gananciasController');

router.get('/espacio', obtenerEspacio);
router.get('/mensuales', obtenerGananciasMensuales);
router.get('/por-servicio', obtenerIngresosPorServicio);

module.exports = router;
