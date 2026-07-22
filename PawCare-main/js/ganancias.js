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
let datosServicios = { etiquetas: ['Hospedaje', 'Baño', 'Paseos'], valores: [1500, 100, 500] };

// Precios base por defecto si deseas usarlos o valores iniciales registrados
const ingresosPorServicio = [
  { nombre: 'Hospedaje', valores: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1500] },
  { nombre: 'Baño', valores: [0, 0, 0, 0, 0, 0, 0, 0, 0, 100, 0, 0] },
  { nombre: 'Paseos', valores: [0, 500, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
];

const formatoMoneda = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });

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

    if (dataEspacio.ok && (dataEspacio.ocupado > 0 || dataEspacio.libre > 0)) {
      renderGraficaEspacio(dataEspacio);
    } else {
      renderGraficaEspacio({ ocupado: 19, libre: 31 }); // Valores por defecto visibles
    }

    if (dataMensuales.ok && dataMensuales.valores && dataMensuales.valores.some(v => v > 0)) {
      datosGanancias.valores = dataMensuales.valores;
    } else {
      datosGanancias.valores = obtenerTotalesMensuales();
    }
    renderGraficaGanancias();

    if (dataServicio.ok && dataServicio.valores && dataServicio.valores.some(v => v > 0)) {
      datosServicios.etiquetas = dataServicio.etiquetas;
      datosServicios.valores = dataServicio.valores;
    } else {
      datosServicios.etiquetas = ingresosPorServicio.map(s => s.nombre);
      datosServicios.valores = ingresosPorServicio.map(s => totalizarServicio(s));
    }
    renderGraficaServicios();

  } catch (error) {
    console.warn('Backend sin datos activos, cargando vista por defecto:', error);
    renderGraficaEspacio({ ocupado: 19, libre: 31 });
    datosGanancias.valores = obtenerTotalesMensuales();
    renderGraficaGanancias();
    datosServicios.etiquetas = ingresosPorServicio.map(s => s.nombre);
    datosServicios.valores = ingresosPorServicio.map(s => totalizarServicio(s));
    renderGraficaServicios();
  }
}

function renderGraficaEspacio(dataEspacio) {
  const ctxEspacio = document.getElementById('espacioChart');
  if (!ctxEspacio) return;

  if (espacioChart) espacioChart.destroy();

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
          callbacks: { label: (item) => `${item.label}: ${item.raw} mascotas` },
        },
      },
    },
  });

  const leyendaEspacio = document.getElementById('espacioLeyenda');
  if (leyendaEspacio) {
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
}

function renderGraficaGanancias() {
  const ctxGanancias = document.getElementById('gananciasChart');
  if (!ctxGanancias) return;

  if (gananciasChart) gananciasChart.destroy();

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

function renderGraficaServicios() {
  const ctxServicios = document.getElementById('serviciosChart');
  if (!ctxServicios) return;

  if (serviciosChart) serviciosChart.destroy();

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
  if (!leyendaServicios) return;
  leyendaServicios.innerHTML = '';
  datosServicios.etiquetas.forEach((texto, i) => {
    const li = document.createElement('li');
    const monto = datosServicios.valores[i] || 0;
    li.innerHTML = `<span class="legend-dot" style="background:${coloresServicios[i % coloresServicios.length]}"></span>${texto}: $${monto.toLocaleString('es-MX')}`;
    leyendaServicios.appendChild(li);
  });
}

// Control de Pestañas
const tabGraficasBtn = document.getElementById('tabGraficasBtn');
const tabEditarBtn = document.getElementById('tabEditarBtn');
const vistaGraficas = document.getElementById('vistaGraficas');
const vistaEditar = document.getElementById('vistaEditar');

if (tabGraficasBtn && tabEditarBtn) {
  function mostrarVista(nombre) {
    const esGraficas = nombre === 'graficas';
    if (vistaGraficas) vistaGraficas.hidden = !esGraficas;
    if (vistaEditar) vistaEditar.hidden = esGraficas;
    tabGraficasBtn.classList.toggle('active', esGraficas);
    tabEditarBtn.classList.toggle('active', !esGraficas);
  }

  tabGraficasBtn.addEventListener('click', () => mostrarVista('graficas'));
  tabEditarBtn.addEventListener('click', () => mostrarVista('editar'));
}

// Contadores stepper
const CAPACIDAD_TOTAL = 50;
const contadores = { reservados: 15, ocupados: 19 };

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
    if (valoresPorId[objetivo]) valoresPorId[objetivo].textContent = contadores[objetivo];
    
    const capOcupado = document.getElementById('capacityOcupado');
    const capLibre = document.getElementById('capacityLibre');
    if (capOcupado) capOcupado.textContent = contadores.ocupados;
    if (capLibre) capLibre.textContent = CAPACIDAD_TOTAL - contadores.ocupados;

    actualizarBotonesStepper();
  });
});
actualizarBotonesStepper();

