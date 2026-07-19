// controllers/perfilController.js
const pool = require('../config/db');

// GET /api/perfil/:id
async function obtenerPerfil(req, res) {
  const { id } = req.params;
  try {
    const [filas] = await pool.query(
      'SELECT id_usuario, nombre, usuario, correo, telefono, direccion, rol FROM USUARIO WHERE id_usuario = ?',
      [id]
    );
    if (filas.length === 0) {
      return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado.' });
    }
    return res.json({ ok: true, perfil: filas[0] });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error del servidor.' });
  }
}

// PUT /api/perfil/:id
// Espera: { nombre, correo, telefono, direccion } — y opcionalmente
// { contrasena } si el usuario quiere cambiarla.
async function actualizarPerfil(req, res) {
  const { id } = req.params;
  const { nombre, correo, telefono, direccion, contrasena } = req.body;

  try {
    if (contrasena) {
      await pool.query(
        'UPDATE USUARIO SET nombre = ?, correo = ?, telefono = ?, direccion = ?, contrasena = ? WHERE id_usuario = ?',
        [nombre, correo, telefono, direccion, contrasena, id]
      );
    } else {
      await pool.query(
        'UPDATE USUARIO SET nombre = ?, correo = ?, telefono = ?, direccion = ? WHERE id_usuario = ?',
        [nombre, correo, telefono, direccion, id]
      );
    }
    return res.json({ ok: true });
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error del servidor.' });
  }
}

module.exports = { obtenerPerfil, actualizarPerfil };
