const express = require('express');
const router = express.Router();
const {
  obtenerMascotas,
  obtenerMascotaPorId,
  crearMascota,
  actualizarMascota,
  guardarPrescripcion,
  eliminarMascota, // <-- 1. Importamos la función agregada
} = require('../controllers/mascotasController');

router.get('/', obtenerMascotas);
router.get('/:id', obtenerMascotaPorId);
router.post('/', crearMascota);
router.put('/:id', actualizarMascota);
router.put('/:id/prescripcion', guardarPrescripcion);
router.delete('/:id', eliminarMascota); // <-- 2. Definimos el endpoint DELETE

module.exports = router;