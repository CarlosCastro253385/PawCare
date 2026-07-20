const pool = require('../config/db');

// GET /api/mascotas
async function obtenerMascotas(req, res) {
  const { id_cliente, id_usuario } = req.query;

  try {
    let consulta = `
      SELECT m.*, c.nombre AS dueno, c.contacto AS telefono
      FROM MASCOTA m
      LEFT JOIN CLIENTE c ON m.id_cliente = c.id_cliente
    `;
    const parametros = [];

    if (id_cliente) {
      consulta += ' WHERE m.id_cliente = ?';
      parametros.push(id_cliente);
    } else if (id_usuario) {
      consulta += ' WHERE c.id_usuario = ?';
      parametros.push(id_usuario);
    }

    const [mascotas] = await pool.query(consulta, parametros);
    return res.json({ ok: true, mascotas });
  } catch (error) {
    console.error('Error al obtener mascotas:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error del servidor.' });
  }
}

// GET /api/mascotas/:id
async function obtenerMascotaPorId(req, res) {
  const { id } = req.params;

  try {
    const [mascotas] = await pool.query(
      `SELECT m.*, c.nombre AS dueno, c.contacto AS telefono
       FROM MASCOTA m LEFT JOIN CLIENTE c ON m.id_cliente = c.id_cliente
       WHERE m.id_mascota = ?`,
      [id]
    );

    if (mascotas.length === 0) {
      return res.status(404).json({ ok: false, mensaje: 'Mascota no encontrada.' });
    }

    const [prescripciones] = await pool.query(
      'SELECT medicamento, via, dias, cada_horas FROM PRESCRIPCION WHERE id_mascota = ?',
      [id]
    );

    return res.json({ ok: true, mascota: mascotas[0], prescripcion: prescripciones[0] || null });
  } catch (error) {
    console.error('Error al obtener mascota:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error del servidor.' });
  }
}

