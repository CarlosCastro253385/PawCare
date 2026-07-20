const express = require('express');
const router = express.Router();
// 1. Agregamos eliminarCita a la importación del controlador
const { obtenerCitas, crearCita, actualizarEstadoCita, eliminarCita } = require('../controllers/citasController');

router.get('/', obtenerCitas);
router.post('/', crearCita);
router.put('/:id/estado', actualizarEstadoCita);

//  ESTO ES LO CORRECTO
router.delete('/:id', eliminarCita);
module.exports = router;