const API_BASE = 'http://107.22.53.32:8080/api';

// Colores de la marca PawCARE
const colorVacio = '#2f4257';
const colorLleno = '#4888b2';
const colorBarra = '#5caee4';
const coloresServicios = ['#2f4257', '#4888b2', '#8ed1fe', '#a7dbf5', '#1d3348'];

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

let gananciasChart, serviciosChart, espacioChart;
let datosGanancias = { meses: MESES, valores: Array(12).fill(0) };
let datosServicios = { etiquetas: [], valores: [] };

// ---------- Carga inicial de datos reales ----------
async function cargarDatosGraficas() {
  try {
    const anio = new Date().getFullYear();

    const [respEspacio, respMensuales, respServicio] = await Promise.all([
      fetch(`${API_BASE}/ganancias/espacio`),
      fetch(`${API_BASE}/ganancias/mensuales?anio=${anio}`),
      fetch(`${API_BASE}/ganancias/por-servicio?anio=${anio}`)
    ]);

    const dataEspacio = await respEspacio.json();
    const dataMensuales = await respMensuales.json();
    const dataServicio = await respServicio.json();

    if (!dataEspacio.ok || !dataMensuales.ok || !dataServicio.ok) {
      throw new Error('Una de las respuestas del servidor no fue exitosa');
    }

    renderGraficaEspacio(dataEspacio);

    datosGanancias.valores = dataMensuales.valores;
    renderGraficaGanancias();

    datosServicios.etiquetas = dataServicio.etiquetas;
    datosServicios.valores = dataServicio.valores;
    renderGraficaServicios();

    // Reflejar tambien en las cajas de Ocupado/Libre si existen en tu HTML
    const capOcupado = document.getElementById('capacityOcupado');
    const capLibre = document.getElementById('capacityLibre');
    if (capOcupado) capOcupado.textContent = dataEspacio.ocupado;
    if (capLibre) capLibre.textContent = dataEspacio.libre;

  } catch (error) {
    console.error('Error al cargar datos de ganancias:', error);
    alert('No se pudieron cargar los datos de ganancias. Intenta de nuevo.');
  }
}

// ---------- Gráfica de pastel: Espacio en la guardería ----------
function renderGraficaEspacio(dataEspacio) {
  const ctxEspacio = document.getElementById('espacioChart');

  espacioChart = new Chart(ctxEspacio, {
    type: 'doughnut',
    data: {
      labels: ['Ocupado', 'Libre'],
      datasets: [{
        data: [dataEspacio.ocupado, dataEspacio.libre],
        backgroundColor: [colorLleno, colorVacio],
        borderWidth: 0,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '55%',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (item) => `${item.label}: ${item.raw} mascotas`,
          },
        },
      },
    },
  });

  const leyendaEspacio = document.getElementById('espacioLeyenda');
  leyendaEspacio.innerHTML = '';
  [
    { color: colorLleno, texto: `Ocupado: ${dataEspacio.ocupado}` },
    { color: colorVacio, texto: `Libre: ${dataEspacio.libre}` },
  ].forEach(({ color, texto }) => {
    const li = document.createElement('li');
    li.innerHTML = `<span class="legend-dot" style="background:${color}"></span>${texto}`;
    leyendaEspacio.appendChild(li);
  });
}

// ---------- Gráfica de barras: Ganancias mensuales ----------
function renderGraficaGanancias() {
  const ctxGanancias = document.getElementById('gananciasChart');

  gananciasChart = new Chart(ctxGanancias, {
    type: 'bar',
    data: {
      labels: datosGanancias.meses,
      datasets: [{
        label: 'Ganancias ($)',
        data: datosGanancias.valores,
        backgroundColor: colorBarra,
        borderRadius: 8,
        maxBarThickness: 56,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: (item) => `$${item.raw.toLocaleString('es-MX')}` },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { callback: (valor) => `$${valor.toLocaleString('es-MX')}` },
          grid: { color: '#eeeeee' },
        },
        x: { grid: { display: false } },
      },
    },
  });
}

// ---------- Gráfica de pastel: Ingresos por servicio ----------
function renderGraficaServicios() {
  const ctxServicios = document.getElementById('serviciosChart');

  serviciosChart = new Chart(ctxServicios, {
    type: 'doughnut',
    data: {
      labels: datosServicios.etiquetas,
      datasets: [{
        data: datosServicios.valores,
        backgroundColor: coloresServicios,
        borderWidth: 0,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '55%',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (item) => `${item.label}: $${item.raw.toLocaleString('es-MX')}`,
          },
        },
      },
    },
  });

  actualizarLeyendaServicios();
}

function actualizarLeyendaServicios() {
  const leyendaServicios = document.getElementById('serviciosLeyenda');
  leyendaServicios.innerHTML = '';
  datosServicios.etiquetas.forEach((texto, i) => {
    const li = document.createElement('li');
    li.innerHTML = `<span class="legend-dot" style="background:${coloresServicios[i % coloresServicios.length]}"></span>${texto}: $${datosServicios.valores[i].toLocaleString('es-MX')}`;
    leyendaServicios.appendChild(li);
  });
}

