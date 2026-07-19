const express = require('express');
const router = express.Router();
const { obtenerCitas, crearCita, actualizarEstadoCita } = require('../controllers/citasController');

router.get('/', obtenerCitas);
router.post('/', crearCita);
router.put('/:id/estado', actualizarEstadoCita);

module.exports = router;
