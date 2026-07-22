const pool = require('../config/db');

// GET /api/servicios
async function obtenerServicios(req, res) {
  try {
    const [servicios] = await pool.query('SELECT * FROM SERVICIO ORDER BY id_servicio ASC');
    return res.json({ ok: true, servicios });
  } catch (error) {
    console.error('Error al obtener servicios:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error al consultar servicios en la base de datos.' });
  }
}

// GET /api/servicios/:id
async function obtenerServicioPorId(req, res) {
  const { id } = req.params;
  try {
    const [servicios] = await pool.query('SELECT * FROM SERVICIO WHERE id_servicio = ?', [id]);
    if (servicios.length === 0) {
      return res.status(404).json({ ok: false, mensaje: 'Servicio no encontrado.' });
    }
    return res.json({ ok: true, servicio: servicios[0] });
  } catch (error) {
    console.error('Error al obtener servicio:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  }
}

// POST /api/servicios
async function crearServicio(req, res) {
  const { nombre, titulo, descripcion, foto, precio_grande, precio_mediano, precio_pequeno } = req.body;

  if (!nombre || !titulo) {
    return res.status(400).json({ ok: false, mensaje: 'Faltan datos obligatorios (nombre, título).' });
  }

  try {
    const [resultado] = await pool.query(
      `INSERT INTO SERVICIO (nombre, titulo, descripcion, foto, precio_grande, precio_mediano, precio_pequeno)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        nombre, 
        titulo, 
        descripcion || null, 
        foto || null, 
        parseFloat(precio_grande) || 0, 
        parseFloat(precio_mediano) || 0, 
        parseFloat(precio_pequeno) || 0
      ]
    );
    return res.status(201).json({ ok: true, id_servicio: resultado.insertId, mensaje: 'Servicio creado exitosamente.' });
  } catch (error) {
    console.error('Error al crear servicio:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error al registrar el servicio.' });
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
      [
        nombre, 
        titulo, 
        descripcion, 
        foto, 
        parseFloat(precio_grande) || 0, 
        parseFloat(precio_mediano) || 0, 
        parseFloat(precio_pequeno) || 0, 
        id
      ]
    );
    return res.json({ ok: true, mensaje: 'Servicio actualizado correctamente.' });
  } catch (error) {
    console.error('Error al actualizar servicio:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error al actualizar el servicio.' });
  }
}

// DELETE /api/servicios/:id
async function eliminarServicio(req, res) {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM SERVICIO WHERE id_servicio = ?', [id]);
    return res.json({ ok: true, mensaje: 'Servicio eliminado correctamente.' });
  } catch (error) {
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({
        ok: false,
        mensaje: 'No se puede eliminar: este servicio ya está asociado a una o más citas.',
      });
    }
    console.error('Error al eliminar servicio:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error al eliminar el servicio.' });
  }
}

module.exports = { 
  obtenerServicios, 
  obtenerServicioPorId,
  crearServicio, 
  actualizarServicio, 
  eliminarServicio 
};