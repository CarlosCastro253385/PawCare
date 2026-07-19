// controllers/mascotasController.js
const pool = require('../config/db');

// GET /api/mascotas
// Uso admin: trae todas. Para el lado del cliente, usa
// GET /api/mascotas?id_cliente=5 para traer solo las suyas.
async function obtenerMascotas(req, res) {
  const { id_cliente } = req.query;

  try {
    let consulta = `
      SELECT m.*, c.nombre AS dueno, c.contacto AS telefono
      FROM MASCOTA m
      JOIN CLIENTE c ON m.id_cliente = c.id_cliente
    `;
    const parametros = [];

    if (id_cliente) {
      consulta += ' WHERE m.id_cliente = ?';
      parametros.push(id_cliente);
    }

    const [mascotas] = await pool.query(consulta, parametros);
    return res.json({ ok: true, mascotas });
  } catch (error) {
    console.error('Error al obtener mascotas:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error del servidor.' });
  }
}

// GET /api/mascotas/:id  -> incluye su prescripción, si tiene
async function obtenerMascotaPorId(req, res) {
  const { id } = req.params;

  try {
    const [mascotas] = await pool.query(
      `SELECT m.*, c.nombre AS dueno, c.contacto AS telefono
       FROM MASCOTA m JOIN CLIENTE c ON m.id_cliente = c.id_cliente
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

// POST /api/mascotas
// Espera: { nombre, genero, edad, raza, foto, indicaciones, id_cliente }
// Si el cliente (dueño) no existe todavía, lo crea de paso.
async function crearMascota(req, res) {
  const { nombre, genero, edad, raza, foto, indicaciones, id_cliente, nombreCliente, telefonoCliente } = req.body;

  if (!nombre) {
    return res.status(400).json({ ok: false, mensaje: 'El nombre de la mascota es obligatorio.' });
  }

  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();

    let idClienteFinal = id_cliente;

    // Si no mandaron un id_cliente existente, buscamos o creamos uno por teléfono
    if (!idClienteFinal && telefonoCliente) {
      const [existentes] = await conexion.query('SELECT id_cliente FROM CLIENTE WHERE contacto = ?', [telefonoCliente]);
      if (existentes.length > 0) {
        idClienteFinal = existentes[0].id_cliente;
      } else {
        const [nuevoCliente] = await conexion.query(
          'INSERT INTO CLIENTE (nombre, contacto) VALUES (?, ?)',
          [nombreCliente || 'Sin nombre', telefonoCliente]
        );
        idClienteFinal = nuevoCliente.insertId;
      }
    }

    if (!idClienteFinal) {
      await conexion.rollback();
      return res.status(400).json({ ok: false, mensaje: 'Falta el dueño de la mascota (id_cliente o datos de contacto).' });
    }

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
  const { nombre, genero, edad, raza, foto, indicaciones } = req.body;

  try {
    await pool.query(
      `UPDATE MASCOTA SET nombre = ?, genero = ?, edad = ?, raza = ?, foto = ?, indicaciones = ?
       WHERE id_mascota = ?`,
      [nombre, genero, edad, raza, foto, indicaciones, id]
    );
    return res.json({ ok: true });
  } catch (error) {
    console.error('Error al actualizar mascota:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error del servidor.' });
  }
}

// PUT /api/mascotas/:id/prescripcion
// Espera: { medicamento, via, dias, cada_horas }
// Si ya existe una prescripción para esa mascota, la actualiza; si no, la crea.
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

module.exports = {
  obtenerMascotas,
  obtenerMascotaPorId,
  crearMascota,
  actualizarMascota,
  guardarPrescripcion,
};
