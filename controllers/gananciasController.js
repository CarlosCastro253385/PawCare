// controllers/gananciasController.js
const pool = require('../config/db');

// GET /api/ganancias/espacio
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

    const ocupado = ocupadosHoy[0]?.ocupados || 0;
    const libre = Math.max(0, capacidadTotal - ocupado);

    return res.json({ ok: true, capacidadTotal, ocupado, libre });
  } catch (error) {
    console.error('Error al calcular espacio:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error del servidor.' });
  }
}

// PUT /api/ganancias/capacidad
async function actualizarCapacidad(req, res) {
  const { capacidadTotal } = req.body;

  if (capacidadTotal === undefined || capacidadTotal < 0) {
    return res.status(400).json({ ok: false, mensaje: 'Capacidad inválida.' });
  }

  try {
    await pool.query('UPDATE LANDING_PAGE SET capacidad_total = ? LIMIT 1', [capacidadTotal]);
    return res.json({ ok: true, mensaje: 'Capacidad actualizada correctamente.' });
  } catch (error) {
    console.error('Error al actualizar capacidad:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error del servidor.' });
  }
}

// GET /api/ganancias/mensuales?anio=2026
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

// POST /api/ganancias/registrar-ingresos-manuales
async function registrarIngresosManuales(req, res) {
  const { ingresos, capacidadTotal } = req.body;

  if (!ingresos || !Array.isArray(ingresos)) {
    return res.status(400).json({ ok: false, mensaje: 'Datos de ingresos inválidos.' });
  }

  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();

    // 1. Guardar o actualizar capacidad_total en LANDING_PAGE si viene en la petición
    if (capacidadTotal !== undefined && capacidadTotal >= 0) {
      const [existePagina] = await conexion.query('SELECT id_pagina FROM LANDING_PAGE LIMIT 1');
      if (existePagina.length > 0) {
        await conexion.query('UPDATE LANDING_PAGE SET capacidad_total = ? WHERE id_pagina = ?', [
          capacidadTotal,
          existePagina[0].id_pagina,
        ]);
      } else {
        await conexion.query('INSERT INTO LANDING_PAGE (capacidad_total, titulo) VALUES (?, "PawCARE")', [
          capacidadTotal,
        ]);
      }
    }

    const anioActual = 2026;

    // 2. Buscar una cita existente para cumplir con la llave foránea id_cita e id_cliente
    const [citasExistentes] = await conexion.query('SELECT id_cita, id_cliente FROM CITA LIMIT 1');

    if (citasExistentes.length === 0) {
      await conexion.rollback();
      return res.status(400).json({
        ok: false,
        mensaje: 'Debes registrar al menos una Cita en la base de datos antes de registrar ingresos manuales.',
      });
    }

    const { id_cita, id_cliente } = citasExistentes[0];

    // 3. Insertar o actualizar cada mes en la tabla PAGO
    for (const item of ingresos) {
      const mesFormateado = String(item.mes + 1).padStart(2, '0');
      const fechaSimulada = `${anioActual}-${mesFormateado}-01`;

      const [existe] = await conexion.query(
        `SELECT id_pago FROM PAGO 
         WHERE MONTH(fecha_pago) = ? AND YEAR(fecha_pago) = ? AND id_cita = ? LIMIT 1`,
        [item.mes + 1, anioActual, id_cita]
      );

      if (existe.length > 0) {
        await conexion.query(`UPDATE PAGO SET monto_pagado = ? WHERE id_pago = ?`, [
          item.total,
          existe[0].id_pago,
        ]);
      } else if (item.total > 0) {
        await conexion.query(
          `INSERT INTO PAGO (monto_pagado, monto_por_pagar, fecha_pago, id_cita, id_cliente) 
           VALUES (?, 0, ?, ?, ?)`,
          [item.total, fechaSimulada, id_cita, id_cliente]
        );
      }
    }

    await conexion.commit();
    return res.json({ ok: true, mensaje: 'Ingresos y capacidad guardados correctamente.' });
  } catch (error) {
    await conexion.rollback();
    console.error('Error detallado SQL al registrar ingresos:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  } finally {
    conexion.release();
  }
}

module.exports = {
  obtenerEspacio,
  actualizarCapacidad,
  obtenerGananciasMensuales,
  obtenerIngresosPorServicio,
  registrarIngresosManuales,
};