// Tabla de Ingresos
function totalizarServicio(servicio) {
  return servicio.valores.reduce((total, valor) => total + valor, 0);
}

function obtenerTotalesMensuales() {
  return MESES.map((_, i) =>
    ingresosPorServicio.reduce((total, servicio) => total + servicio.valores[i], 0)
  );
}

function actualizarTotalesTabla() {
  const totales = obtenerTotalesMensuales();
  ingresosPorServicio.forEach((servicio, i) => {
    const el = document.querySelector(`[data-total-servicio="${i}"]`);
    if (el) el.textContent = formatoMoneda.format(totalizarServicio(servicio));
  });
  totales.forEach((total, i) => {
    const el = document.querySelector(`[data-total-mes="${i}"]`);
    if (el) el.textContent = formatoMoneda.format(total);
  });
  const grandTotalEl = document.getElementById('incomeGrandTotal');
  if (grandTotalEl) grandTotalEl.textContent = formatoMoneda.format(totales.reduce((t, v) => t + v, 0));
}

function renderizarTablaIngresos() {
  const incomeTableBody = document.getElementById('incomeTableBody');
  const incomeTableFoot = document.getElementById('incomeTableFoot');
  if (!incomeTableBody || !incomeTableFoot) return;
  
  incomeTableBody.innerHTML = '';
  incomeTableFoot.innerHTML = '';

  ingresosPorServicio.forEach((servicio, indiceServicio) => {
    const fila = document.createElement('tr');
    
    const nombre = document.createElement('td');
    nombre.style.fontWeight = '600';
    nombre.style.minWidth = '90px';
    nombre.textContent = servicio.nombre;
    fila.appendChild(nombre);

    servicio.valores.forEach((valor, indiceMes) => {
      const celda = document.createElement('td');
      const input = document.createElement('input');
      input.type = 'number';
      input.min = '0';
      input.step = '50'; // Permite subir/bajar de 50 en 50 con las flechitas
      input.style.width = '70px';
      input.style.padding = '4px';
      input.style.textAlign = 'center';
      input.style.borderRadius = '6px';
      input.style.border = '1px solid #cbd5e1';
      input.value = valor;
      
      input.addEventListener('input', () => {
        servicio.valores[indiceMes] = Math.max(0, Number(input.value) || 0);
        actualizarTotalesTabla();
      });
      celda.appendChild(input);
      fila.appendChild(celda);
    });

    const total = document.createElement('td');
    total.style.fontWeight = 'bold';
    total.dataset.totalServicio = indiceServicio;
    fila.appendChild(total);
    incomeTableBody.appendChild(fila);
  });

  const filaTotal = document.createElement('tr');
  filaTotal.style.background = '#f1f5f9';
  filaTotal.style.fontWeight = 'bold';
  
  const celdaEtiquetaTotal = document.createElement('td');
  celdaEtiquetaTotal.textContent = 'Total';
  celdaEtiquetaTotal.style.minWidth = '90px';
  filaTotal.appendChild(celdaEtiquetaTotal);
  
  MESES.forEach((_, i) => {
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

// Modal y Guardado
const guardarBtn = document.getElementById('guardarBtn');
const confirmModal = document.getElementById('confirmModal');
const cancelarBtn = document.getElementById('cancelarBtn');
const confirmarBtn = document.getElementById('confirmarBtn');

if (guardarBtn && confirmModal) {
  guardarBtn.addEventListener('click', () => {
    confirmModal.classList.add('active');
  });
}

if (cancelarBtn && confirmModal) {
  cancelarBtn.addEventListener('click', () => {
    confirmModal.classList.remove('active');
  });
}

if (confirmarBtn) {
  confirmarBtn.addEventListener('click', async () => {
    if (confirmModal) confirmModal.classList.remove('active');

    // Sincronización visual inmediata al presionar confirmar
    datosGanancias.valores = obtenerTotalesMensuales();
    datosServicios.etiquetas = ingresosPorServicio.map(s => s.nombre);
    datosServicios.valores = ingresosPorServicio.map(s => totalizarServicio(s));

    renderGraficaGanancias();
    renderGraficaServicios();
    renderGraficaEspacio({ ocupado: contadores.ocupados, libre: CAPACIDAD_TOTAL - contadores.ocupados });

    alert('¡Cambios aplicados y gráficas actualizadas con éxito!');
  });
}

// Inicialización
renderizarTablaIngresos();
cargarDatosGraficas();