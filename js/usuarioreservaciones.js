document.addEventListener('DOMContentLoaded', () => {
    if (typeof apiFetch === 'undefined') {
        window.apiFetch = async function(endpoint, opciones = {}) {
            const URL_BASE = 'http://107.22.53.32:8080/api'; 
            const urlCompleta = `${URL_BASE}${endpoint}`;
            
            opciones.headers = {
                'Content-Type': 'application/json',
                ...opciones.headers
            };

            const respuesta = await fetch(urlCompleta, opciones);
            
            if (!respuesta.ok) {
                const errorData = await respuesta.json().catch(() => ({}));
                throw new Error(errorData.message || `Error en el servidor: ${respuesta.status}`);
            }

            return await respuesta.json();
        };
    }

    const vistaCalendario = document.getElementById('vistaCalendario');
    const vistaFormulario = document.getElementById('vistaFormulario');
    const btnAgregar = document.getElementById('btnAgregar');
    const btnCancelar = document.getElementById('btnCancelar');
    const diasGrid = document.getElementById('diasGrid');
    const formReserva = document.getElementById('formReserva');
    
    // Habilitar la edición de campos dinámicamente
    const camposFormulario = ['nombreCliente', 'telefonoCliente', 'nombreMascota', 'edadMascota', 'razaMascota'];
    camposFormulario.forEach(id => {
        const campo = document.getElementById(id);
        if (campo) {
            campo.removeAttribute('disabled');
            campo.removeAttribute('readonly');
            campo.style.pointerEvents = 'auto'; 
        }
    });

    const mesNombre = document.getElementById('mesNombre');
    const mesReserva = document.getElementById('mesReserva');
    const mesAnterior = document.getElementById('mesAnterior');
    const mesSiguiente = document.getElementById('mesSiguiente');
    const serviciosCheckboxes = document.getElementById('serviciosCheckboxes');

    const modalExito = document.getElementById('modalExito');
    const modalError = document.getElementById('modalError');
    const btnCerrarExito = document.getElementById('btnCerrarExito');
    const btnCerrarError = document.getElementById('btnCerrarError');

    const sesion = JSON.parse(sessionStorage.getItem('usuarioActual') || '{}');

    // Precargamos los datos del cliente en sesión
    const nombreInput = document.getElementById('nombreCliente');
    const telefonoInput = document.getElementById('telefonoCliente');
    if (nombreInput) { nombreInput.value = sesion.nombre || ''; nombreInput.disabled = true; }
    if (telefonoInput) { telefonoInput.value = sesion.telefono || ''; telefonoInput.disabled = true; }

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

    function obtenerDiasEnMes() { return new Date(anioActual, indiceMes + 1, 0).getDate(); }
    function obtenerPrimerDiaOffset() { return (new Date(anioActual, indiceMes, 1).getDay() + 6) % 7; }
    function diaAFechaISO(dia) {
        return `${anioActual}-${String(indiceMes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    }

let citasDelMesDetalle = []; // Variable global para guardar los textos de búsqueda

    async function cargarReservasDelMes() {
        try {
            const idUsuario = sesion.id_usuario || null;
            if (!idUsuario) {
                console.warn('No se encontró un usuario con sesión activa.');
                return;
            }

            const respuesta = await apiFetch(`/citas?mes=${indiceMes + 1}&anio=${anioActual}&id_usuario=${idUsuario}`, { method: 'GET' });
            
            diasOcupados = new Set();
            citasDelMesDetalle = []; // Limpiamos en cada cambio de mes
            const listaCitas = respuesta.citas || respuesta; 
            if (!Array.isArray(listaCitas)) return;

            listaCitas.forEach(cita => {
                const fEntrada = cita.fecha_entrada || cita.fechaEntrada || cita.fecha_ingreso;
                const fSalida = cita.fecha_salida || cita.fechaSalida;

                if (fEntrada && fSalida) {
                    const fechaEntradaLimpia = fEntrada.includes('T') ? fEntrada.split('T')[0] : fEntrada;
                    const fechaSalidaLimpia = fSalida.includes('T') ? fSalida.split('T')[0] : fSalida;

                    const diaInicio = parseInt(fechaEntradaLimpia.split('-')[2]);
                    const diaFin = parseInt(fechaSalidaLimpia.split('-')[2]);

                    if (!isNaN(diaInicio) && !isNaN(diaFin)) {
                        for (let d = diaInicio; d <= diaFin; d++) {
                            diasOcupados.add(d);
                            // Guardamos los datos clave de la cita asociados a este día
                            citasDelMesDetalle.push({
                                dia: d,
                                textoBuscar: `${cita.nombre_mascota || ''} ${cita.nombre_cliente || ''} ${cita.estado || ''}`.toLowerCase()
                            });
                        }
                    }
                }
            });
        } catch (err) {
            console.warn('No se pudieron cargar las reservaciones del usuario:', err.message);
            diasOcupados = new Set();
            citasDelMesDetalle = [];
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
                // Buscamos los detalles guardados para asignárselos al botón
                const infoCita = citasDelMesDetalle.find(c => c.dia === dia);
                btn.dataset.info = infoCita ? infoCita.textoBuscar : 'ocupado';
                btn.title = infoCita ? `Mascota: ${infoCita.textoBuscar.split(' ')[0]}` : 'Ocupado';
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
        
        const valorPrevio = select.value; 
        select.innerHTML = '<option value="">Selecciona</option>';
        for (let dia = 1; dia <= obtenerDiasEnMes(); dia++) {
            const option = document.createElement('option');
            option.value = dia;
            option.textContent = dia;
            select.appendChild(option);
        }
        
        if (valorPrevio && valorPrevio <= obtenerDiasEnMes()) {
            select.value = valorPrevio;
        }
    }

    async function cargarServiciosDisponibles() {
        if (!serviciosCheckboxes) return;
        try {
            const respuesta = await apiFetch('/servicios', { method: 'GET' });
            serviciosCheckboxes.innerHTML = (respuesta.servicios || []).map(srv => `
                <label class="checkbox-servicio">
                    <input type="checkbox" name="servicio" value="${srv.id_servicio}">
                    ${srv.nombre}
                </label>
            `).join('');
        } catch (err) {
            serviciosCheckboxes.innerHTML = '<p style="color:#888;">No se pudieron cargar los servicios disponibles.</p>';
        }
    }

 // ---------- BUSCADOR LOCAL REAL CORREGIDO ----------
    const inputBuscar = document.querySelector('input[placeholder="Buscar reservacion..."]');
    if (inputBuscar) {
        inputBuscar.addEventListener('input', async (e) => {
            const termino = e.target.value.trim().toLowerCase();
            
            // Si el buscador se limpia, restauramos todo el mes original
            if (termino === '') {
                await actualizarCalendario();
                return;
            }

            const botonesDias = document.querySelectorAll('.dia:not(.dia--vacio)');
            botonesDias.forEach(btn => {
                const info = btn.dataset.info || '';
                // Si la celda no incluye lo que el usuario está escribiendo, la ocultamos/despintamos visualmente
                if (info !== '') {
                    if (!info.includes(termino)) {
                        btn.classList.remove('dia--ocupado'); 
                        btn.style.opacity = '0.3'; // Se vuelve semitransparente para denotar que no coincide
                    } else {
                        btn.classList.add('dia--ocupado');
                        btn.style.opacity = '1'; // Resalta la que sí coincide
                    }
                }
            });
        });
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
        mesReserva.addEventListener('change', () => { indiceMes = meses.indexOf(mesReserva.value); actualizarCalendario(); });
    }
    if (mesAnterior) mesAnterior.addEventListener('click', () => { indiceMes = (indiceMes + 11) % meses.length; actualizarCalendario(); });
    if (mesSiguiente) mesSiguiente.addEventListener('click', () => { indiceMes = (indiceMes + 1) % meses.length; actualizarCalendario(); });

    actualizarCalendario();
    cargarServiciosDisponibles();

    if (formReserva) {
        formReserva.addEventListener('submit', async (e) => {
            e.preventDefault();
            const diaIngreso = parseInt(document.getElementById('fechaIngreso').value);
            const diaSalida = parseInt(document.getElementById('fechaSalida').value);

            if (!diaIngreso || !diaSalida) {
                mostrarError('Por favor selecciona las fechas de ingreso y salida.');
                return;
            }

            if (diaSalida < diaIngreso) {
                mostrarError('La fecha de salida no puede ser antes que la fecha de ingreso.');
                return;
            }

            const serviciosSeleccionados = Array.from(
                document.querySelectorAll('input[name="servicio"]:checked')
            ).map(chk => Number(chk.value));

            const datos = {
                fechaEntrada: diaAFechaISO(diaIngreso),
                fechaSalida: diaAFechaISO(diaSalida),
                nombreCliente: sesion.nombre,
                telefonoCliente: sesion.telefono,
                nombreMascota: document.getElementById('nombreMascota').value,
                edadMascota: document.getElementById('edadMascota').value,
                razaMascota: document.getElementById('razaMascota').value,
                id_usuario: sesion.id_usuario || null, 
                servicios: serviciosSeleccionados
            };

            const btnGuardar = formReserva.querySelector('button[type="submit"]');
            if (btnGuardar) { btnGuardar.disabled = true; btnGuardar.textContent = 'Guardando...'; }

            try {
                await apiFetch('/citas', { method: 'POST', body: JSON.stringify(datos) });
                if (modalExito) modalExito.classList.add('mostrar');
                await actualizarCalendario();
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
    if (btnCerrarError) btnCerrarError.addEventListener('click', () => modalError.classList.remove('mostrar'));
});