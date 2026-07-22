document.addEventListener('DOMContentLoaded', () => {
    // -------------------------------------------------------------------
    // 1. PETICIÓN GENERAL (Maneja JSON y FormData de forma automática)
    // -------------------------------------------------------------------
    async function apiFetch(endpoint, opciones = {}) {
        const urlCompleta = `${URL_BASE}${endpoint}`;
        
        // SOLO si NO es un FormData le agregamos Content-Type: application/json
        if (!(opciones.body instanceof FormData)) {
            opciones.headers = {
                'Content-Type': 'application/json',
                ...opciones.headers
            };
        }
              
        const respuesta = await fetch(urlCompleta, opciones);
        
        if (!respuesta.ok) {
            const errorData = await respuesta.json().catch(() => ({}));
            const mensaje = errorData.message || errorData.error || `Error en el servidor: ${respuesta.status}`;
            throw new Error(mensaje);
        }
        
        return await respuesta.json();
    }

    // -------------------------------------------------------------------
    // 2. OBTENER Y RENDERIZAR SERVICIOS (Vista Usuario / Catálogo)
    // -------------------------------------------------------------------
    const servicesContainer = document.getElementById('services-container');
    let servicesData = [];

    async function fetchServices() {
        if (!servicesContainer) return;
        
        try {
            const respuesta = await apiFetch('/servicios', { method: 'GET' });
            servicesData = respuesta.servicios || respuesta.data || respuesta;
        } catch (err) {
            console.warn('No se pudo conectar con la API de servicios:', err.message);
            servicesData = [];
        }
        renderUserCatalog();
    }

    function renderUserCatalog() {
        if (!servicesContainer) return;
        servicesContainer.innerHTML = "";

        if (!Array.isArray(servicesData) || servicesData.length === 0) {
            servicesContainer.innerHTML = `<p style="color: #666; font-size: 16px; text-align: center; padding: 20px;">No hay servicios disponibles en este momento.</p>`;
            return;
        }

        servicesData.forEach(srv => {
            const pGrande = parseFloat(srv.precio_grande || srv.precioGrande || srv.precio || 0).toFixed(2);
            const pMediano = parseFloat(srv.precio_mediano || srv.precioMediano || srv.precio || 0).toFixed(2);
            const pChico = parseFloat(srv.precio_chico || srv.precioChico || srv.precioPequeño || srv.precio_pequeno || srv.precio || 0).toFixed(2);
            const foto = srv.imagen || srv.foto || 'img/default-service.png';
            const desc = srv.descripcion || '';

            const detallesRaw = srv.titulo_corto || srv.tituloCorto || srv.detalles || '';
            const lineas = typeof detallesRaw === 'string' 
                ? detallesRaw.split('\n').map(d => d.trim()).filter(d => d.length > 0)
                : (Array.isArray(detallesRaw) ? detallesRaw : []);
            
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
    }

    // -------------------------------------------------------------------
    // 3. GUARDAR / EDITAR SERVICIO (Vista Administración)
    // -------------------------------------------------------------------
    async function guardarServicio(e) {
        if (e) e.preventDefault();

        // Obtener los inputs/textareas presentes en el formulario
        const inputs = document.querySelectorAll('input, textarea');
        let nombre = "", detalles = "", descripcion = "", precioRaw = "";
        let archivoImagen = null;

        inputs.forEach(input => {
            const ph = (input.placeholder || "").toLowerCase();
            const type = input.type;

            if (type === 'file') {
                if (input.files && input.files[0]) archivoImagen = input.files[0];
            } else if (ph.includes('nombre')) {
                nombre = input.value.trim();
            } else if (ph.includes('detalle')) {
                detalles = input.value.trim();
            } else if (ph.includes('descripción') || ph.includes('descripcion')) {
                descripcion = input.value.trim();
            } else if (ph.includes('precio')) {
                precioRaw = input.value.trim();
            }
        });

        // Extraer números para los precios
        const numeros = precioRaw.match(/\d+/g) || [250];
        const pGrande = parseFloat(numeros[0] || 250);
        const pMediano = parseFloat(numeros[1] || numeros[0] || 200);
        const pChico = parseFloat(numeros[2] || numeros[0] || 150);

        // Crear FormData
        const formData = new FormData();
        formData.append('nombre', nombre);
        formData.append('descripcion', descripcion);
        formData.append('titulo_corto', detalles);
        formData.append('detalles', detalles); // Enviamos ambos por compatibilidad
        formData.append('precio_grande', pGrande);
        formData.append('precio_mediano', pMediano);
        formData.append('precio_chico', pChico);
        formData.append('precio', pGrande);

        if (archivoImagen) {
            formData.append('imagen', archivoImagen);
        }

        try {
            // Usamos apiFetch para manejar respuestas de error de forma clara
            const data = await apiFetch('/servicios', {
                method: 'POST',
                body: formData
            });

            alert('¡Servicio guardado con éxito!');
            location.reload();

        } catch (err) {
            console.error('Error detallado:', err);
            alert(`Error al guardar: ${err.message}`);
        }
    }

    // -------------------------------------------------------------------
    // 4. EVENTOS Y EJECUCIÓN INICIAL
    // -------------------------------------------------------------------
    
    // Escuchar el click en cualquier botón verde o de enviar/procesar
    const botonesProcesar = document.querySelectorAll('button, .button-aceptar, #procesarBtn, .btn-primary');
    botonesProcesar.forEach(btn => {
        if (btn.innerText.toLowerCase().includes('procesan') || 
            btn.innerText.toLowerCase().includes('aceptar') || 
            btn.innerText.toLowerCase().includes('guardar')) {
            btn.addEventListener('click', guardarServicio);
        }
    });

    // Cargar los servicios si la vista tiene el contenedor de catálogo
    fetchServices();
});