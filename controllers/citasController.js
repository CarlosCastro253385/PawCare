const pool = require('../config/db');

// GET /api/citas?mes=7&anio=2026&id_usuario=X
// Sirve para pintar el calendario de reservaciones.js con los días ya ocupados.
async function obtenerCitas(req, res) {
  // CORREGIDO: Ahora extraemos id_usuario en lugar de id_cliente para coincidir con el Frontend
  const { mes, anio, id_usuario } = req.query;

  try {
    let consulta = `
      SELECT ci.id_cita, ci.fecha_entrada, ci.fecha_salida, ci.estado, ci.observaciones,
             m.nombre AS nombre_mascota, cl.nombre AS nombre_cliente, cl.contacto AS telefono_cliente
      FROM CITA ci
      JOIN MASCOTA m ON ci.id_mascota = m.id_mascota
      JOIN CLIENTE cl ON ci.id_cliente = cl.id_cliente
      WHERE 1 = 1
    `;
    const parametros = [];

    if (mes && anio) {
      consulta += ' AND MONTH(ci.fecha_entrada) = ? AND YEAR(ci.fecha_entrada) = ?';
      parametros.push(mes, anio);
    }

    // CORREGIDO: Filtra las citas basándose en el id_usuario que mandó el Frontend del cliente
    if (id_usuario) {
      consulta += ' AND ci.id_cliente = ?';
      parametros.push(id_usuario);
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

  if (!fechaEntrada || !fechaSalida || !nombreCliente || !nombreMascota) {
    return res.status(400).json({ ok: false, mensaje: 'Faltan datos obligatorios de la reservación.' });
  }

  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();

    // 1. Obtener o crear el ID del cliente
    let idCliente;
    
    // Si la cita la hace el cliente logueado, usamos directamente su id de usuario
    if (id_usuario) {
      idCliente = id_usuario;
    } else {
      // Si la hace un administrador/empleado en mostrador, se busca por teléfono
      const [clientesExistentes] = await conexion.query('SELECT id_cliente FROM CLIENTE WHERE contacto = ?', [telefonoCliente]);
      if (clientesExistentes.length > 0) {
        idCliente = clientesExistentes[0].id_cliente;
      } else {
        const [nuevoCliente] = await conexion.query(
          'INSERT INTO CLIENTE (nombre, contacto) VALUES (?, ?)',
          [nombreCliente, telefonoCliente]
        );
        idCliente = nuevoCliente.insertId;
      }
    }

    // 2. Buscar o crear la mascota (por nombre + dueño)
    let idMascota;
    const [mascotasExistentes] = await conexion.query(
      'SELECT id_mascota FROM MASCOTA WHERE nombre = ? AND id_cliente = ?',
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

    // 3. Crear la cita
    const [nuevaCita] = await conexion.query(
      `INSERT INTO CITA (fecha_entrada, fecha_salida, estado, id_mascota, id_cliente, id_usuario)
       VALUES (?, ?, 'pendiente', ?, ?, ?)`,
      [fechaEntrada, fechaSalida, idMascota, idCliente, id_usuario || null]
    );
    const idCita = nuevaCita.insertId;

    // 4. Ligar los servicios elegidos (tabla CITA_SERVICIO)
    if (Array.isArray(servicios) && servicios.length > 0) {
      const valores = servicios.map((idServicio) => [idCita, idServicio]);
      await conexion.query('INSERT INTO CITA_SERVICIO (id_cita, id_servicio) VALUES ?', [valores]);
    }

    await conexion.commit();
    return res.status(201).json({ ok: true, id_cita: idCita });
  } catch (error) {
    await conexion.rollback();
    console.error('Error al crear cita:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error del servidor.' });
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
    // 1. Primero eliminamos los servicios relacionados en la tabla intermedia
    await pool.query('DELETE FROM CITA_SERVICIO WHERE id_cita = ?', [id]);

    // 2. Ahora eliminamos físicamente la cita de la tabla principal
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