document.addEventListener('DOMContentLoaded', () => {

    // Helper para llamadas a la API de la vista Admin
    if (typeof apiFetch === 'undefined') {
        window.apiFetch = async function(endpoint, opciones = {}) {
            const urlCompleta = `${window.URL_BASE || '/api'}${endpoint}`;
            
            opciones.headers = {
                'Content-Type': 'application/json',
                ...opciones.headers
            };

            const respuesta = await fetch(urlCompleta, opciones);
            
            if (!respuesta.ok) {
                const errorData = await respuesta.json().catch(() => ({}));
                throw new Error(errorData.message || errorData.mensaje || `Error en el servidor: ${respuesta.status}`);
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

    // Elementos del modal de detalle y eliminación del Admin
    const modalDetalleCita = document.getElementById('modalDetalleCita');
    const contenidoDetalleCita = document.getElementById('contenidoDetalleCita');
    const btnEliminarCita = document.getElementById('btnEliminarCita');
    const btnCerrarDetalle = document.getElementById('btnCerrarDetalle');
    let citaSeleccionadaId = null;

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
    
    let diasOcupados = new Set();
    let citasDelMesDetalle = [];

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

    // Cargar TODAS las reservaciones globales del mes (Admin)
    async function cargarReservasDelMes() {
        try {
            const respuesta = await apiFetch(`/citas?mes=${indiceMes + 1}&anio=${anioActual}`, { method: 'GET' });
            
            diasOcupados = new Set();
            citasDelMesDetalle = []; 
            
            const listaCitas = respuesta.citas || respuesta.data || (Array.isArray(respuesta) ? respuesta : []); 
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
                            
                            citasDelMesDetalle.push({
                                id_cita: cita.id_cita || cita.id,
                                dia: d,
                                mascota: cita.nombre_mascota || 'Mascota',
                                cliente: cita.nombre_cliente || 'Cliente',
                                telefono: cita.telefono_cliente || 'Sin teléfono',
                                fechaEntrada: fechaEntradaLimpia,
                                fechaSalida: fechaSalidaLimpia,
                                textoBuscar: `${cita.nombre_mascota || ''} ${cita.nombre_cliente || ''} ${cita.telefono_cliente || ''}`.toLowerCase()
                            });
                        }
                    }
                }
            });
        } catch (err) {
            console.warn('No se pudieron cargar las reservaciones globales:', err.message);
            diasOcupados = new Set();
            citasDelMesDetalle = [];
        }
    }

    // Filtro de búsqueda en el calendario
    const inputBuscar = document.querySelector('input[placeholder="Buscar reservacion..."]');
    if (inputBuscar) {
        inputBuscar.addEventListener('input', async (e) => {
            const termino = e.target.value.trim().toLowerCase();
            
            if (termino === '') {
                await actualizarCalendario();
                return;
            }

            const botonesDias = document.querySelectorAll('.dia:not(.dia--vacio)');
            botonesDias.forEach(btn => {
                const info = btn.dataset.info || '';
                if (info !== '') {
                    if (!info.includes(termino)) {
                        btn.classList.remove('dia--ocupado');
                        btn.style.opacity = '0.2'; 
                    } else {
                        btn.classList.add('dia--ocupado');
                        btn.style.opacity = '1'; 
                    }
                }
            });
        });
    }

    function generarCalendario() {
        if (!diasGrid) return;
        diasGrid.innerHTML = '';

        const inputBuscar = document.querySelector('input[placeholder="Buscar reservacion..."]');
        const termino = inputBuscar ? inputBuscar.value.trim().toLowerCase() : '';

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
                if (registrosDelDia.length > 0) {
                    const infoData = registrosDelDia.map(r => r.textoBuscar).join(' | ');
                    btn.dataset.info = infoData;
                    btn.title = registrosDelDia.map(r => `Mascota: ${r.mascota} (Dueño: ${r.cliente})`).join('\n');

                    if (termino !== '') {
                        if (!infoData.includes(termino)) {
                            btn.style.opacity = '0.2'; 
                        } else {
                            btn.classList.add('dia--ocupado'); 
                            btn.style.opacity = '1';
                        }
                    } else {
                        btn.classList.add('dia--ocupado');
                        btn.style.opacity = '1';
                    }
                } else {
                    btn.classList.add('dia--ocupado');
                    btn.title = 'Reservación registrada';
                }
            }

            btn.addEventListener('click', () => {
                document.querySelectorAll('.dia').forEach(d => d.classList.remove('dia--seleccionado'));
                btn.classList.add('dia--seleccionado');

                if (registrosDelDia.length > 0) {
                    const primeraCita = registrosDelDia[0]; 
                    citaSeleccionadaId = primeraCita.id_cita;

                    if (contenidoDetalleCita && modalDetalleCita) {
                        contenidoDetalleCita.innerHTML = `
                            <p><strong>Mascota:</strong> ${primeraCita.mascota}</p>
                            <p><strong>Cliente:</strong> ${primeraCita.cliente}</p>
                            <p><strong>Teléfono:</strong> ${primeraCita.telefono}</p>
                            <p><strong>Ingreso:</strong> ${primeraCita.fechaEntrada}</p>
                            <p><strong>Salida:</strong> ${primeraCita.fechaSalida}</p>
                        `;
                        modalDetalleCita.classList.add('mostrar');
                    }
                }
            });
            diasGrid.appendChild(btn);
        }
    }

    // Eliminación de reservas desde la vista del Administrador
    if (btnEliminarCita) {
        btnEliminarCita.addEventListener('click', async () => {
            if (!citaSeleccionadaId) return;
            
            if (confirm('¿Estás seguro de que deseas eliminar esta reservación de forma permanente?')) {
                btnEliminarCita.disabled = true;
                btnEliminarCita.textContent = 'Eliminando...';
                
                try {
                    await apiFetch(`/citas/${citaSeleccionadaId}`, { method: 'DELETE' });
                    exitoEliminacion();
                } catch (err) {
                    console.error("Error al borrar:", err.message);
                    alert('No se pudo eliminar la reservación: ' + err.message);
                } finally {
                    btnEliminarCita.disabled = false;
                    btnEliminarCita.innerHTML = '<i class="fa-solid fa-trash"></i> Eliminar Reservación';
                }
            }
        });
    }

    function exitoEliminacion() {
        if (modalDetalleCita) modalDetalleCita.classList.remove('mostrar');
        actualizarCalendario();
        alert('Reservación eliminada correctamente. El espacio se ha liberado.');
        citaSeleccionadaId = null;
    }

    if (btnCerrarDetalle) {
        btnCerrarDetalle.addEventListener('click', () => {
            if (modalDetalleCita) modalDetalleCita.classList.remove('mostrar');
            citaSeleccionadaId = null;
        });
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

    // Carga de Servicios ultra-flexible (Detecta cualquier formato JSON)
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
            } else if (Array.isArray(respuesta.datos)) {
                servicios = respuesta.datos;
            }

            if (servicios.length === 0) {
                serviciosCheckboxes.innerHTML = '<p style="color:#888; font-size: 14px;">No hay servicios creados aún en el catálogo.</p>';
                return;
            }

            serviciosCheckboxes.innerHTML = servicios.map(srv => {
                const id = srv.id_servicio || srv.id || srv.idServicio || srv._id;
                const nombre = srv.nombre || srv.nombre_servicio || srv.servicio || 'Servicio sin nombre';

                return `
                    <label class="checkbox-servicio" style="display: inline-flex; align-items: center; gap: 8px; margin-right: 15px; margin-bottom: 10px; cursor: pointer; font-size: 14px; background: rgba(255,255,255,0.6); padding: 6px 12px; border-radius: 6px; border: 1px solid #ddd;">
                        <input type="checkbox" name="servicio" value="${id}">
                        <span>${nombre}</span>
                    </label>
                `;
            }).join('');

        } catch (err) {
            console.warn('Error al cargar servicios en reservas:', err.message);
            serviciosCheckboxes.innerHTML = '<p style="color:#e71d36; font-size: 14px;">No se pudieron cargar los servicios disponibles.</p>';
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

    // Crear reservación desde Admin
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
            if (modalExito) modalExito.classList.remove('mostrar');
            if (formReserva) formReserva.reset();
            mostrarVista(vistaCalendario);
        });
    }
    if (btnCerrarError) {
        btnCerrarError.addEventListener('click', () => {
            if (modalError) modalError.classList.remove('mostrar');
        });
    }
});