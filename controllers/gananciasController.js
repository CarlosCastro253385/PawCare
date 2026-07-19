// controllers/gananciasController.js
const pool = require('../config/db');

// GET /api/ganancias/espacio
// Reemplaza el objeto "datosEspacio" quemado en ganancias.js.
// Cuenta cuántas mascotas tienen una CITA activa hoy vs la capacidad total.
async function obtenerEspacio(req, res) {
  try {
    const [config] = await pool.query('SELECT capacidad_total FROM LANDING_PAGE LIMIT 1');
    const capacidadTotal = config[0] ? config[0].capacidad_total : 0;

    const [ocupadosHoy] = await pool.query(
      `SELECT COUNT(DISTINCT id_mascota) AS ocupados
       FROM CITA
       WHERE CURDATE() BETWEEN fecha_entrada AND fecha_salida
         AND estado != 'cancelada'`
    );

    const ocupado = ocupadosHoy[0].ocupados;
    const libre = Math.max(0, capacidadTotal - ocupado);

    return res.json({ ok: true, capacidadTotal, ocupado, libre });
  } catch (error) {
    console.error('Error al calcular espacio:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error del servidor.' });
  }
}

// GET /api/ganancias/mensuales?anio=2026
// Reemplaza "datosGanancias" — suma los PAGO por mes.
async function obtenerGananciasMensuales(req, res) {
  const anio = req.query.anio || new Date().getFullYear();

  try {
    const [filas] = await pool.query(
      `SELECT MONTH(fecha_pago) AS mes, SUM(monto_pagado) AS total
       FROM PAGO
       WHERE YEAR(fecha_pago) = ?
       GROUP BY MONTH(fecha_pago)
       ORDER BY mes`,
      [anio]
    );

    // Rellenamos los 12 meses aunque no tengan pagos, para que la gráfica
    // no se vea con huecos raros (igual que el arreglo fijo que tenías antes).
    const totalesPorMes = Array(12).fill(0);
    filas.forEach((fila) => {
      totalesPorMes[fila.mes - 1] = Number(fila.total);
    });

    return res.json({ ok: true, anio: Number(anio), valores: totalesPorMes });
  } catch (error) {
    console.error('Error al calcular ganancias mensuales:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error del servidor.' });
  }
}

// GET /api/ganancias/por-servicio?anio=2026
// Reemplaza "datosServicios" — suma los PAGO agrupados por servicio,
// repartiendo el monto entre los servicios de cada cita si tuvo varios.
async function obtenerIngresosPorServicio(req, res) {
  const anio = req.query.anio || new Date().getFullYear();

  try {
    const [filas] = await pool.query(
      `SELECT s.nombre, SUM(p.monto_pagado / conteo.total_servicios) AS total
       FROM PAGO p
       JOIN CITA_SERVICIO cs ON p.id_cita = cs.id_cita
       JOIN SERVICIO s ON cs.id_servicio = s.id_servicio
       JOIN (
         SELECT id_cita, COUNT(*) AS total_servicios
         FROM CITA_SERVICIO
         GROUP BY id_cita
       ) AS conteo ON conteo.id_cita = p.id_cita
       WHERE YEAR(p.fecha_pago) = ?
       GROUP BY s.nombre`,
      [anio]
    );

    return res.json({
      ok: true,
      etiquetas: filas.map((f) => f.nombre),
      valores: filas.map((f) => Number(f.total)),
    });
  } catch (error) {
    console.error('Error al calcular ingresos por servicio:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error del servidor.' });
  }
}

module.exports = { obtenerEspacio, obtenerGananciasMensuales, obtenerIngresosPorServicio };
