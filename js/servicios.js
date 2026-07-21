document.addEventListener('DOMContentLoaded', () => {
    const URL_BASE = window.URL_BASE || '/api';

    // -------------------------------------------------------------------
    // 1. ELEMENTOS DEL DOM
    // -------------------------------------------------------------------
    // Vistas y Botones de Navegación
    const viewCatalog = document.getElementById('view-catalog');
    const viewForm = document.getElementById('view-form');
    const btnAddService = document.getElementById('btn-add-service');
    const btnCancel = document.getElementById('btn-cancel');

    // Elementos del Formulario
    const serviceForm = document.getElementById('service-form');
    const btnSave = document.getElementById('btn-save');
    const inputName = document.getElementById('service-name');
    const inputTitle = document.getElementById('service-title');
    const inputDesc = document.getElementById('service-desc');
    const inputPrice = document.getElementById('service-price');
    const inputFileInput = document.getElementById('file-input');
    const dropzone = document.getElementById('image-dropzone');
    const formPreview = document.getElementById('form-preview');
    const uploadIcon = document.getElementById('upload-icon');
    
    const servicesContainer = document.getElementById('services-container');
    const successModal = document.getElementById('success-modal');

    // -------------------------------------------------------------------
    // 2. CAMBIO DE VISTAS (Abrir / Cancelar Formulario)
    // -------------------------------------------------------------------
    function mostrarFormulario() {
        if (viewCatalog) viewCatalog.classList.add('hidden');
        if (viewForm) viewForm.classList.remove('hidden');
    }

    function mostrarCatalogo() {
        if (viewForm) viewForm.classList.add('hidden');
        if (viewCatalog) viewCatalog.classList.remove('hidden');
        if (serviceForm) serviceForm.reset();
        if (formPreview) {
            formPreview.src = "";
            formPreview.classList.add('hidden');
        }
        if (uploadIcon) uploadIcon.classList.remove('hidden');
    }

    if (btnAddService) btnAddService.addEventListener('click', mostrarFormulario);
    if (btnCancel) btnCancel.addEventListener('click', mostrarCatalogo);

    // Subida e interacción con la foto
    if (dropzone && inputFileInput) {
        dropzone.addEventListener('click', () => inputFileInput.click());
        
        inputFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && formPreview) {
                formPreview.src = URL.createObjectURL(file);
                formPreview.classList.remove('hidden');
                if (uploadIcon) uploadIcon.classList.add('hidden');
            }
        });
    }

    // Convertir imagen a Base64 para el backend
    function imagenABase64(file) {
        return new Promise((resolve, reject) => {
            if (!file) return resolve(null);
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
            reader.readAsDataURL(file);
        });
    }

    // -------------------------------------------------------------------
    // 3. RENDERIZAR CATÁLOGO DE SERVICIOS
    // -------------------------------------------------------------------
    async function fetchServices() {
        if (!servicesContainer) return;

        try {
            const res = await fetch(`${URL_BASE}/servicios`);
            const data = await res.json();
            const lista = data.servicios || data.data || data || [];

            servicesContainer.innerHTML = "";

            if (!Array.isArray(lista) || lista.length === 0) {
                servicesContainer.innerHTML = `<p style="color: #666; font-size: 16px; text-align: center; padding: 20px;">No hay servicios disponibles en este momento.</p>`;
                return;
            }

            lista.forEach(srv => {
                const pGrande = parseFloat(srv.precio_grande || 0).toFixed(2);
                const pMediano = parseFloat(srv.precio_mediano || 0).toFixed(2);
                const pChico = parseFloat(srv.precio_pequeno || 0).toFixed(2);
                const foto = srv.foto || 'img/default-service.png';
                const desc = srv.descripcion || '';

                const detallesRaw = srv.titulo || '';
                const lineas = typeof detallesRaw === 'string' 
                    ? detallesRaw.split('\n').map(d => d.trim()).filter(d => d.length > 0)
                    : [];

                const listaDetallesHtml = lineas.length > 0
                    ? lineas.map(linea => `<li>• ${linea}</li>`).join('')
                    : `<li>• Sin detalles especificados</li>`;

                const card = document.createElement('div');
                card.className = 'service-card';
                card.innerHTML = `
                    <img src="${foto}" alt="${srv.nombre}" onerror="this.src='img/default-service.png'">
                    <div class="service-info">
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
                `;
                servicesContainer.appendChild(card);
            });
        } catch (err) {
            console.warn('Error al cargar servicios:', err);
        }
    }

    // -------------------------------------------------------------------
    // 4. GUARDAR SERVICIO (POST /api/servicios)
    // -------------------------------------------------------------------
    async function guardarServicio(e) {
        if (e) e.preventDefault();

        const nombre = inputName ? inputName.value.trim() : "";
        const titulo = inputTitle ? inputTitle.value.trim() : "";
        const descripcion = inputDesc ? inputDesc.value.trim() : "";
        const precioRaw = inputPrice ? inputPrice.value.trim() : "";
        const archivoImagen = (inputFileInput && inputFileInput.files) ? inputFileInput.files[0] : null;

        if (!nombre || !titulo) {
            alert('Por favor, ingresa Nombre y Detalles.');
            return;
        }

        const numeros = precioRaw.match(/\d+/g) || [0];
        const pGrande = parseFloat(numeros[0] || 0);
        const pMediano = parseFloat(numeros[1] || numeros[0] || 0);
        const pPequeno = parseFloat(numeros[2] || numeros[0] || 0);

        try {
            if (btnSave) {
                btnSave.disabled = true;
                btnSave.innerText = "Procesando...";
            }

            const fotoBase64 = await imagenABase64(archivoImagen);

            const payload = {
                nombre: nombre,
                titulo: titulo,
                descripcion: descripcion,
                foto: fotoBase64,
                precio_grande: pGrande,
                precio_mediano: pMediano,
                precio_pequeno: pPequeno
            };

            const res = await fetch(`${URL_BASE}/servicios`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.mensaje || `Error ${res.status}`);
            }

            if (successModal) {
                successModal.classList.remove('hidden');
                setTimeout(() => {
                    location.reload();
                }, 1500);
            } else {
                alert('¡Servicio guardado con éxito!');
                location.reload();
            }

        } catch (err) {
            console.error('Error al guardar:', err);
            alert(`Error: ${err.message}`);
        } finally {
            if (btnSave) {
                btnSave.disabled = false;
                btnSave.innerText = "Aceptar";
            }
        }
    }

    if (btnSave) btnSave.addEventListener('click', guardarServicio);

    // Inicializar catálogo
    fetchServices();
});