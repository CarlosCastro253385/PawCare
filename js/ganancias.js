// ---------- Datos de ejemplo ----------
// Sustituye estos números por los datos reales que traigas de tu backend.
const datosEspacio = {
  vacio: 40,
  lleno: 60,
};

const datosGanancias = {
  meses: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio'],
  valores: [3200, 5400, 4600, 2800, 7200, 6500, 4900],
};

const datosServicios = {
  etiquetas: ['Hospedaje', 'Baño', 'Paseos'],
  valores: [18000, 9900, 6700],
};

// Colores de la marca PawCARE, usados también en el resto del sitio
const colorVacio = '#2f4257';
const colorLleno = '#4888b2';
const colorBarra = '#5caee4';
const coloresServicios = ['#2f4257', '#4888b2', '#8ed1fe'];

// ---------- Gráfica de pastel: Espacio en la guardería ----------
const ctxEspacio = document.getElementById('espacioChart');

new Chart(ctxEspacio, {
  type: 'doughnut',
  data: {
    labels: ['Vacío', 'Lleno'],
    datasets: [
      {
        data: [datosEspacio.vacio, datosEspacio.lleno],
        backgroundColor: [colorVacio, colorLleno],
        borderWidth: 0,
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '55%',
    plugins: {
      legend: { display: false }, // usamos nuestra propia leyenda en el HTML
      tooltip: {
        callbacks: {
          label: (item) => `${item.label}: ${item.raw}%`,
        },
      },
    },
  },
});

// Leyenda propia (círculo de color + texto), para que se vea igual al diseño
const leyendaEspacio = document.getElementById('espacioLeyenda');
const itemsLeyenda = [
  { color: colorVacio, texto: 'Vacío' },
  { color: colorLleno, texto: 'Lleno' },
];

itemsLeyenda.forEach(({ color, texto }) => {
  const li = document.createElement('li');
  li.innerHTML = `<span class="legend-dot" style="background:${color}"></span>${texto}`;
  leyendaEspacio.appendChild(li);
});

// ---------- Gráfica de barras: Ganancias mensuales ----------
const ctxGanancias = document.getElementById('gananciasChart');

const gananciasChart = new Chart(ctxGanancias, {
  type: 'bar',
  data: {
    labels: datosGanancias.meses,
    datasets: [
      {
        label: 'Ganancias ($)',
        data: datosGanancias.valores,
        backgroundColor: colorBarra,
        borderRadius: 8,
        maxBarThickness: 56,
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (item) => `$${item.raw.toLocaleString('es-MX')}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (valor) => `$${valor.toLocaleString('es-MX')}`,
        },
        grid: { color: '#eeeeee' },
      },
      x: {
        grid: { display: false },
      },
    },
  },
});

// ---------- Gráfica de pastel: Ingresos por servicio ----------
const ctxServicios = document.getElementById('serviciosChart');

const serviciosChart = new Chart(ctxServicios, {
  type: 'doughnut',
  data: {
    labels: datosServicios.etiquetas,
    datasets: [
      {
        data: datosServicios.valores,
        backgroundColor: coloresServicios,
        borderWidth: 0,
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '55%',
    plugins: {
      legend: { display: false }, // usamos nuestra propia leyenda en el HTML
      tooltip: {
        callbacks: {
          label: (item) => `${item.label}: $${item.raw.toLocaleString('es-MX')}`,
        },
      },
    },
  },
});

// Leyenda propia, igual que en la gráfica de "Espacio en la guardería"
const leyendaServicios = document.getElementById('serviciosLeyenda');
datosServicios.etiquetas.forEach((texto, i) => {
  const li = document.createElement('li');
  li.innerHTML = `<span class="legend-dot" style="background:${coloresServicios[i]}"></span>${texto}: $${datosServicios.valores[i].toLocaleString('es-MX')}`;
  leyendaServicios.appendChild(li);
});

// ---------- Botón "Agregar información" ----------
// Por ahora solo muestra un aviso; conéctalo a tu formulario o modal real.
const agregarBtn = document.getElementById('agregarBtn');
agregarBtn.addEventListener('click', () => {
  alert('Aquí conectas tu formulario o modal para agregar información nueva.');
});

// ==============================================================
// VISTA "EDITAR DATOS" — esto es una MAQUETA visual para mostrar
// cómo se vería el flujo de captura de datos. No está conectada
// a una base de datos real todavía; cuando tengas tu backend,
// aquí es donde reemplazas estos valores de ejemplo por peticiones
// reales (fetch) a tu servidor.
// ==============================================================

// ---------- Cambiar entre pestañas ----------
const tabGraficasBtn = document.getElementById('tabGraficasBtn');
const tabEditarBtn = document.getElementById('tabEditarBtn');
const vistaGraficas = document.getElementById('vistaGraficas');
const vistaEditar = document.getElementById('vistaEditar');

function mostrarVista(nombre) {
  const esGraficas = nombre === 'graficas';
  vistaGraficas.hidden = !esGraficas;
  vistaEditar.hidden = esGraficas;
  tabGraficasBtn.classList.toggle('active', esGraficas);
  tabEditarBtn.classList.toggle('active', !esGraficas);
}

tabGraficasBtn.addEventListener('click', () => mostrarVista('graficas'));
tabEditarBtn.addEventListener('click', () => mostrarVista('editar'));

// ---------- Botones +/- de "Lugares reservados" / "Lugares ocupados" ----------
// Cada fila lleva su propio contador de ejemplo en memoria, con un tope
// máximo (la capacidad total) para que no se pueda pasar de ahí.
const CAPACIDAD_TOTAL = 50;
const contadores = { reservados: 12, ocupados: 20 };

const valorReservadosEl = document.getElementById('valorReservados');
const valorOcupadosEl = document.getElementById('valorOcupados');
const valoresPorId = { reservados: valorReservadosEl, ocupados: valorOcupadosEl };

function actualizarBotonesStepper() {
  document.querySelectorAll('.stepper-btn').forEach((boton) => {
    const objetivo = boton.dataset.target;
    const valor = contadores[objetivo];
    if (boton.dataset.op === '-') {
      boton.disabled = valor <= 0;
    } else {
      boton.disabled = valor >= CAPACIDAD_TOTAL;
    }
  });
}

document.querySelectorAll('.stepper-btn').forEach((boton) => {
  boton.addEventListener('click', () => {
    const objetivo = boton.dataset.target;
    const paso = boton.dataset.op === '+' ? 1 : -1;
    contadores[objetivo] = Math.min(CAPACIDAD_TOTAL, Math.max(0, contadores[objetivo] + paso));
    valoresPorId[objetivo].textContent = contadores[objetivo];
    actualizarBotonesStepper();
  });
});

actualizarBotonesStepper();

// ---------- Cuadrícula de bloques de "Ganancias mensuales" ----------
// 4 filas x 7 columnas (una columna por mes). Cada bloque se puede
// prender/apagar con un clic, para visualizar cómo se iría "llenando"
// la información mes a mes.
const blockGrid = document.getElementById('blockGrid');
const TOTAL_FILAS = 4;
const TOTAL_COLUMNAS = 7;

if (blockGrid) {
for (let i = 0; i < TOTAL_FILAS * TOTAL_COLUMNAS; i++) {
  const bloque = document.createElement('button');
  bloque.type = 'button';
  bloque.className = 'data-block';
  // Arrancan con algunos bloques llenos, solo para que se vea parecido al mockup
  if (Math.random() > 0.4) {
    bloque.classList.add('filled');
  }
  bloque.addEventListener('click', () => {
    bloque.classList.toggle('filled');
  });
  blockGrid.appendChild(bloque);
}
}

// ---------- Botón "Agregar" (dentro de la cuadrícula de bloques) ----------
const agregarDatoBtn = document.getElementById('agregarDatoBtn');
if (agregarDatoBtn) agregarDatoBtn.addEventListener('click', () => {
  const nuevoBloque = document.createElement('button');
  nuevoBloque.type = 'button';
  nuevoBloque.className = 'data-block filled';
  nuevoBloque.addEventListener('click', () => {
    nuevoBloque.classList.toggle('filled');
  });
  blockGrid.appendChild(nuevoBloque);
});

// ---------- Botón "Guardar" -> abre el modal de confirmación ----------
const guardarBtn = document.getElementById('guardarBtn');
const confirmModal = document.getElementById('confirmModal');
const confirmarBtn = document.getElementById('confirmarBtn');
const cancelarBtn = document.getElementById('cancelarBtn');

guardarBtn.addEventListener('click', () => {
  confirmModal.classList.add('active');
});

confirmarBtn.addEventListener('click', () => {
  confirmModal.classList.remove('active');

  // Reflejamos los contadores de "Lugares ocupados" en las cajas de
  // arriba (Ocupado / Libre), para que se note el cambio al confirmar.
  document.getElementById('capacityOcupado').textContent = contadores.ocupados;
  document.getElementById('capacityLibre').textContent = Math.max(0, CAPACIDAD_TOTAL - contadores.ocupados);

  datosGanancias.valores = obtenerTotalesMensuales();
  datosServicios.valores = ingresosPorServicio.map((servicio) => totalizarServicio(servicio));
  gananciasChart.data.datasets[0].data = datosGanancias.valores;
  serviciosChart.data.datasets[0].data = datosServicios.valores;
  gananciasChart.update();
  serviciosChart.update();
  actualizarLeyendaServicios();

  // Aquí es donde, en la versión real, harías el fetch/POST para
  // guardar los cambios en tu base de datos.
  alert('Datos guardados (esto es una simulación, aún falta conectar tu backend).');
});

cancelarBtn.addEventListener('click', () => {
  confirmModal.classList.remove('active');
});

confirmModal.addEventListener('click', (evento) => {
  if (evento.target === confirmModal) {
    confirmModal.classList.remove('active');
  }
});

// ---------- Tabla de ingresos por servicio y mes ----------
const ingresosPorServicio = [
  { nombre: 'Hospedaje', valores: [1700, 2700, 2300, 1400, 3900, 3500, 2500] },
  { nombre: 'Baño', valores: [900, 1500, 1300, 800, 2100, 1900, 1400] },
  { nombre: 'Paseos', valores: [600, 1200, 1000, 600, 1200, 1100, 1000] },
];
const incomeTableBody = document.getElementById('incomeTableBody');
const incomeTableFoot = document.getElementById('incomeTableFoot');
const formatoMoneda = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 0,
});

function totalizarServicio(servicio) {
  return servicio.valores.reduce((total, valor) => total + valor, 0);
}

function obtenerTotalesMensuales() {
  return datosGanancias.meses.map((_, indiceMes) =>
    ingresosPorServicio.reduce((total, servicio) => total + servicio.valores[indiceMes], 0)
  );
}

function actualizarLeyendaServicios() {
  leyendaServicios.innerHTML = '';
  datosServicios.etiquetas.forEach((texto, i) => {
    const li = document.createElement('li');
    li.innerHTML = `<span class="legend-dot" style="background:${coloresServicios[i]}"></span>${texto}: ${formatoMoneda.format(datosServicios.valores[i])}`;
    leyendaServicios.appendChild(li);
  });
}

function actualizarTotalesTabla() {
  const totales = obtenerTotalesMensuales();
  ingresosPorServicio.forEach((servicio, indiceServicio) => {
    document.querySelector(`[data-total-servicio="${indiceServicio}"]`).textContent = formatoMoneda.format(totalizarServicio(servicio));
  });
  totales.forEach((total, indiceMes) => {
    document.querySelector(`[data-total-mes="${indiceMes}"]`).textContent = formatoMoneda.format(total);
  });
  document.getElementById('incomeGrandTotal').textContent = formatoMoneda.format(totales.reduce((total, valor) => total + valor, 0));
}

function renderizarTablaIngresos() {
  ingresosPorServicio.forEach((servicio, indiceServicio) => {
    const fila = document.createElement('tr');
    const nombre = document.createElement('td');
    nombre.textContent = servicio.nombre;
    fila.appendChild(nombre);

    servicio.valores.forEach((valor, indiceMes) => {
      const celda = document.createElement('td');
      const input = document.createElement('input');
      input.className = 'income-input';
      input.type = 'number';
      input.min = '0';
      input.step = '100';
      input.value = valor;
      input.setAttribute('aria-label', `${servicio.nombre}, ${datosGanancias.meses[indiceMes]}`);
      input.addEventListener('input', () => {
        servicio.valores[indiceMes] = Math.max(0, Number(input.value) || 0);
        actualizarTotalesTabla();
      });
      celda.appendChild(input);
      fila.appendChild(celda);
    });

    const total = document.createElement('td');
    total.dataset.totalServicio = indiceServicio;
    fila.appendChild(total);
    incomeTableBody.appendChild(fila);
  });

  const filaTotal = document.createElement('tr');
  filaTotal.innerHTML = '<td>Total mensual</td>';
  datosGanancias.meses.forEach((_, indiceMes) => {
    const celda = document.createElement('td');
    celda.dataset.totalMes = indiceMes;
    filaTotal.appendChild(celda);
  });
  const totalGeneral = document.createElement('td');
  totalGeneral.id = 'incomeGrandTotal';
  filaTotal.appendChild(totalGeneral);
  incomeTableFoot.appendChild(filaTotal);
  actualizarTotalesTabla();
}

renderizarTablaIngresos();
