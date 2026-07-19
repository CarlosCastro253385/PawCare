// controllers/citasController.js
const pool = require('../config/db');

// GET /api/citas?mes=7&anio=2026
// Sirve para pintar el calendario de reservaciones.js con los días ya
// ocupados, en vez de que esté vacío/estático como está ahora.
async function obtenerCitas(req, res) {
  const { mes, anio, id_cliente } = req.query;

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

    if (id_cliente) {
      consulta += ' AND ci.id_cliente = ?';
      parametros.push(id_cliente);
    }

    const [citas] = await pool.query(consulta, parametros);
    return res.json({ ok: true, citas });
  } catch (error) {
    console.error('Error al obtener citas:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error del servidor.' });
  }
}

// POST /api/citas
// Espera lo mismo que ya captura tu formulario de reservaciones.js, más
// la lista de servicios elegidos:
// {
//   fechaEntrada, fechaSalida, nombreCliente, telefonoCliente,
//   nombreMascota, edadMascota, razaMascota,
//   id_usuario,        // quién de tu personal registró la cita (o null si es autoservicio)
//   servicios: [1, 3]  // ids de SERVICIO elegidos
// }
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

    // 1. Buscar o crear al cliente por teléfono
    let idCliente;
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

    // 2. Buscar o crear la mascota (por nombre + dueño, ya que aún no tiene cuenta propia)
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

// PUT /api/citas/:id/estado   Espera: { estado: 'confirmada' | 'cancelada' | ... }
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

module.exports = { obtenerCitas, crearCita, actualizarEstadoCita };
