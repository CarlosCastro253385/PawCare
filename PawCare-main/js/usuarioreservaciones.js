document.addEventListener('DOMContentLoaded', () => {

    if (typeof apiFetch === 'undefined') {
        window.apiFetch = async function(endpoint, opciones = {}) {
            const baseUrl = typeof API_BASE !== 'undefined' ? API_BASE : (window.URL_BASE || '/api');
            const urlCompleta = `${baseUrl}${endpoint}`;
            
            opciones.headers = {
                'Content-Type': 'application/json',
                ...opciones.headers
            };

            const respuesta = await fetch(urlCompleta, opciones);
            
            if (!respuesta.ok) {
                const errorData = await respuesta.json().catch(() => ({}));
                throw new Error(errorData.mensaje || errorData.message || `Error en el servidor: ${respuesta.status}`);
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

    const mesNombre = document.getElementById('mesNombre');
    const mesReserva = document.getElementById('mesReserva');
    const mesAnterior = document.getElementById('mesAnterior');
    const mesSiguiente = document.getElementById('mesSiguiente');
    const serviciosCheckboxes = document.getElementById('serviciosCheckboxes');

    const modalExito = document.getElementById('modalExito');
    const modalError = document.getElementById('modalError');
    const btnCerrarExito = document.getElementById('btnCerrarExito');
    const btnCerrarError = document.getElementById('btnCerrarError');

    const modalDetalleCita = document.getElementById('modalDetalleCita');
    const contenidoDetalleCita = document.getElementById('contenidoDetalleCita');
    const btnCerrarDetalle = document.getElementById('btnCerrarDetalle');

    const sesion = JSON.parse(sessionStorage.getItem('usuarioActual') || '{}');

    const nombreInput = document.getElementById('nombreCliente');
    const telefonoInput = document.getElementById('telefonoCliente');
    if (nombreInput) { 
        nombreInput.value = sesion.nombre || ''; 
        nombreInput.disabled = true; 
    }
    if (telefonoInput) { 
        telefonoInput.value = sesion.telefono || ''; 
        telefonoInput.disabled = true; 
    }

    function mostrarVista(vista) {
        if (!vista || !vistaCalendario || !vistaFormulario) return;
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
            if (formReserva) formReserva.reset();
            mostrarVista(vistaCalendario);
        });
    }

    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const anioActual = new Date().getFullYear();
    let indiceMes = mesReserva ? meses.indexOf(mesReserva.value) : new Date().getMonth();
    if (indiceMes === -1) indiceMes = new Date().getMonth();

    let diasOcupados = new Set();
    let citasDelMesDetalle = [];

    function obtenerDiasEnMes() { 
        return new Date(anioActual, indiceMes + 1, 0).getDate(); 
    }

    function obtenerPrimerDiaOffset() { 
        return (new Date(anioActual, indiceMes, 1).getDay() + 6) % 7; 
    }

    function diaAFechaISO(dia) {
        return `${anioActual}-${String(indiceMes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    }

    async function cargarReservasDelMes() {
        try {
            const idUsuario = sesion.id_usuario || null;
            let url = `/citas?mes=${indiceMes + 1}&anio=${anioActual}`;
            if (idUsuario) {
                url += `&id_usuario=${idUsuario}`;
            }

            const respuesta = await apiFetch(url, { method: 'GET' });
            
            diasOcupados = new Set();
            citasDelMesDetalle = [];
            
            const listaCitas = respuesta.citas || respuesta.data || (Array.isArray(respuesta) ? respuesta : []); 
            if (!Array.isArray(listaCitas)) return;

            listaCitas.forEach(cita => {
                const fEntrada = cita.fecha_entrada || cita.fechaEntrada;
                const fSalida = cita.fecha_salida || cita.fechaSalida;

                if (fEntrada && fSalida) {
                    const partesEntrada = fEntrada.split('T')[0].split('-');
                    const partesSalida = fSalida.split('T')[0].split('-');

                    const anioEntrada = parseInt(partesEntrada[0], 10);
                    const mesEntrada = parseInt(partesEntrada[1], 10);
                    const diaInicio = parseInt(partesEntrada[2], 10);
                    const diaFin = parseInt(partesSalida[2], 10);

                    if (anioEntrada === anioActual && mesEntrada === (indiceMes + 1)) {
                        for (let d = diaInicio; d <= diaFin; d++) {
                            diasOcupados.add(d);
                            citasDelMesDetalle.push({
                                id_cita: cita.id_cita || cita.id,
                                dia: d,
                                mascota: cita.nombre_mascota || 'Mascota',
                                cliente: cita.nombre_cliente || sesion.nombre || 'Cliente',
                                telefono: cita.telefono_cliente || sesion.telefono || 'Sin teléfono',
                                fechaEntrada: fEntrada.split('T')[0],
                                fechaSalida: fSalida.split('T')[0],
                                estado: cita.estado || 'Confirmada'
                            });
                        }
                    }
                }
            });
        } catch (err) {
            console.warn('Error al cargar reservaciones:', err.message);
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
            
            const registrosDelDia = citasDelMesDetalle.filter(c => c.dia === dia);

            if (diasOcupados.has(dia)) {
                btn.classList.add('dia--ocupado');
                if (registrosDelDia.length > 0) {
                    btn.title = registrosDelDia.map(r => `Reserva: ${r.mascota} (${r.estado})`).join('\n');
                }
            }
            
            btn.addEventListener('click', () => {
                document.querySelectorAll('.dia').forEach(d => d.classList.remove('dia--seleccionado'));
                btn.classList.add('dia--seleccionado');

                if (registrosDelDia.length > 0 && contenidoDetalleCita && modalDetalleCita) {
                    const cita = registrosDelDia[0];
                    contenidoDetalleCita.innerHTML = `
                        <p><strong>Mascota:</strong> ${cita.mascota}</p>
                        <p><strong>Fecha de Ingreso:</strong> ${cita.fechaEntrada}</p>
                        <p><strong>Fecha de Salida:</strong> ${cita.fechaSalida}</p>
                        <p><strong>Estado:</strong> <span class="badge">${cita.estado}</span></p>
                    `;
                    modalDetalleCita.classList.add('mostrar');
                }
            });

            diasGrid.appendChild(btn);
        }
    }

    if (btnCerrarDetalle) {
        btnCerrarDetalle.addEventListener('click', () => {
            if (modalDetalleCita) modalDetalleCita.classList.remove('mostrar');
        });
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
            
            let servicios = [];
            if (Array.isArray(respuesta)) {
                servicios = respuesta;
            } else if (Array.isArray(respuesta.servicios)) {
                servicios = respuesta.servicios;
            } else if (Array.isArray(respuesta.data)) {
                servicios = respuesta.data;
            }

            if (servicios.length === 0) {
                serviciosCheckboxes.innerHTML = `<p style="color: #721c24; background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 8px; border-radius: 6px; font-size: 13px;">⚠️ No hay servicios disponibles por el momento.</p>`;
                return;
            }

            serviciosCheckboxes.innerHTML = servicios.map(srv => {
                const id = srv.id_servicio || srv.id || srv.idServicio;
                const nombre = srv.nombre || srv.titulo || 'Servicio';
                const precio = srv.precio_mediano || srv.precio_pequeno || srv.precio_grande || null;
                const textoPrecio = precio ? ` ($${precio})` : '';

                return `
                    <label class="checkbox-servicio" style="display: inline-flex; align-items: center; gap: 8px; margin-right: 12px; margin-bottom: 10px; cursor: pointer; font-size: 14px; background: rgba(255,255,255,0.8); padding: 8px 14px; border-radius: 8px; border: 1px solid #e0e0e0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                        <input type="checkbox" name="servicio" value="${id}" style="cursor: pointer; width: 16px; height: 16px;">
                        <span><strong>${nombre}</strong>${textoPrecio}</span>
                    </label>
                `;
            }).join('');

        } catch (err) {
            console.warn('Error al cargar servicios:', err.message);
            serviciosCheckboxes.innerHTML = `<p style="color: #888; font-size: 13px;">No se pudieron cargar los servicios disponibles.</p>`;
        }
    }

    async function actualizarCalendario() {
        if (mesNombre) mesNombre.textContent = meses[indiceMes];
        if (mesReserva) mesReserva.value = meses[indiceMes];
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

    // Inicializar
    actualizarCalendario();
    cargarServiciosDisponibles();

    // Crear reservación desde cliente
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
                nombreCliente: sesion.nombre || (nombreInput ? nombreInput.value : ''),
                telefonoCliente: sesion.telefono || (telefonoInput ? telefonoInput.value : ''),
                nombreMascota: document.getElementById('nombreMascota').value,
                edadMascota: document.getElementById('edadMascota').value,
                razaMascota: document.getElementById('razaMascota').value,
                id_usuario: sesion.id_usuario || null,
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
                await actualizarCalendario();
            } catch (err) {
                mostrarError(err.message || 'No se pudo guardar la reservación.');
            } finally {
                if (btnGuardar) { btnGuardar.disabled = false; btnGuardar.textContent = 'Guardar reservación'; }
            }
        });
    }

    if (btnCerrarExito) {
        btnCerrarExito.addEventListener('click', () => {
            if (modalExito) modalExito.classList.remove('mostrar');
            if (formReserva) formReserva.reset();
            if (nombreInput) nombreInput.value = sesion.nombre || '';
            if (telefonoInput) telefonoInput.value = sesion.telefono || '';
            mostrarVista(vistaCalendario);
        });
    }
    if (btnCerrarError) {
        btnCerrarError.addEventListener('click', () => {
            if (modalError) modalError.classList.remove('mostrar');
        });
    }
});