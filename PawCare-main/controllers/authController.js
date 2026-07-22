// controllers/authController.js
const pool = require('../config/db');
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;

async function login(req, res) {
  const { usuario, contrasena } = req.body;

  if (!usuario || !contrasena) {
    return res.status(400).json({ ok: false, mensaje: 'Faltan datos (usuario o contraseña).' });
  }

  try {
    const [filas] = await pool.query(
      `SELECT u.id_usuario, u.nombre, u.usuario, u.correo, u.contrasena, u.rol, c.id_cliente
       FROM USUARIO u
       LEFT JOIN CLIENTE c ON c.id_usuario = u.id_usuario
       WHERE u.usuario = ?`,
      [usuario]
    );

    if (filas.length === 0) {
      return res.status(401).json({ ok: false, mensaje: 'Usuario o contraseña incorrectos.' });
    }

    const coincide = await bcrypt.compare(contrasena, filas[0].contrasena);
    if (!coincide) {
      return res.status(401).json({ ok: false, mensaje: 'Usuario o contraseña incorrectos.' });
    }

    // Nunca regreses el hash de la contraseña al frontend
    const { contrasena: _omitida, ...usuarioSeguro } = filas[0];
    return res.json({ ok: true, usuario: usuarioSeguro });
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error del servidor.' });
  }
}

async function registro(req, res) {
  const { nombre, usuario, correo, contrasena, telefono, direccion } = req.body;

  if (!nombre || !usuario || !correo || !contrasena) {
    return res.status(400).json({ ok: false, mensaje: 'Faltan datos obligatorios.' });
  }

  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();

    const [existentes] = await conexion.query(
      'SELECT id_usuario FROM USUARIO WHERE usuario = ? OR correo = ?',
      [usuario, correo]
    );
    if (existentes.length > 0) {
      await conexion.rollback();
      return res.status(409).json({ ok: false, mensaje: 'Ese usuario o correo ya está registrado.' });
    }

    const contrasenaEncriptada = await bcrypt.hash(contrasena, SALT_ROUNDS);

    const [resultado] = await conexion.query(
      `INSERT INTO USUARIO (nombre, usuario, correo, contrasena, telefono, direccion, rol, fecha_registro)
       VALUES (?, ?, ?, ?, ?, ?, 'usuario', CURDATE())`,
      [nombre, usuario, correo, contrasenaEncriptada, telefono || null, direccion || null]
    );

    await conexion.query(
      'INSERT INTO CLIENTE (nombre, contacto, correo, id_usuario) VALUES (?, ?, ?, ?)',
      [nombre, telefono || null, correo, resultado.insertId]
    );

    await conexion.commit();
    return res.status(201).json({ ok: true, id_usuario: resultado.insertId });
  } catch (error) {
    await conexion.rollback();
    console.error('Error en registro:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error del servidor.' });
  } finally {
    conexion.release();
  }
}

module.exports = { login, registro };