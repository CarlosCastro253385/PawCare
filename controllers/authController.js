// controllers/authController.js
const pool = require('../config/db');

// POST /api/login
// Espera: { usuario, contrasena }  <- así lo pide tu login.js real
async function login(req, res) {
  const { usuario, contrasena } = req.body;

  if (!usuario || !contrasena) {
    return res.status(400).json({ ok: false, mensaje: 'Faltan datos (usuario o contraseña).' });
  }

  try {
    const [filas] = await pool.query(
      'SELECT id_usuario, nombre, usuario, correo, rol FROM USUARIO WHERE usuario = ? AND contrasena = ?',
      [usuario, contrasena]
    );

    if (filas.length === 0) {
      // OJO: por ahora comparamos la contraseña en texto plano, igual que
      // tu localStorage de antes. Para producción real deberías guardar
      // contraseñas con bcrypt (hash), no en texto plano. Te lo señalo
      // para que lo tengas en mente, pero no es obligatorio para tu entrega.
      return res.status(401).json({ ok: false, mensaje: 'Usuario o contraseña incorrectos.' });
    }

    return res.json({ ok: true, usuario: filas[0] });
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error del servidor.' });
  }
}

// POST /api/registro
// Espera: { nombre, usuario, correo, contrasena, telefono, direccion }
// rol siempre se guarda como 'usuario' (los admin se crean manualmente en la BD)
async function registro(req, res) {
  const { nombre, usuario, correo, contrasena, telefono, direccion } = req.body;

  if (!nombre || !usuario || !correo || !contrasena) {
    return res.status(400).json({ ok: false, mensaje: 'Faltan datos obligatorios.' });
  }

  try {
    const [existentes] = await pool.query(
      'SELECT id_usuario FROM USUARIO WHERE usuario = ? OR correo = ?',
      [usuario, correo]
    );

    if (existentes.length > 0) {
      return res.status(409).json({ ok: false, mensaje: 'Ese usuario o correo ya está registrado.' });
    }

    const [resultado] = await pool.query(
      `INSERT INTO USUARIO (nombre, usuario, correo, contrasena, telefono, direccion, rol, fecha_registro)
       VALUES (?, ?, ?, ?, ?, ?, 'usuario', CURDATE())`,
      [nombre, usuario, correo, contrasena, telefono || null, direccion || null]
    );

    return res.status(201).json({ ok: true, id_usuario: resultado.insertId });
  } catch (error) {
    console.error('Error en registro:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error del servidor.' });
  }
}

module.exports = { login, registro };
