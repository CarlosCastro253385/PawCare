const express = require('express');
const router = express.Router();
const {
  obtenerMascotas,
  obtenerMascotaPorId,
  crearMascota,
  actualizarMascota,
  guardarPrescripcion,
} = require('../controllers/mascotasController');

router.get('/', obtenerMascotas);
router.get('/:id', obtenerMascotaPorId);
router.post('/', crearMascota);
router.put('/:id', actualizarMascota);
router.put('/:id/prescripcion', guardarPrescripcion);

module.exports = router;
