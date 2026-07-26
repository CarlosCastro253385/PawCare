document.addEventListener('DOMContentLoaded', () => {
    const URL_BASE = window.URL_BASE || '/api';

    const modalServicio = document.getElementById('modalServicio');
    const btnAgregarServicio = document.getElementById('btnAgregarServicio') || document.getElementById('btn-agregar-servicio');
    const btnCerrarModal = document.getElementById('btnCerrarModal');
    const formServicio = document.getElementById('formServicio');
    const modalTitulo = modalServicio ? document.getElementById('modalTitulo') || modalServicio.querySelector('h3') : null;
    const servicesContainer = document.getElementById('services-container');

    let servicioEditandoId = null;
    let fotoActualServicio = null; // Guarda la foto previa al editar
    let servicesData = [];

    // Abrir Modal Crear
    if (btnAgregarServicio && modalServicio) {
        btnAgregarServicio.addEventListener('click', () => {
            servicioEditandoId = null;
            fotoActualServicio = null;
            if (modalTitulo) modalTitulo.textContent = 'Nuevo Servicio';
            if (formServicio) formServicio.reset();
            modalServicio.style.display = 'flex';
        });
    }

    // Cerrar Modal
    if (btnCerrarModal && modalServicio) {
        btnCerrarModal.addEventListener('click', () => {
            modalServicio.style.display = 'none';
        });
    }

    // OBTENER SERVICIOS
    async function fetchServices() {
        if (!servicesContainer) return;
        try {
            const respuesta = await fetch(`${URL_BASE}/servicios`);
            if (!respuesta.ok) throw new Error(`Error ${respuesta.status}`);
            
            const data = await respuesta.json();
            servicesData = data.servicios || data.data || data;
        } catch (err) {
            console.warn('No se obtuvieron servicios:', err.message);
            servicesData = [];
        }
        renderUserCatalog();
    }

    // RENDERIZAR EN CATÁLOGO
    function renderUserCatalog() {
        if (!servicesContainer) return;
        servicesContainer.innerHTML = "";

        if (!Array.isArray(servicesData) || servicesData.length === 0) {
            servicesContainer.innerHTML = `<p style="color: #666; font-size: 16px; text-align: center; padding: 20px; grid-column: 1/-1;">No hay servicios en el catálogo.</p>`;
            return;
        }

        servicesData.forEach(srv => {
            const idServ = srv.id_servicio || srv.id;
            const pGrande = parseFloat(srv.precio_grande || 0).toFixed(2);
            const pMediano = parseFloat(srv.precio_mediano || 0).toFixed(2);
            const pChico = parseFloat(srv.precio_pequeno || 0).toFixed(2);
            const foto = srv.foto || 'img/default-service.png';
            const desc = srv.descripcion || '';
            const tituloVal = srv.titulo || srv.nombre || '';

            const lineas = typeof tituloVal === 'string' 
                ? tituloVal.split('\n').map(d => d.trim()).filter(d => d.length > 0)
                : [];
            
            const listaDetallesHtml = lineas.length > 0
                ? lineas.map(linea => `<li>• ${linea}</li>`).join('')
                : `<li>• ${tituloVal}</li>`;

            const card = document.createElement('div');
            card.className = 'service-card';
            card.innerHTML = `
                <img src="${foto}" alt="${srv.nombre}" onerror="this.src='img/default-service.png'">
                <div class="service-info" style="flex-grow: 1;">
                    <h3>${srv.nombre}</h3>
                    <p style="color: #607285; font-size: 14px; margin-bottom: 15px;">${desc}</p>
                    
                    <div class="pricing-grid">
                        <div class="price-column">
                            <h4>RAZA GRANDE</h4>
                            <ul>${listaDetallesHtml}</ul>
                            <div class="price-value">$${pGrande}</div>
                        </div>
                        <div class="price-column">
                            <h4>RAZA MEDIANA</h4>
                            <ul>${listaDetallesHtml}</ul>
                            <div class="price-value">$${pMediano}</div>
                        </div>
                        <div class="price-column">
                            <h4>RAZA PEQUEÑA</h4>
                            <ul>${listaDetallesHtml}</ul>
                            <div class="price-value">$${pChico}</div>
                        </div>
                    </div>
                </div>

                <div class="options-container">
                    <i class="fa-solid fa-ellipsis-vertical card-options" onclick="toggleOptionsMenu(event, ${idServ})"></i>
                    <div class="options-dropdown" id="dropdown-${idServ}">
                        <div class="dropdown-item edit-opt" onclick="abrirEditarServicio(${idServ})">
                            <i class="fa-solid fa-pen-to-square"></i> Editar
                        </div>
                        <div class="dropdown-item delete-opt" onclick="eliminarServicio(${idServ})">
                            <i class="fa-solid fa-trash"></i> Eliminar
                        </div>
                    </div>
                </div>
            `;
            servicesContainer.appendChild(card);
        });
    }

    // COMPRIMIR IMAGEN A MENOS DE 100KB ANTES DE ENVIAR
    function compressAndConvertImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 600;
                    const scaleFactor = MAX_WIDTH / img.width;
                    
                    if (img.width > MAX_WIDTH) {
                        canvas.width = MAX_WIDTH;
                        canvas.height = img.height * scaleFactor;
                    } else {
                        canvas.width = img.width;
                        canvas.height = img.height;
                    }

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    resolve(canvas.toDataURL('image/jpeg', 0.7));
                };
                img.onerror = error => reject(error);
            };
            reader.onerror = error => reject(error);
        });
    }

    // SUBMIT DEL FORMULARIO (CREAR O ACTUALIZAR)
    if (formServicio) {
        formServicio.addEventListener('submit', async (e) => {
            e.preventDefault();

            const inputNombre = document.getElementById('nombreServicio');
            const inputDesc = document.getElementById('descServicio');
            const inputDetalles = document.getElementById('detallesServicio');
            const inputPGrande = document.getElementById('precioGrande');
            const inputPMediano = document.getElementById('precioMediano');
            const inputPChico = document.getElementById('precioChico');
            const fileInput = document.getElementById('imagenServicio');

            // Determinar imagen: Si selecciona archivo nuevo se comprime, si no, se deja la que tenía o la default
            let fotoFinal = fotoActualServicio || 'img/default-service.png';
            
            if (fileInput && fileInput.files && fileInput.files[0]) {
                try {
                    fotoFinal = await compressAndConvertImage(fileInput.files[0]);
                } catch (e) {
                    console.error("Error al procesar la imagen:", e);
                }
            }

            const payload = {
                nombre: inputNombre ? inputNombre.value.trim() : 'Servicio sin nombre',
                titulo: inputDetalles ? inputDetalles.value.trim() : 'Sin detalles',
                descripcion: inputDesc ? inputDesc.value.trim() : '',
                foto: fotoFinal,
                precio_grande: parseFloat(inputPGrande?.value) || 0,
                precio_mediano: parseFloat(inputPMediano?.value) || 0,
                precio_pequeno: parseFloat(inputPChico?.value) || 0
            };

            const urlCompleta = `${URL_BASE}${servicioEditandoId ? `/servicios/${servicioEditandoId}` : '/servicios'}`;
            const metodo = servicioEditandoId ? 'PUT' : 'POST';

            try {
                const respuesta = await fetch(urlCompleta, {
                    method: metodo,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await respuesta.json();

                if (!respuesta.ok || !data.ok) {
                    throw new Error(data.mensaje || `Error ${respuesta.status}`);
                }

                alert(servicioEditandoId ? '¡Servicio actualizado!' : '¡Servicio guardado con éxito!');
                if (modalServicio) modalServicio.style.display = 'none';
                formServicio.reset();
                servicioEditandoId = null;
                fotoActualServicio = null;
                fetchServices();

            } catch (err) {
                alert(`Error al guardar servicio: ${err.message}`);
            }
        });
    }

    // ABRIR MODAL PARA EDITAR (Población de datos)
    window.abrirEditarServicio = function(id) {
        const servicio = servicesData.find(s => (s.id_servicio || s.id) == id);
        if (!servicio) return;

        servicioEditandoId = id;
        fotoActualServicio = servicio.foto || null; // Guardar la foto previa

        if (modalTitulo) modalTitulo.textContent = 'Editar Servicio';

        // Llenar inputs con la información actual
        document.getElementById('nombreServicio').value = servicio.nombre || '';
        document.getElementById('detallesServicio').value = servicio.titulo || '';
        document.getElementById('descServicio').value = servicio.descripcion || '';
        document.getElementById('precioGrande').value = servicio.precio_grande || 0;
        document.getElementById('precioMediano').value = servicio.precio_mediano || 0;
        document.getElementById('precioChico').value = servicio.precio_pequeno || 0;
        
        // Limpiar el selector de archivo por si había algo elegido previamente
        const fileInput = document.getElementById('imagenServicio');
        if (fileInput) fileInput.value = '';

        if (modalServicio) modalServicio.style.display = 'flex';
    };

    // MENÚ FLOTANTE Y ELIMINAR
    window.toggleOptionsMenu = function(e, id) {
        e.stopPropagation();
        document.querySelectorAll('.options-dropdown').forEach(d => {
            if (d.id !== `dropdown-${id}`) d.classList.remove('show');
        });
        const drop = document.getElementById(`dropdown-${id}`);
        if (drop) drop.classList.toggle('show');
    };

    document.addEventListener('click', () => {
        document.querySelectorAll('.options-dropdown').forEach(d => d.classList.remove('show'));
    });

    window.eliminarServicio = async function(id) {
        if (!confirm('¿Seguro que deseas eliminar este servicio?')) return;
        try {
            const res = await fetch(`${URL_BASE}/servicios/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok || !data.ok) throw new Error(data.mensaje);
            alert('Servicio eliminado');
            fetchServices();
        } catch (e) {
            alert(`Error: ${e.message}`);
        }
    };

    fetchServices();
});