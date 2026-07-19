// controllers/serviciosController.js
const pool = require('../config/db');

// GET /api/servicios
async function obtenerServicios(req, res) {
  try {
    const [servicios] = await pool.query('SELECT * FROM SERVICIO ORDER BY id_servicio');
    return res.json({ ok: true, servicios });
  } catch (error) {
    console.error('Error al obtener servicios:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error del servidor.' });
  }
}

// POST /api/servicios
// Espera: { nombre, titulo, descripcion, foto, precio_grande, precio_mediano, precio_pequeno }
async function crearServicio(req, res) {
  const { nombre, titulo, descripcion, foto, precio_grande, precio_mediano, precio_pequeno } = req.body;

  if (!nombre || !titulo) {
    return res.status(400).json({ ok: false, mensaje: 'Faltan datos obligatorios (nombre, título).' });
  }

  try {
    const [resultado] = await pool.query(
      `INSERT INTO SERVICIO (nombre, titulo, descripcion, foto, precio_grande, precio_mediano, precio_pequeno)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [nombre, titulo, descripcion || null, foto || null, precio_grande || 0, precio_mediano || 0, precio_pequeno || 0]
    );
    return res.status(201).json({ ok: true, id_servicio: resultado.insertId });
  } catch (error) {
    console.error('Error al crear servicio:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error del servidor.' });
  }
}

// PUT /api/servicios/:id
async function actualizarServicio(req, res) {
  const { id } = req.params;
  const { nombre, titulo, descripcion, foto, precio_grande, precio_mediano, precio_pequeno } = req.body;

  try {
    await pool.query(
      `UPDATE SERVICIO SET nombre = ?, titulo = ?, descripcion = ?, foto = ?,
       precio_grande = ?, precio_mediano = ?, precio_pequeno = ? WHERE id_servicio = ?`,
      [nombre, titulo, descripcion, foto, precio_grande, precio_mediano, precio_pequeno, id]
    );
    return res.json({ ok: true });
  } catch (error) {
    console.error('Error al actualizar servicio:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error del servidor.' });
  }
}

// DELETE /api/servicios/:id
async function eliminarServicio(req, res) {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM SERVICIO WHERE id_servicio = ?', [id]);
    return res.json({ ok: true });
  } catch (error) {
    console.error('Error al eliminar servicio:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error del servidor.' });
  }
}

module.exports = { obtenerServicios, crearServicio, actualizarServicio, eliminarServicio };
