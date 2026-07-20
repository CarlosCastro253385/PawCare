// PAWCARE/js/reservaciones.js
document.addEventListener('DOMContentLoaded', () => {
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
    const serviciosCheckboxes = document.getElementById('serviciosCheckboxes');

    const modalExito = document.getElementById('modalExito');
    const modalError = document.getElementById('modalError');
    const btnCerrarExito = document.getElementById('btnCerrarExito');
    const btnCerrarError = document.getElementById('btnCerrarError');

    function mostrarVista(vista) {
        [vistaCalendario, vistaFormulario].forEach(v => v.classList.remove('activa'));
        vista.classList.add('activa');
    }

    function mostrarError(mensaje) {
        const texto = modalError ? modalError.querySelector('p') : null;
        if (texto && mensaje) texto.textContent = mensaje;
        if (modalError) modalError.classList.add('mostrar');
    }

    if (btnAgregar) btnAgregar.addEventListener('click', () => mostrarVista(vistaFormulario));
    if (btnCancelar) {
        btnCancelar.addEventListener('click', () => {
            formReserva.reset();
            mostrarVista(vistaCalendario);
        });
    }

    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const anioActual = new Date().getFullYear();
    let indiceMes = meses.indexOf(mesReserva.value);
    let diasOcupados = new Set();

    function obtenerDiasEnMes() {
        return new Date(anioActual, indiceMes + 1, 0).getDate();
    }

    function obtenerPrimerDiaOffset() {
        const diaSemana = new Date(anioActual, indiceMes, 1).getDay();
        return (diaSemana + 6) % 7;
    }

    function diaAFechaISO(dia) {
        const mesConCero = String(indiceMes + 1).padStart(2, '0');
        const diaConCero = String(dia).padStart(2, '0');
        return `${anioActual}-${mesConCero}-${diaConCero}`;
    }

    async function cargarReservasDelMes() {
        try {
            const respuesta = await apiFetch(`/citas?mes=${indiceMes + 1}&anio=${anioActual}`, { method: 'GET' });
            diasOcupados = new Set();
            (respuesta.citas || []).forEach(cita => {
                const inicio = new Date(cita.fecha_entrada).getDate();
                const fin = new Date(cita.fecha_salida).getDate();
                for (let d = inicio; d <= fin; d++) diasOcupados.add(d);
            });
        } catch (err) {
            console.warn('No se pudieron cargar las reservaciones del mes:', err.message);
            diasOcupados = new Set();
        }
    }

    function generarCalendario() {
        if (!diasGrid) return;
        diasGrid.innerHTML = '';

        for (let i = 0; i < obtenerPrimerDiaOffset(); i++) {
            const vacio = document.createElement('div');
            vacio.className = 'dia dia--vacio';
            diasGrid.appendChild(vacio);
        }

        for (let dia = 1; dia <= obtenerDiasEnMes(); dia++) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'dia';
            btn.textContent = dia;

            if (diasOcupados.has(dia)) {
                btn.classList.add('dia--ocupado');
                btn.title = 'Ya hay una reservación en esta fecha';
            }

            btn.addEventListener('click', () => {
                document.querySelectorAll('.dia').forEach(d => d.classList.remove('dia--seleccionado'));
                btn.classList.add('dia--seleccionado');
            });
            diasGrid.appendChild(btn);
        }
    }

    function llenarSelectFechas(id) {
        const select = document.getElementById(id);
        if (!select) return;
        select.innerHTML = '<option value="">Selecciona</option>';
        for (let dia = 1; dia <= obtenerDiasEnMes(); dia++) {
            const option = document.createElement('option');
            option.value = dia;
            option.textContent = dia;
            select.appendChild(option);
        }
    }

    // ---------- NUEVO: cargar los servicios reales para los checkboxes ----------
    async function cargarServiciosDisponibles() {
        if (!serviciosCheckboxes) return;
        try {
            const respuesta = await apiFetch('/servicios', { method: 'GET' });
            const servicios = respuesta.servicios || [];

            serviciosCheckboxes.innerHTML = servicios.map(srv => `
                <label class="checkbox-servicio">
                    <input type="checkbox" name="servicio" value="${srv.id_servicio}">
                    ${srv.nombre}
                </label>
            `).join('');
        } catch (err) {
            console.warn('No se pudieron cargar los servicios:', err.message);
            serviciosCheckboxes.innerHTML = '<p style="color:#888;">No se pudieron cargar los servicios disponibles.</p>';
        }
    }

    async function actualizarCalendario() {
        mesNombre.textContent = meses[indiceMes];
        mesReserva.value = meses[indiceMes];
        await cargarReservasDelMes();
        generarCalendario();
        llenarSelectFechas('fechaIngreso');
        llenarSelectFechas('fechaSalida');
    }

    if (mesReserva && mesNombre) {
        mesReserva.addEventListener('change', () => {
            indiceMes = meses.indexOf(mesReserva.value);
            actualizarCalendario();
        });
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

    actualizarCalendario();
    cargarServiciosDisponibles();

    if (formReserva) {
        formReserva.addEventListener('submit', async (e) => {
            e.preventDefault();

            const diaIngreso = parseInt(document.getElementById('fechaIngreso').value);
            const diaSalida = parseInt(document.getElementById('fechaSalida').value);

            if (diaSalida < diaIngreso) {
                mostrarError('La fecha de salida no puede ser antes que la fecha de ingreso.');
                return;
            }

            // NUEVO: recolectar los checkboxes de servicios marcados
            const serviciosSeleccionados = Array.from(
                document.querySelectorAll('input[name="servicio"]:checked')
            ).map(chk => Number(chk.value));

            const datos = {
                fechaEntrada: diaAFechaISO(diaIngreso),
                fechaSalida: diaAFechaISO(diaSalida),
                nombreCliente: document.getElementById('nombreCliente').value,
                telefonoCliente: document.getElementById('telefonoCliente').value,
                nombreMascota: document.getElementById('nombreMascota').value,
                edadMascota: document.getElementById('edadMascota').value,
                razaMascota: document.getElementById('razaMascota').value,
                id_usuario: JSON.parse(sessionStorage.getItem('usuarioActual') || '{}').id_usuario || null,
                servicios: serviciosSeleccionados
            };

            const btnGuardar = formReserva.querySelector('button[type="submit"]');
            if (btnGuardar) { btnGuardar.disabled = true; btnGuardar.textContent = 'Guardando...'; }

            try {
                await apiFetch('/citas', {
                    method: 'POST',
                    body: JSON.stringify(datos)
                });

                if (modalExito) modalExito.classList.add('mostrar');
                await cargarReservasDelMes();
                generarCalendario();
            } catch (err) {
                mostrarError(err.message || 'No se pudo guardar la reservación. Intenta de nuevo.');
            } finally {
                if (btnGuardar) { btnGuardar.disabled = false; btnGuardar.textContent = 'Guardar reservación'; }
            }
        });
    }

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