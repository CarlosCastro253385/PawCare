// controllers/gananciasController.js
const pool = require('../config/db');

// GET /api/ganancias/espacio
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

// PUT /api/ganancias/capacidad
// Actualiza la capacidad total desde la sección "Editar datos"
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
// Suma TODO lo registrado en la tabla PAGO por mes (Citas + Manuales).
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
// Combina y suma los ingresos de citas y los ingresos manuales por su respectivo servicio.
async function obtenerIngresosPorServicio(req, res) {
  const anio = req.query.anio || new Date().getFullYear();

  try {
    // Consulta para obtener los ingresos vinculados a servicios reales en citas
    const [ingresosCitas] = await pool.query(
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

    // Consulta para obtener los ingresos manuales guardados desde tu tabla
    const [ingresosManuales] = await pool.query(
      `SELECT SUBSTRING_INDEX(metodo_pago, ' - ', -1) AS nombre, SUM(monto_pagado) AS total
       FROM PAGO
       WHERE YEAR(fecha_pago) = ? AND metodo_pago LIKE 'Manual - %'
       GROUP BY metodo_pago`,
      [anio]
    );

    // Mapeamos y unificamos ambos resultados en un solo mapa para no duplicar servicios
    const mapaServicios = {};

    ingresosCitas.forEach(f => {
      mapaServicios[f.nombre] = Number(f.total);
    });

    ingresosManuales.forEach(f => {
      if (mapaServicios[f.nombre]) {
        mapaServicios[f.nombre] += Number(f.total);
      } else {
        mapaServicios[f.nombre] = Number(f.total);
      }
    });

    return res.json({
      ok: true,
      etiquetas: Object.keys(mapaServicios),
      valores: Object.values(mapaServicios),
    });
  } catch (error) {
    console.error('Error al calcular ingresos por servicio:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error del servidor.' });
  }
}

// POST /api/ganancias/registrar-ingresos-manuales
// Inserta o actualiza los ingresos manuales por mes para que no se dupliquen registros
async function registrarIngresosManuales(req, res) {
  const { ingresos } = req.body; 
  
  if (!ingresos || !Array.isArray(ingresos)) {
    return res.status(400).json({ ok: false, mensaje: 'Datos inválidos.' });
  }

  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();

    const anioActual = 2026;

    for (const item of ingresos) {
      const mesFormateado = String(item.mes + 1).padStart(2, '0');
      const fechaSimulada = `${anioActual}-${mesFormateado}-01`;
      const identificadorManual = `Manual - ${item.servicio}`;

      // Verificamos si ya existe un registro manual de ese servicio para ese mes exacto
      const [existe] = await conexion.query(
        `SELECT id_pago FROM PAGO 
         WHERE metodo_pago = ? AND MONTH(fecha_pago) = ? AND YEAR(fecha_pago) = ? LIMIT 1`,
        [identificadorManual, item.mes + 1, anioActual]
      );

      if (existe.length > 0) {
        // Si ya existe, sobreescribimos el monto
        await conexion.query(
          `UPDATE PAGO SET monto_pagado = ? WHERE id_pago = ?`,
          [item.total, existe[0].id_pago]
        );
      } else if (item.total > 0) {
        // Si es nuevo y tiene valor, lo insertamos
        await conexion.query(
          `INSERT INTO PAGO (monto_pagado, fecha_pago, metodo_pago) 
           VALUES (?, ?, ?)`,
          [item.total, fechaSimulada, identificadorManual]
        );
      }
    }

    await conexion.commit();
    return res.json({ ok: true, mensaje: 'Ingresos manuales guardados perfectamente.' });
  } catch (error) {
    await conexion.rollback();
    console.error('Error al registrar ingresos manuales:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error del servidor.' });
  } finally {
    conexion.release();
  }
}

// Exportamos absolutamente todas las funciones necesarias
module.exports = { 
  obtenerEspacio, 
  actualizarCapacidad,
  obtenerGananciasMensuales, 
  obtenerIngresosPorServicio, 
  registrarIngresosManuales 
};