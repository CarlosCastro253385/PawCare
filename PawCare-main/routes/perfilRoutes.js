const express = require('express');
const router = express.Router();
const { obtenerPerfil, actualizarPerfil } = require('../controllers/perfilController');

router.get('/:id', obtenerPerfil);
router.put('/:id', actualizarPerfil);

module.exports = router;
