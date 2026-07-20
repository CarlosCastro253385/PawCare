document.addEventListener('DOMContentLoaded', () => {

    const URL_BASE = 'http://107.22.53.32:8080/api';
    let editandoId = null;

    async function apiFetch(endpoint, opciones = {}) {
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
    }

    // Elementos del DOM
    const viewCatalog = document.getElementById('view-catalog');
    const viewForm = document.getElementById('view-form');
    const btnAddService = document.getElementById('btn-add-service');
    const btnCancel = document.getElementById('btn-cancel');
    const btnSave = document.getElementById('btn-save');
    const servicesContainer = document.getElementById('services-container');
    const serviceForm = document.getElementById('service-form');

    // Campos del Formulario
    const inputName = document.getElementById('service-name');
    const inputTitle = document.getElementById('service-title'); 
    const inputDesc = document.getElementById('service-desc');
    const inputPrice = document.getElementById('service-price');

    // Imagen
    const imageDropzone = document.getElementById('image-dropzone');
    const fileInput = document.getElementById('file-input');
    const formPreview = document.getElementById('form-preview');
    const uploadIcon = document.getElementById('upload-icon');
    let imagenBase64 = "img/default-service.png";

    const successModal = document.getElementById('success-modal');

    // Función para comprimir imágenes
    function comprimirImagen(file, maxWidth, maxHeight, calidad) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > maxWidth) {
                            height *= maxWidth / width;
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width *= maxHeight / height;
                            height = maxHeight;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    const dataUrl = canvas.toDataURL('image/jpeg', calidad);
                    resolve(dataUrl);
                };
                img.onerror = (err) => reject(err);
            };
            reader.onerror = (err) => reject(err);
        });
    }

    function mostrarFormulario() {
        viewCatalog.classList.add('hidden');
        viewForm.classList.remove('hidden');
    }

    function mostrarCatalogo() {
        viewForm.classList.add('hidden');
        viewCatalog.classList.remove('hidden');
        if (serviceForm) serviceForm.reset();
        if (formPreview) {
            formPreview.classList.add('hidden');
            uploadIcon.classList.remove('hidden');
        }
        imagenBase64 = "img/default-service.png";
        editandoId = null;
        btnSave.textContent = 'Aceptar';
    }

    if (btnAddService) btnAddService.addEventListener('click', mostrarFormulario);
    if (btnCancel) btnCancel.addEventListener('click', mostrarCatalogo);

    if (imageDropzone && fileInput) {
        imageDropzone.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    imagenBase64 = await comprimirImagen(file, 500, 500, 0.7);
                    if (formPreview && uploadIcon) {
                        formPreview.src = imagenBase64;
                        formPreview.classList.remove('hidden');
                        uploadIcon.classList.add('hidden');
                    }
                } catch (error) {
                    console.error("Error al procesar la imagen:", error);
                    alert("No se pudo procesar la imagen seleccionada.");
                }
            }
        });
    }

    // ---------- RENDERIZAR CATÁLOGO CORREGIDO CON TU CSS ----------
    async function cargarServicios() {
        if (!servicesContainer) return;

        try {
            const respuesta = await apiFetch('/servicios', { method: 'GET' });
            const servicios = respuesta.servicios || respuesta.data || respuesta;

            if (!Array.isArray(servicios) || servicios.length === 0) {
                servicesContainer.innerHTML = `<p style="text-align:center; padding:20px; color:#7b8a99;">No hay servicios registrados.</p>`;
                return;
            }

            servicesContainer.innerHTML = servicios.map(srv => {
                const pGrande = parseFloat(srv.precio_grande || srv.precioGrande || 0).toFixed(2);
                const pMediano = parseFloat(srv.precio_mediano || srv.precioMediano || 0).toFixed(2);
                const pChico = parseFloat(srv.precio_chico || srv.precioChico || 0).toFixed(2);
                const foto = srv.imagen || srv.foto || 'img/default-service.png';
                const desc = srv.descripcion || '';
                
                // Procesar títulos cortos / detalles divididos por barras '/'
                const detallesRaw = srv.titulo_corto || srv.tituloCorto || '';
                const listaDetallesHtml = detallesRaw 
                    ? detallesRaw.split('/').map(d => `<li>• ${d.trim()}</li>`).join('')
                    : `<li>• Sin detalles especificados</li>`;

                return `
                    <div class="service-card">
                        <img src="${foto}" alt="${srv.nombre}" onerror="this.src='img/default-service.png'">
                        
                        <div class="service-info">
                            <h3>${srv.nombre}</h3>
                            <p style="color: #607285; font-size: 14px; margin-bottom: 15px;">${desc}</p>
                            
                            <!-- Uso estricto de las clases de tu css/servicios.css -->
                            <div class="pricing-grid">
                                <div class="price-column">
                                    <h4>RAZA GRANDE</h4>
                                    <ul>
                                        ${listaDetallesHtml}
                                    </ul>
                                    <div class="price-value">$${pGrande}</div>
                                </div>
                                <div class="price-column">
                                    <h4>RAZA MEDIANA</h4>
                                    <ul>
                                        ${listaDetallesHtml}
                                    </ul>
                                    <div class="price-value">$${pMediano}</div>
                                </div>
                                <div class="price-column">
                                    <h4>RAZA PEQUEÑA</h4>
                                    <ul>
                                        ${listaDetallesHtml}
                                    </ul>
                                    <div class="price-value">$${pChico}</div>
                                </div>
                            </div>
                        </div>

                        <!-- Menú de opciones (Tres puntos) -->
                        <div class="options-menu-container" style="position: absolute; top: 20px; right: 20px; z-index: 50;">
                            <button class="btn-menu-trigger" style="background: none; border: none; font-size: 18px; color: #94a3b8; cursor: pointer; padding: 5px;"><i class="fa-solid fa-ellipsis-vertical"></i></button>
                            <div class="menu-dropdown hidden" style="position: absolute; right: 0; top: 30px; background: white; border: 1px solid #e1e8ed; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 100; display: flex; flex-direction: column; min-width: 110px;">
                                <button class="btn-edit" data-id="${srv.id_servicio}" style="background: none; border: none; padding: 10px 15px; text-align: left; cursor: pointer; font-size: 13px; color: #2F4257; display: flex; gap: 8px; align-items: center;"><i class="fa-solid fa-pen" style="color:#52a3ff;"></i> Editar</button>
                                <button class="btn-delete" data-id="${srv.id_servicio}" style="background: none; border: none; padding: 10px 15px; text-align: left; cursor: pointer; font-size: 13px; color: #e71d36; display: flex; gap: 8px; align-items: center; border-top: 1px solid #f0f4f8;"><i class="fa-solid fa-trash"></i> Eliminar</button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            configurarEventosOpciones(servicios);

        } catch (err) {
            console.error(err);
            servicesContainer.innerHTML = `<p style="color:red; text-align:center;">Error al comunicar con la base de datos.</p>`;
        }
    }

    // ---------- ACCIONES: EDITAR Y ELIMINAR ----------
    function configurarEventosOpciones(servicios) {
        document.querySelectorAll('.btn-menu-trigger').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelectorAll('.menu-dropdown').forEach(m => m.classList.add('hidden'));
                const dropdown = btn.parentElement.querySelector('.menu-dropdown');
                dropdown.classList.remove('hidden');
            });
        });

        document.addEventListener('click', () => {
            document.querySelectorAll('.menu-dropdown').forEach(m => m.classList.add('hidden'));
        });

        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const servicio = servicios.find(s => String(s.id_servicio) === String(id));
                if (!servicio) return;

                editandoId = id;
                inputName.value = servicio.nombre || '';
                inputTitle.value = servicio.titulo_corto || servicio.tituloCorto || '';
                inputDesc.value = servicio.descripcion || '';
                
                const pGrande = servicio.precio_grande || servicio.precioGrande || 0;
                const pMediano = servicio.precio_mediano || servicio.precioMediano || 0;
                const pChico = servicio.precio_chico || servicio.precioChico || 0;
                inputPrice.value = `$${pGrande} / $${pMediano} / $${pChico}`;

                if (servicio.imagen || servicio.foto) {
                    imagenBase64 = servicio.imagen || servicio.foto;
                    formPreview.src = imagenBase64;
                    formPreview.classList.remove('hidden');
                    uploadIcon.classList.add('hidden');
                }

                btnSave.textContent = 'Guardar Cambios';
                mostrarFormulario();
            });
        });

        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.id;
                if (confirm('¿Estás seguro de que deseas eliminar este servicio?')) {
                    try {
                        await apiFetch(`/servicios/${id}`, { method: 'DELETE' });
                        cargarServicios();
                    } catch (err) {
                        alert('No se pudo eliminar el servicio: ' + err.message + '\n\nNota: Si el código es 409, significa que este servicio está asignado a citas vigentes en la pestaña "Reservas" y no puede borrarse.');
                    }
                }
            });
        });
    }

    // ---------- GUARDAR CAMBIOS O CREAR NUEVO ----------
    if (btnSave) {
        btnSave.addEventListener('click', async () => {
            if (!serviceForm.checkValidity()) {
                serviceForm.reportValidity();
                return;
            }

            const textoPrecios = inputPrice.value.replace(/[^0-9\/.]/g, '');
            const partes = textoPrecios.split('/');
            const precioGrande = parseFloat(partes[0]) || 0;
            const precioMediano = parseFloat(partes[1]) || precioGrande;
            const precioChico = parseFloat(partes[2]) || precioMediano;

            const detallesTexto = inputTitle.value.trim();

            const datosServicio = {
                id_servicio: editandoId ? parseInt(editandoId) : null,
                idServicio: editandoId ? parseInt(editandoId) : null,
                nombre: inputName.value.trim(),
                titulo_corto: detallesTexto,
                tituloCorto: detallesTexto,
                descripcion: inputDesc.value.trim(),
                precio_grande: precioGrande,
                precioGrande: precioGrande,
                precio_mediano: precioMediano,
                precioMediano: precioMediano,
                precio_chico: precioChico,
                precioChico: precioChico,
                imagen: imagenBase64,
                foto: imagenBase64
            };

            btnSave.disabled = true;
            btnSave.textContent = 'Procesando...';

            try {
                if (editandoId) {
                    await apiFetch(`/servicios/${editandoId}`, {
                        method: 'PUT',
                        body: JSON.stringify(datosServicio)
                    });
                } else {
                    await apiFetch('/servicios', {
                        method: 'POST',
                        body: JSON.stringify(datosServicio)
                    });
                }

                if (successModal) {
                    successModal.classList.remove('hidden');
                    setTimeout(() => {
                        successModal.classList.add('hidden');
                        mostrarCatalogo();
                        cargarServicios();
                    }, 1800);
                } else {
                    mostrarCatalogo();
                    cargarServicios();
                }

            } catch (err) {
                alert(err.message || 'Error al guardar los datos.');
            } finally {
                btnSave.disabled = false;
            }
        });
    }

    cargarServicios();
});