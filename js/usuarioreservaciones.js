// PAWCARE/js/reservas.js

document.addEventListener('DOMContentLoaded', () => {
    // --- VISTAS ---
    const vistaCalendario = document.getElementById('vistaCalendario');
    const vistaFormulario = document.getElementById('vistaFormulario');
    const btnAgregar = document.getElementById('btnAgregar');
    const btnCancelar = document.getElementById('btnCancelar');
    const diasGrid = document.getElementById('diasGrid');
    const formReserva = document.getElementById('formReserva');
    const mesNombre = document.getElementById('mesNombre');
    const mesReserva = document.getElementById('mesReserva');
    const mesAnterior = document.getElementById('mesAnterior');
    const mesSiguiente = document.getElementById('mesSiguiente');

    // --- MODALES (PANTALLAS EMERGENTES) ---
    const modalExito = document.getElementById('modalExito');
    const modalError = document.getElementById('modalError');
    const btnCerrarExito = document.getElementById('btnCerrarExito');
    const btnCerrarError = document.getElementById('btnCerrarError');

    // Cambia entre la vista de calendario y la de formulario
    function mostrarVista(vista) {
        [vistaCalendario, vistaFormulario].forEach(v => v.classList.remove('activa'));
        vista.classList.add('activa');
    }

    if(btnAgregar) {
        btnAgregar.addEventListener('click', () => mostrarVista(vistaFormulario));
    }
    
    if(btnCancelar) {
        btnCancelar.addEventListener('click', () => {
            formReserva.reset();
            mostrarVista(vistaCalendario);
        });
    }

    // --- GENERAR CALENDARIO ---
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const anioActual = new Date().getFullYear();
    let indiceMes = meses.indexOf(mesReserva.value);

    function obtenerDiasEnMes() {
        return new Date(anioActual, indiceMes + 1, 0).getDate();
    }

    function obtenerPrimerDiaOffset() {
        const diaSemana = new Date(anioActual, indiceMes, 1).getDay();
        return (diaSemana + 6) % 7;
    }

    function generarCalendario() {
        if (!diasGrid) return;
        diasGrid.innerHTML = '';
        
        // Celdas vacías de desfase
        for (let i = 0; i < obtenerPrimerDiaOffset(); i++) {
            const vacio = document.createElement('div');
            vacio.className = 'dia dia--vacio';
            diasGrid.appendChild(vacio);
        }
        
        // Días activos
        for (let dia = 1; dia <= obtenerDiasEnMes(); dia++) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'dia';
            btn.textContent = dia;
            
            // Simular el día 8 seleccionado del diseño de Figma
            if (dia === 8) {
                btn.classList.add('dia--seleccionado');
            }
            
            btn.addEventListener('click', () => {
                document.querySelectorAll('.dia').forEach(d => d.classList.remove('dia--seleccionado'));
                btn.classList.add('dia--seleccionado');
            });
            diasGrid.appendChild(btn);
        }
    }

    // --- LLENAR SELECTS DE FECHAS ---
    function llenarSelectFechas(id) {
        const select = document.getElementById(id);
        if (!select) return;
        // Limpiar opciones previas exceptuando la primera por defecto
        select.innerHTML = '<option value="">Selecciona</option>';
        for (let dia = 1; dia <= obtenerDiasEnMes(); dia++) {
            const option = document.createElement('option');
            option.value = dia;
            option.textContent = dia;
            select.appendChild(option);
        }
    }

    generarCalendario();
    llenarSelectFechas('fechaIngreso');
    llenarSelectFechas('fechaSalida');

    // Sincronizar select de mes con el título del calendario
    if (mesReserva && mesNombre) {
        mesReserva.addEventListener('change', () => {
            indiceMes = meses.indexOf(mesReserva.value);
            actualizarCalendario();
        });
    }

    function actualizarCalendario() {
        mesNombre.textContent = meses[indiceMes];
        mesReserva.value = meses[indiceMes];
        generarCalendario();
        llenarSelectFechas('fechaIngreso');
        llenarSelectFechas('fechaSalida');
    }

    if (mesAnterior) {
        mesAnterior.addEventListener('click', () => {
            indiceMes = (indiceMes + 11) % meses.length;
            actualizarCalendario();
        });
    }

    if (mesSiguiente) {
        mesSiguiente.addEventListener('click', () => {
            indiceMes = (indiceMes + 1) % meses.length;
            actualizarCalendario();
        });
    }

    // --- ENVÍO Y VALIDACIÓN DEL FORMULARIO + MODALES ---
    if (formReserva) {
        formReserva.addEventListener('submit', (e) => {
            e.preventDefault();

            const fechaIngreso = parseInt(document.getElementById('fechaIngreso').value);
            const fechaSalida = parseInt(document.getElementById('fechaSalida').value);

            // Validación lógica básica: No puedes salir antes de ingresar
            if (fechaSalida < fechaIngreso) {
                // Mostrar pantalla emergente de error
                modalError.classList.add('mostrar');
                return;
            }

            // Captura de datos estructurada
            const datos = {
                mes: document.getElementById('mesReserva').value,
                fechaIngreso: fechaIngreso,
                fechaSalida: fechaSalida,
                nombreCliente: document.getElementById('nombreCliente').value,
                telefonoCliente: document.getElementById('telefonoCliente').value,
                nombreMascota: document.getElementById('nombreMascota').value,
                edadMascota: document.getElementById('edadMascota').value,
                razaMascota: document.getElementById('razaMascota').value
            };

            console.log('Simulación API - Nueva reservación exitosa:', datos);
            
            // Mostrar pantalla emergente de éxito
            modalExito.classList.add('mostrar');
        });
    }

    // --- MANEJO DE CIERRE DE PANTALLAS EMERGENTES ---
    if (btnCerrarExito) {
        btnCerrarExito.addEventListener('click', () => {
            modalExito.classList.remove('mostrar');
            formReserva.reset();
            mostrarVista(vistaCalendario);
        });
    }

    if (btnCerrarError) {
        btnCerrarError.addEventListener('click', () => {
            modalError.classList.remove('mostrar');
        });
    }
});
