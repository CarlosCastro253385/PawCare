document.addEventListener('DOMContentLoaded', () => {
    const URL_BASE = window.URL_BASE || '/api';

    // -------------------------------------------------------------------
    // 1. ELEMENTOS DEL DOM
    // -------------------------------------------------------------------
    const vistaCalendario = document.getElementById('vistaCalendario');
    const vistaFormulario = document.getElementById('vistaFormulario');
    const btnAgregar = document.getElementById('btnAgregar');
    const btnCancelar = document.getElementById('btnCancelar');
    const formReserva = document.getElementById('formReserva');

    // Elementos del Calendario
    const mesNombre = document.getElementById('mesNombre');
    const diasGrid = document.getElementById('diasGrid');
    const mesAnterior = document.getElementById('mesAnterior');
    const mesSiguiente = document.getElementById('mesSiguiente');

    // Modales
    const modalExito = document.getElementById('modalExito');
    const modalError = document.getElementById('modalError');
    const btnCerrarExito = document.getElementById('btnCerrarExito');
    const btnCerrarError = document.getElementById('btnCerrarError');

    const modalDetalleCita = document.getElementById('modalDetalleCita');
    const contenidoDetalleCita = document.getElementById('contenidoDetalleCita');
    const btnEliminarCita = document.getElementById('btnEliminarCita');
    const btnCerrarDetalle = document.getElementById('btnCerrarDetalle');

    // Selects de Fechas
    const selectMes = document.getElementById('mesReserva');
    const selectIngreso = document.getElementById('fechaIngreso');
    const selectSalida = document.getElementById('fechaSalida');

    // Estado del Calendario
    const meses = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    let fechaActual = new Date();
    let mesActualIndex = fechaActual.getMonth(); // 0 a 11
    let anioActual = fechaActual.getFullYear();
    let citasGuardadas = [];
    let citaSeleccionadaId = null;

    // -------------------------------------------------------------------
    // 2. CAMBIO DE VISTAS (Navegación)
    // -------------------------------------------------------------------
    function mostrarFormulario() {
        if (vistaCalendario) vistaCalendario.classList.remove('activa');
        if (vistaFormulario) vistaFormulario.classList.add('activa');
    }

    function mostrarCalendario() {
        if (vistaFormulario) vistaFormulario.classList.remove('activa');
        if (vistaCalendario) vistaCalendario.classList.add('activa');
        if (formReserva) formReserva.reset();
    }

    if (btnAgregar) btnAgregar.addEventListener('click', mostrarFormulario);
    if (btnCancelar) btnCancelar.addEventListener('click', mostrarCalendario);

    // -------------------------------------------------------------------
    // 3. POBLAR SELECTS DE FECHAS
    // -------------------------------------------------------------------
    function poblarSelectDias(numDias) {
        if (!selectIngreso || !selectSalida) return;
        
        selectIngreso.innerHTML = '<option value="">Selecciona</option>';
        selectSalida.innerHTML = '<option value="">Selecciona</option>';

        const mesTexto = selectMes ? selectMes.value : '';

        for (let i = 1; i <= numDias; i++) {
            const opt1 = document.createElement('option');
            opt1.value = i;
            opt1.textContent = `${i} de ${mesTexto}`;
            selectIngreso.appendChild(opt1);

            const opt2 = document.createElement('option');
            opt2.value = i;
            opt2.textContent = `${i} de ${mesTexto}`;
            selectSalida.appendChild(opt2);
        }
    }

    if (selectMes) {
        selectMes.addEventListener('change', () => {
            const index = meses.indexOf(selectMes.value);
            if (index !== -1) {
                const diasEnMes = new Date(anioActual, index + 1, 0).getDate();
                poblarSelectDias(diasEnMes);
            }
        });

        // Carga inicial de días
        const indexInicial = meses.indexOf(selectMes.value);
        const diasIniciales = new Date(anioActual, indexInicial !== -1 ? indexInicial + 1 : mesActualIndex + 1, 0).getDate();
        poblarSelectDias(diasIniciales);
    }

    // -------------------------------------------------------------------
    // 4. RENDERING DEL CALENDARIO Y CITA
    // -------------------------------------------------------------------
    async function cargarCitas() {
        try {
            const res = await fetch(`${URL_BASE}/citas`);
            if (res.ok) {
                const data = await res.json();
                citasGuardadas = Array.isArray(data) ? data : (data.citas || data.data || []);
            }
        } catch (err) {
            console.warn('Error al obtener reservaciones:', err);
            citasGuardadas = [];
        }
        renderizarCalendario();
    }

    function renderizarCalendario() {
        if (!diasGrid || !mesNombre) return;

        mesNombre.textContent = `${meses[mesActualIndex]} ${anioActual}`;
        diasGrid.innerHTML = '';

        const primerDiaMes = new Date(anioActual, mesActualIndex, 1);
        const ultimoDiaMes = new Date(anioActual, mesActualIndex + 1, 0);
        const totalDias = ultimoDiaMes.getDate();

        let diaInicio = primerDiaMes.getDay() - 1;
        if (diaInicio === -1) diaInicio = 6;

        for (let i = 0; i < diaInicio; i++) {
            const vacio = document.createElement('div');
            vacio.className = 'dia vacio';
            diasGrid.appendChild(vacio);
        }

        for (let dia = 1; dia <= totalDias; dia++) {
            const divDia = document.createElement('div');
            divDia.className = 'dia';
            
            const numSpan = document.createElement('span');
            numSpan.className = 'num-dia';
            numSpan.textContent = dia;
            divDia.appendChild(numSpan);

            const fechaEvaluar = new Date(anioActual, mesActualIndex, dia);
            fechaEvaluar.setHours(0, 0, 0, 0);

            const citasDelDia = citasGuardadas.filter(c => {
                const fIngresoStr = c.fecha_ingreso || c.fecha_inicio;
                const fSalidaStr = c.fecha_salida || c.fecha_fin;
                if (!fIngresoStr || !fSalidaStr) return false;

                const fIngreso = new Date(fIngresoStr + (fIngresoStr.includes('T') ? '' : 'T00:00:00'));
                const fSalida = new Date(fSalidaStr + (fSalidaStr.includes('T') ? '' : 'T00:00:00'));
                fIngreso.setHours(0, 0, 0, 0);
                fSalida.setHours(0, 0, 0, 0);

                return fechaEvaluar >= fIngreso && fechaEvaluar <= fSalida;
            });

            if (citasDelDia.length > 0) {
                divDia.classList.add('ocupado');
                citasDelDia.forEach(cita => {
                    const tagCita = document.createElement('div');
                    tagCita.className = 'evento-cita';
                    tagCita.textContent = cita.nombre_mascota || cita.mascota || 'Mascota';
                    tagCita.title = `Cliente: ${cita.nombre_cliente || cita.cliente || 'N/A'}`;
                    
                    tagCita.addEventListener('click', (e) => {
                        e.stopPropagation();
                        abrirDetalleCita(cita);
                    });
                    divDia.appendChild(tagCita);
                });
            }

            diasGrid.appendChild(divDia);
        }
    }

    if (mesAnterior) {
        mesAnterior.addEventListener('click', () => {
            mesActualIndex--;
            if (mesActualIndex < 0) {
                mesActualIndex = 11;
                anioActual--;
            }
            renderizarCalendario();
        });
    }

    if (mesSiguiente) {
        mesSiguiente.addEventListener('click', () => {
            mesActualIndex++;
            if (mesActualIndex > 11) {
                mesActualIndex = 0;
                anioActual++;
            }
            renderizarCalendario();
        });
    }

    // -------------------------------------------------------------------
    // 5. MODAL DETALLES Y ELIMINACIÓN
    // -------------------------------------------------------------------
    function abrirDetalleCita(cita) {
        citaSeleccionadaId = cita.id_cita || cita.id;
        if (!contenidoDetalleCita || !modalDetalleCita) return;

        contenidoDetalleCita.innerHTML = `
            <p><strong>Mascota:</strong> ${cita.nombre_mascota || cita.mascota || 'N/A'}</p>
            <p><strong>Raza:</strong> ${cita.raza || 'N/A'}</p>
            <p><strong>Edad:</strong> ${cita.edad || 'N/A'}</p>
            <p><strong>Cliente:</strong> ${cita.nombre_cliente || cita.cliente || 'N/A'}</p>
            <p><strong>Teléfono:</strong> ${cita.telefono || cita.telefono_cliente || 'N/A'}</p>
            <p><strong>Ingreso:</strong> ${cita.fecha_ingreso || cita.fecha_inicio || 'N/A'}</p>
            <p><strong>Salida:</strong> ${cita.fecha_salida || cita.fecha_fin || 'N/A'}</p>
        `;

        modalDetalleCita.classList.add('activo');
    }

    if (btnCerrarDetalle && modalDetalleCita) {
        btnCerrarDetalle.addEventListener('click', () => {
            modalDetalleCita.classList.remove('activo');
            citaSeleccionadaId = null;
        });
    }

    if (btnEliminarCita) {
        btnEliminarCita.addEventListener('click', async () => {
            if (!citaSeleccionadaId) return;

            if (confirm('¿Deseas eliminar esta reservación de forma permanente?')) {
                try {
                    const res = await fetch(`${URL_BASE}/citas/${citaSeleccionadaId}`, {
                        method: 'DELETE'
                    });

                    if (!res.ok) throw new Error('No se pudo eliminar la reservación.');

                    if (modalDetalleCita) modalDetalleCita.classList.remove('activo');
                    citaSeleccionadaId = null;
                    await cargarCitas();
                } catch (err) {
                    alert(`Error: ${err.message}`);
                }
            }
        });
    }

    // -------------------------------------------------------------------
    // 6. CREAR / GUARDAR RESERVACIÓN
    // -------------------------------------------------------------------
    if (formReserva) {
        formReserva.addEventListener('submit', async (e) => {
            e.preventDefault();

            const mesTexto = selectMes ? selectMes.value : '';
            const diaIngresoVal = parseInt(selectIngreso.value, 10);
            const diaSalidaVal = parseInt(selectSalida.value, 10);

            if (!diaIngresoVal || !diaSalidaVal) {
                alert('Por favor selecciona las fechas de ingreso y salida.');
                return;
            }

            if (diaSalidaVal < diaIngresoVal) {
                if (modalError) modalError.classList.add('activo');
                return;
            }

            const mIdx = meses.indexOf(mesTexto);
            const mm = String(mIdx !== -1 ? mIdx + 1 : mesActualIndex + 1).padStart(2, '0');
            const ddIngreso = String(diaIngresoVal).padStart(2, '0');
            const ddSalida = String(diaSalidaVal).padStart(2, '0');

            const fechaIngresoStr = `${anioActual}-${mm}-${ddIngreso}`;
            const fechaSalidaStr = `${anioActual}-${mm}-${ddSalida}`;

            const nombreCliente = document.getElementById('nombreCliente')?.value.trim() || "";
            const telefonoCliente = document.getElementById('telefonoCliente')?.value.trim() || "";
            const nombreMascota = document.getElementById('nombreMascota')?.value.trim() || "";
            const edadMascota = document.getElementById('edadMascota')?.value.trim() || "";
            const razaMascota = document.getElementById('razaMascota')?.value.trim() || "";

            // Payload completo que cubre todas las variaciones posibles esperadas por el Backend
            const payload = {
                nombre_cliente: nombreCliente,
                cliente: nombreCliente,
                telefono: telefonoCliente,
                telefono_cliente: telefonoCliente,
                nombre_mascota: nombreMascota,
                mascota: nombreMascota,
                edad: edadMascota,
                raza: razaMascota,
                fecha_ingreso: fechaIngresoStr,
                fecha_inicio: fechaIngresoStr,
                fecha_salida: fechaSalidaStr,
                fecha_fin: fechaSalidaStr,
                servicios: []
            };

            try {
                const res = await fetch(`${URL_BASE}/citas`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await res.json().catch(() => ({}));

                if (!res.ok) {
                    throw new Error(data.mensaje || data.error || 'Faltan datos obligatorios');
                }

                if (modalExito) modalExito.classList.add('activo');
            } catch (err) {
                console.error('Error enviando reservación:', err);
                alert(`Error al guardar: ${err.message}`);
            }
        });
    }

    if (btnCerrarExito) {
        btnCerrarExito.addEventListener('click', () => {
            if (modalExito) modalExito.classList.remove('activo');
            mostrarCalendario();
            cargarCitas();
        });
    }

    if (btnCerrarError) {
        btnCerrarError.addEventListener('click', () => {
            if (modalError) modalError.classList.remove('activo');
        });
    }

    cargarCitas();
});