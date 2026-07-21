// controllers/citasController.js
const pool = require('../config/db');

// GET /api/citas
async function obtenerCitas(req, res) {
  const { mes, anio, id_usuario } = req.query;

  try {
    let consulta = `
      SELECT 
        ci.id_cita, 
        DATE_FORMAT(ci.fecha_entrada, '%Y-%m-%d') AS fecha_entrada, 
        DATE_FORMAT(ci.fecha_salida, '%Y-%m-%d') AS fecha_salida, 
        ci.estado, 
        ci.observaciones,
        COALESCE(m.nombre, 'Mascota') AS nombre_mascota, 
        COALESCE(cl.nombre, u.nombre, 'Cliente') AS nombre_cliente, 
        COALESCE(cl.contacto, u.telefono, 'Sin contacto') AS telefono_cliente
      FROM CITA ci
      LEFT JOIN MASCOTA m ON ci.id_mascota = m.id_mascota
      LEFT JOIN CLIENTE cl ON ci.id_cliente = cl.id_cliente
      LEFT JOIN USUARIO u ON ci.id_usuario = u.id_usuario
      WHERE 1 = 1
    `;
    const parametros = [];

    if (mes && anio) {
      consulta += ` AND (
        (MONTH(ci.fecha_entrada) = ? AND YEAR(ci.fecha_entrada) = ?) OR
        (MONTH(ci.fecha_salida) = ? AND YEAR(ci.fecha_salida) = ?)
      )`;
      parametros.push(Number(mes), Number(anio), Number(mes), Number(anio));
    }

    if (id_usuario) {
      consulta += ' AND (ci.id_usuario = ? OR ci.id_cliente = ?)';
      parametros.push(id_usuario, id_usuario);
    }

    const [citas] = await pool.query(consulta, parametros);
    return res.json({ ok: true, citas });
  } catch (error) {
    console.error('Error al obtener citas:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error del servidor.' });
  }
}

// POST /api/citas
async function crearCita(req, res) {
  const {
    fechaEntrada, fechaSalida, nombreCliente, telefonoCliente,
    nombreMascota, edadMascota, razaMascota, id_usuario, servicios,
  } = req.body;

  if (!fechaEntrada || !fechaSalida || !nombreMascota) {
    return res.status(400).json({ ok: false, mensaje: 'Faltan datos obligatorios de la reservación.' });
  }

  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();

    let idCliente = null;

    // Lógica para asignar o crear Cliente
    if (telefonoCliente || nombreCliente) {
      const [clientesExistentes] = await conexion.query(
        'SELECT id_cliente FROM CLIENTE WHERE contacto = ? AND contacto != ""', 
        [telefonoCliente || '']
      );

      if (clientesExistentes.length > 0) {
        idCliente = clientesExistentes[0].id_cliente;
      } else if (nombreCliente) {
        const [nuevoCliente] = await conexion.query(
          'INSERT INTO CLIENTE (nombre, contacto) VALUES (?, ?)',
          [nombreCliente, telefonoCliente || '']
        );
        idCliente = nuevoCliente.insertId;
      }
    }

    // Lógica para asignar o crear Mascota
    let idMascota = null;
    if (nombreMascota) {
      const [mascotasExistentes] = await conexion.query(
        'SELECT id_mascota FROM MASCOTA WHERE nombre = ? AND (id_cliente = ? OR id_cliente IS NULL)',
        [nombreMascota, idCliente]
      );

      if (mascotasExistentes.length > 0) {
        idMascota = mascotasExistentes[0].id_mascota;
      } else {
        const [nuevaMascota] = await conexion.query(
          'INSERT INTO MASCOTA (nombre, edad, raza, id_cliente) VALUES (?, ?, ?, ?)',
          [nombreMascota, edadMascota || null, razaMascota || null, idCliente]
        );
        idMascota = nuevaMascota.insertId;
      }
    }

    // Insertar en la tabla CITA (Asegurando 'Confirmada' o 'pendiente')
    const [nuevaCita] = await conexion.query(
      `INSERT INTO CITA (fecha_entrada, fecha_salida, estado, id_mascota, id_cliente, id_usuario)
       VALUES (?, ?, 'Confirmada', ?, ?, ?)`,
      [fechaEntrada, fechaSalida, idMascota, idCliente, id_usuario || null]
    );
    const idCita = nuevaCita.insertId;

    // Insertar Relación Cita-Servicios (CORREGIDO: doble corchete [[valores]])
    if (Array.isArray(servicios) && servicios.length > 0) {
      const valores = servicios.map((idServicio) => [idCita, Number(idServicio)]);
      await conexion.query('INSERT INTO CITA_SERVICIO (id_cita, id_servicio) VALUES ?', [valores]);
    }

    await conexion.commit();
    return res.status(201).json({ ok: true, id_cita: idCita });
  } catch (error) {
    await conexion.rollback();
    console.error('Error al crear cita:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error del servidor al crear cita: ' + error.message });
  } finally {
    conexion.release();
  }
}

// PUT /api/citas/:id/estado
async function actualizarEstadoCita(req, res) {
  const { id } = req.params;
  const { estado } = req.body;

  try {
    await pool.query('UPDATE CITA SET estado = ? WHERE id_cita = ?', [estado, id]);
    return res.json({ ok: true });
  } catch (error) {
    console.error('Error al actualizar estado de la cita:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error del servidor.' });
  }
}

// DELETE /api/citas/:id
async function eliminarCita(req, res) {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM CITA_SERVICIO WHERE id_cita = ?', [id]);
    const [resultado] = await pool.query('DELETE FROM CITA WHERE id_cita = ?', [id]);

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ ok: false, mensaje: 'La reservación no existe.' });
    }

    return res.json({ ok: true, mensaje: 'Reservación eliminada correctamente.' });
  } catch (error) {
    console.error('Error al eliminar cita:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error del servidor al intentar eliminar.' });
  }
}

module.exports = { obtenerCitas, crearCita, actualizarEstadoCita, eliminarCita };