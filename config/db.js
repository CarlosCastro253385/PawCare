// config/db.js
// Crea un "pool" de conexiones a MySQL: en vez de abrir y cerrar una
// conexión nueva cada vez que llega una petición (lento), mysql2 mantiene
// varias conexiones ya abiertas y las va reutilizando.

const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;
