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

    // Calendario
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

    // Selects de fechas
    const selectMes = document.getElementById('mesReserva');
    const selectIngreso = document.getElementById('fechaIngreso');
    const selectSalida = document.getElementById('fechaSalida');

    // Estado local
    const meses = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    let fechaActual = new Date();
    let mesActualIndex = fechaActual.getMonth();
    let anioActual = fechaActual.getFullYear();
    let citasGuardadas = [];
    let citaSeleccionadaId = null;

    // -------------------------------------------------------------------
    // 2. CONTROL DE VISTAS
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
    // 3. POBLAR SELECTS DE DÍAS
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

        const indexInicial = meses.indexOf(selectMes.value);
        const diasIniciales = new Date(anioActual, indexInicial !== -1 ? indexInicial + 1 : mesActualIndex + 1, 0).getDate();
        poblarSelectDias(diasIniciales);
    }

    // -------------------------------------------------------------------
    // 4. RENDERIZAR CALENDARIO
    // -------------------------------------------------------------------
    async function cargarCitas() {
        try {
            const res = await fetch(`${URL_BASE}/citas?mes=${mesActualIndex + 1}&anio=${anioActual}`);
            if (res.ok) {
                const data = await res.json();
                citasGuardadas = data.citas || [];
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

        // Días vacíos
        for (let i = 0; i < diaInicio; i++) {
            const vacio = document.createElement('div');
            vacio.className = 'dia dia--vacio';
            diasGrid.appendChild(vacio);
        }

        // Días del mes con etiqueta segura
        for (let dia = 1; dia <= totalDias; dia++) {
            const divDia = document.createElement('div');
            divDia.className = 'dia';

            const spanNumero = document.createElement('span');
            spanNumero.className = 'dia-numero';
            spanNumero.textContent = dia;
            divDia.appendChild(spanNumero);

            const fechaEvaluar = new Date(anioActual, mesActualIndex, dia);
            fechaEvaluar.setHours(0, 0, 0, 0);

            const citasDelDia = [];
            const idsVistas = new Set();

            citasGuardadas.forEach(c => {
                if (!c.fecha_entrada || !c.fecha_salida) return;

                const fEntrada = new Date(c.fecha_entrada + (c.fecha_entrada.includes('T') ? '' : 'T00:00:00'));
                const fSalida = new Date(c.fecha_salida + (c.fecha_salida.includes('T') ? '' : 'T00:00:00'));
                fEntrada.setHours(0, 0, 0, 0);
                fSalida.setHours(0, 0, 0, 0);

                if (fechaEvaluar >= fEntrada && fechaEvaluar <= fSalida) {
                    if (!idsVistas.has(c.id_cita)) {
                        idsVistas.add(c.id_cita);
                        citasDelDia.push(c);
                    }
                }
            });

            if (citasDelDia.length > 0) {
                divDia.classList.add('dia--ocupado');
                const primeraCita = citasDelDia[0];
                
                const eventoDiv = document.createElement('div');
                eventoDiv.className = 'cita-evento';
                eventoDiv.textContent = primeraCita.nombre_mascota || 'Reservación';
                divDia.appendChild(eventoDiv);

                divDia.title = `Mascota: ${primeraCita.nombre_mascota || 'Reservación'}`;
                
                divDia.onclick = () => {
                    abrirDetalleCita(primeraCita);
                };
            }

            diasGrid.appendChild(divDia);
        }
    }

    if (mesAnterior) {
        mesAnterior.addEventListener('click', () => {
            mesActualIndex--;
            if (mesActualIndex < 0) { mesActualIndex = 11; anioActual--; }
            cargarCitas();
        });
    }

    if (mesSiguiente) {
        mesSiguiente.addEventListener('click', () => {
            mesActualIndex++;
            if (mesActualIndex > 11) { mesActualIndex = 0; anioActual++; }
            cargarCitas();
        });
    }

    // -------------------------------------------------------------------
    // 5. MANEJO DE MODALES Y ELIMINACIÓN
    // -------------------------------------------------------------------
    function abrirDetalleCita(cita) {
        citaSeleccionadaId = cita.id_cita;
        if (!contenidoDetalleCita || !modalDetalleCita) return;

        contenidoDetalleCita.innerHTML = `
            <p style="margin-bottom: 8px;"><strong>Mascota:</strong> ${cita.nombre_mascota || 'N/A'}</p>
            <p style="margin-bottom: 8px;"><strong>Cliente:</strong> ${cita.nombre_cliente || 'N/A'}</p>
            <p style="margin-bottom: 8px;"><strong>Teléfono:</strong> ${cita.telefono_cliente || 'N/A'}</p>
            <p style="margin-bottom: 8px;"><strong>Ingreso:</strong> ${cita.fecha_entrada || 'N/A'}</p>
            <p style="margin-bottom: 8px;"><strong>Salida:</strong> ${cita.fecha_salida || 'N/A'}</p>
        `;

        modalDetalleCita.classList.add('mostrar');
    }

    async function ejecutarEliminacion(idCita) {
        if (!idCita) return;

        if (confirm('¿Deseas eliminar esta reservación?')) {
            try {
                const res = await fetch(`${URL_BASE}/citas/${idCita}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' }
                });

                if (res.ok) {
                    if (modalDetalleCita) modalDetalleCita.classList.remove('mostrar');
                    citaSeleccionadaId = null;
                    await cargarCitas();
                } else {
                    alert('Error al eliminar la reservación en el servidor.');
                }
            } catch (err) {
                console.error('Error de red al eliminar:', err);
            }
        }
    }

    if (btnCerrarDetalle && modalDetalleCita) {
        btnCerrarDetalle.addEventListener('click', () => {
            modalDetalleCita.classList.remove('mostrar');
            citaSeleccionadaId = null;
        });
    }

    if (btnEliminarCita) {
        btnEliminarCita.addEventListener('click', () => {
            if (citaSeleccionadaId) {
                ejecutarEliminacion(citaSeleccionadaId);
            }
        });
    }

    // -------------------------------------------------------------------
    // 6. GUARDAR RESERVACIÓN (Lógica unificada y directa)
    // -------------------------------------------------------------------
    async function procesarGuardado(e) {
        if (e) e.preventDefault();

        const mesTexto = selectMes ? selectMes.value : '';
        const diaIngresoVal = parseInt(selectIngreso?.value, 10);
        const diaSalidaVal = parseInt(selectSalida?.value, 10);

        if (isNaN(diaIngresoVal) || isNaN(diaSalidaVal)) {
            alert('Por favor selecciona las fechas de ingreso y salida.');
            return;
        }

        if (diaSalidaVal < diaIngresoVal) {
            if (modalError) modalError.classList.add('mostrar');
            return;
        }

        const mIdx = meses.indexOf(mesTexto);
        const mm = String(mIdx !== -1 ? mIdx + 1 : mesActualIndex + 1).padStart(2, '0');
        const ddIngreso = String(diaIngresoVal).padStart(2, '0');
        const ddSalida = String(diaSalidaVal).padStart(2, '0');

        const payload = {
            fechaEntrada: `${anioActual}-${mm}-${ddIngreso}`,
            fechaSalida: `${anioActual}-${mm}-${ddSalida}`,
            nombreCliente: document.getElementById('nombreCliente')?.value.trim() || "",
            telefonoCliente: document.getElementById('telefonoCliente')?.value.trim() || "",
            nombreMascota: document.getElementById('nombreMascota')?.value.trim() || "",
            edadMascota: document.getElementById('edadMascota')?.value.trim() || "",
            razaMascota: document.getElementById('razaMascota')?.value.trim() || "",
            servicios: []
        };

        try {
            const res = await fetch(`${URL_BASE}/citas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                if (modalExito) modalExito.classList.add('mostrar');
            } else {
                const data = await res.json().catch(() => ({}));
                alert(`Error al guardar: ${data.mensaje || 'Respuesta no válida del servidor.'}`);
            }
        } catch (err) {
            console.error('Error enviando formulario:', err);
            alert('Error de conexión con el servidor.');
        }
    }

    // Vincular al formulario si existe
    if (formReserva) {
        formReserva.addEventListener('submit', procesarGuardado);
    }

    // Capturar directamente el botón de "Guardar reservación" por clase para garantizar el funcionamiento
    const botonesPrimarios = document.querySelectorAll('.btn-primario');
    botonesPrimarios.forEach(btn => {
        if (btn.textContent.toLowerCase().includes('guardar')) {
            btn.addEventListener('click', (e) => {
                procesarGuardado(e);
            });
        }
    });

    if (btnCerrarExito) {
        btnCerrarExito.addEventListener('click', () => {
            if (modalExito) modalExito.classList.remove('mostrar');
            mostrarCalendario();
            cargarCitas();
        });
    }

    if (btnCerrarError) {
        btnCerrarError.addEventListener('click', () => {
            if (modalError) modalError.classList.remove('mostrar');
        });
    }

    cargarCitas();
});