// ---------- Botón "Agregar información" ----------
const agregarBtn = document.getElementById('agregarBtn');
if (agregarBtn) {
  agregarBtn.addEventListener('click', () => {
    alert('Aquí conectas tu formulario o modal para agregar información nueva.');
  });
}

// ==============================================================
// VISTA "EDITAR DATOS" — sigue siendo una simulacion local, NO
// persiste en el backend todavia. Ver nota arriba en el chat.
// ==============================================================

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

const CAPACIDAD_TOTAL = 50;
const contadores = { reservados: 12, ocupados: 20 };

const valorReservadosEl = document.getElementById('valorReservados');
const valorOcupadosEl = document.getElementById('valorOcupados');
const valoresPorId = { reservados: valorReservadosEl, ocupados: valorOcupadosEl };

function actualizarBotonesStepper() {
  document.querySelectorAll('.stepper-btn').forEach((boton) => {
    const objetivo = boton.dataset.target;
    const valor = contadores[objetivo];
    boton.disabled = boton.dataset.op === '-' ? valor <= 0 : valor >= CAPACIDAD_TOTAL;
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

const blockGrid = document.getElementById('blockGrid');
const TOTAL_FILAS = 4;
const TOTAL_COLUMNAS = 7;

if (blockGrid) {
  for (let i = 0; i < TOTAL_FILAS * TOTAL_COLUMNAS; i++) {
    const bloque = document.createElement('button');
    bloque.type = 'button';
    bloque.className = 'data-block';
    if (Math.random() > 0.4) bloque.classList.add('filled');
    bloque.addEventListener('click', () => bloque.classList.toggle('filled'));
    blockGrid.appendChild(bloque);
  }
}

const agregarDatoBtn = document.getElementById('agregarDatoBtn');
if (agregarDatoBtn) {
  agregarDatoBtn.addEventListener('click', () => {
    const nuevoBloque = document.createElement('button');
    nuevoBloque.type = 'button';
    nuevoBloque.className = 'data-block filled';
    nuevoBloque.addEventListener('click', () => nuevoBloque.classList.toggle('filled'));
    blockGrid.appendChild(nuevoBloque);
  });
}

const guardarBtn = document.getElementById('guardarBtn');
const confirmModal = document.getElementById('confirmModal');
const confirmarBtn = document.getElementById('confirmarBtn');
const cancelarBtn = document.getElementById('cancelarBtn');

guardarBtn.addEventListener('click', () => confirmModal.classList.add('active'));

confirmarBtn.addEventListener('click', () => {
  confirmModal.classList.remove('active');
  document.getElementById('capacityOcupado').textContent = contadores.ocupados;
  document.getElementById('capacityLibre').textContent = Math.max(0, CAPACIDAD_TOTAL - contadores.ocupados);

  datosGanancias.valores = obtenerTotalesMensuales();
  gananciasChart.data.datasets[0].data = datosGanancias.valores;
  gananciasChart.update();

  alert('Datos guardados localmente (simulacion). Esto todavia no se guarda en la base de datos real.');
});

cancelarBtn.addEventListener('click', () => confirmModal.classList.remove('active'));
confirmModal.addEventListener('click', (evento) => {
  if (evento.target === confirmModal) confirmModal.classList.remove('active');
});

// ---------- Tabla de ingresos por servicio y mes (simulacion local) ----------
const ingresosPorServicio = [
  { nombre: 'Hospedaje', valores: Array(12).fill(0) },
  { nombre: 'Baño', valores: Array(12).fill(0) },
  { nombre: 'Paseos', valores: Array(12).fill(0) },
];
const incomeTableBody = document.getElementById('incomeTableBody');
const incomeTableFoot = document.getElementById('incomeTableFoot');
const formatoMoneda = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });

function totalizarServicio(servicio) {
  return servicio.valores.reduce((total, valor) => total + valor, 0);
}

function obtenerTotalesMensuales() {
  return datosGanancias.meses.map((_, i) =>
    ingresosPorServicio.reduce((total, servicio) => total + servicio.valores[i], 0)
  );
}

function actualizarTotalesTabla() {
  const totales = obtenerTotalesMensuales();
  ingresosPorServicio.forEach((servicio, i) => {
    document.querySelector(`[data-total-servicio="${i}"]`).textContent = formatoMoneda.format(totalizarServicio(servicio));
  });
  totales.forEach((total, i) => {
    document.querySelector(`[data-total-mes="${i}"]`).textContent = formatoMoneda.format(total);
  });
  document.getElementById('incomeGrandTotal').textContent = formatoMoneda.format(totales.reduce((t, v) => t + v, 0));
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
  datosGanancias.meses.forEach((_, i) => {
    const celda = document.createElement('td');
    celda.dataset.totalMes = i;
    filaTotal.appendChild(celda);
  });
  const totalGeneral = document.createElement('td');
  totalGeneral.id = 'incomeGrandTotal';
  filaTotal.appendChild(totalGeneral);
  incomeTableFoot.appendChild(filaTotal);
  actualizarTotalesTabla();
}

renderizarTablaIngresos();
cargarDatosGraficas();