// POST /api/mascotas (Vinculación automática por número de teléfono)
async function crearMascota(req, res) {
  const { nombre, genero, edad, raza, foto, indicaciones, id_cliente, nombreCliente, telefonoCliente } = req.body;

  if (!nombre) {
    return res.status(400).json({ ok: false, mensaje: 'El nombre de la mascota es obligatorio.' });
  }

  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();

    let idClienteFinal = id_cliente;

    if (!idClienteFinal && telefonoCliente) {
      // 1. Buscar si existe una cuenta en USUARIO registrada con ese número de teléfono
      const [usuarioEncontrado] = await conexion.query(
        'SELECT id_usuario FROM USUARIO WHERE telefono = ?',
        [telefonoCliente]
      );

      const idUsuarioAsociado = usuarioEncontrado.length > 0 ? usuarioEncontrado[0].id_usuario : null;

      // 2. Buscar si el cliente ya existe en la tabla CLIENTE por su teléfono
      const [existentes] = await conexion.query(
        'SELECT id_cliente, id_usuario FROM CLIENTE WHERE contacto = ?',
        [telefonoCliente]
      );

      if (existentes.length > 0) {
        idClienteFinal = existentes[0].id_cliente;

        // Si el cliente existía pero no estaba vinculado a su cuenta de usuario, lo actualizamos ahora
        if (!existentes[0].id_usuario && idUsuarioAsociado) {
          await conexion.query(
            'UPDATE CLIENTE SET id_usuario = ? WHERE id_cliente = ?',
            [idUsuarioAsociado, idClienteFinal]
          );
        }
      } else {
        // 3. Si no existe, crear el nuevo CLIENTE enlazando id_usuario de una vez
        const [nuevoCliente] = await conexion.query(
          'INSERT INTO CLIENTE (nombre, contacto, id_usuario) VALUES (?, ?, ?)',
          [nombreCliente || 'Sin nombre', telefonoCliente, idUsuarioAsociado]
        );
        idClienteFinal = nuevoCliente.insertId;
      }
    }

    if (!idClienteFinal) {
      await conexion.rollback();
      return res.status(400).json({ ok: false, mensaje: 'Falta el dueño de la mascota (id_cliente o datos de contacto).' });
    }

    // 4. Crear la mascota en la BD
    const [resultado] = await conexion.query(
      `INSERT INTO MASCOTA (nombre, genero, edad, raza, foto, indicaciones, id_cliente)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [nombre, genero || null, edad || null, raza || null, foto || null, indicaciones || null, idClienteFinal]
    );

    await conexion.commit();
    return res.status(201).json({ ok: true, id_mascota: resultado.insertId });
  } catch (error) {
    await conexion.rollback();
    console.error('Error al crear mascota:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error del servidor.' });
  } finally {
    conexion.release();
  }
}

// PUT /api/mascotas/:id
async function actualizarMascota(req, res) {
  const { id } = req.params;
  const { nombre, genero, edad, raza, foto, indicaciones, nombreCliente, telefonoCliente } = req.body;

  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();

    // 1. Obtener el id_cliente de la mascota
    const [mascota] = await conexion.query('SELECT id_cliente FROM MASCOTA WHERE id_mascota = ?', [id]);

    if (mascota.length > 0 && mascota[0].id_cliente) {
      // 2. Si el cliente no tiene id_usuario asignado, buscamos si ya se registró con su teléfono
      if (telefonoCliente) {
        const [usuarioEncontrado] = await conexion.query(
          'SELECT id_usuario FROM USUARIO WHERE telefono = ?',
          [telefonoCliente]
        );
        
        const idUsuarioAsociado = usuarioEncontrado.length > 0 ? usuarioEncontrado[0].id_usuario : null;

        if (idUsuarioAsociado) {
          await conexion.query(
            'UPDATE CLIENTE SET nombre = ?, contacto = ?, id_usuario = ? WHERE id_cliente = ?',
            [nombreCliente || 'Sin nombre', telefonoCliente, idUsuarioAsociado, mascota[0].id_cliente]
          );
        } else {
          await conexion.query(
            'UPDATE CLIENTE SET nombre = ?, contacto = ? WHERE id_cliente = ?',
            [nombreCliente || 'Sin nombre', telefonoCliente, mascota[0].id_cliente]
          );
        }
      }
    }

    // 3. Actualizar datos de la mascota
    await conexion.query(
      `UPDATE MASCOTA SET nombre = ?, genero = ?, edad = ?, raza = ?, foto = ?, indicaciones = ?
       WHERE id_mascota = ?`,
      [nombre, genero, edad, raza, foto, indicaciones, id]
    );

    await conexion.commit();
    return res.json({ ok: true, mensaje: 'Mascota y cliente actualizados correctamente.' });
  } catch (error) {
    await conexion.rollback();
    console.error('Error al actualizar mascota:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error del servidor al actualizar.' });
  } finally {
    conexion.release();
  }
}

// PUT /api/mascotas/:id/prescripcion
async function guardarPrescripcion(req, res) {
  const { id } = req.params;
  const { medicamento, via, dias, cada_horas } = req.body;

  try {
    const [existentes] = await pool.query('SELECT id_prescripcion FROM PRESCRIPCION WHERE id_mascota = ?', [id]);

    if (existentes.length > 0) {
      await pool.query(
        'UPDATE PRESCRIPCION SET medicamento = ?, via = ?, dias = ?, cada_horas = ? WHERE id_mascota = ?',
        [medicamento, via, dias, cada_horas, id]
      );
    } else {
      await pool.query(
        'INSERT INTO PRESCRIPCION (medicamento, via, dias, cada_horas, id_mascota) VALUES (?, ?, ?, ?, ?)',
        [medicamento, via, dias, cada_horas, id]
      );
    }

    return res.json({ ok: true });
  } catch (error) {
    console.error('Error al guardar prescripción:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error del servidor.' });
  }
}

// DELETE /api/mascotas/:id
async function eliminarMascota(req, res) {
  const { id } = req.params;
  const conexion = await pool.getConnection();

  try {
    await conexion.beginTransaction();

    // 1. Eliminar prescripciones y comportamientos
    await conexion.query('DELETE FROM PRESCRIPCION WHERE id_mascota = ?', [id]);
    await conexion.query('DELETE FROM COMPORTAMIENTO WHERE id_mascota = ?', [id]);

    // 2. Limpiar citas asociadas
    const [citas] = await conexion.query('SELECT id_cita FROM CITA WHERE id_mascota = ?', [id]);
    for (const cita of citas) {
      await conexion.query('DELETE FROM CITA_SERVICIO WHERE id_cita = ?', [cita.id_cita]);
      await conexion.query('DELETE FROM PAGO WHERE id_cita = ?', [cita.id_cita]);
      await conexion.query('DELETE FROM CITA WHERE id_cita = ?', [cita.id_cita]);
    }

    // 3. Eliminar mascota
    await conexion.query('DELETE FROM MASCOTA WHERE id_mascota = ?', [id]);

    await conexion.commit();
    return res.json({ ok: true, mensaje: 'Mascota y registros asociados eliminados correctamente.' });
  } catch (error) {
    await conexion.rollback();
    console.error('Error al eliminar mascota:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error del servidor al eliminar.' });
  } finally {
    conexion.release();
  }
}

module.exports = {
  obtenerMascotas,
  obtenerMascotaPorId,
  crearMascota,
  actualizarMascota,
  guardarPrescripcion,
  eliminarMascota,
};