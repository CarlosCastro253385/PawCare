document.addEventListener('DOMContentLoaded', () => {

    const URL_BASE = 'http://107.22.53.32:8080/api';
    const servicesContainer = document.getElementById('services-container');
    let servicesData = [];

    // Función base para comunicar con tu servidor AWS
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

    // Obtener la información real desde el Backend
    async function fetchServices() {
        if (!servicesContainer) return;
        
        try {
            const respuesta = await apiFetch('/servicios', { method: 'GET' });
            // Adaptación flexible según cómo responda tu API estructurada
            servicesData = respuesta.servicios || respuesta.data || respuesta;
        } catch (err) {
            console.warn('No se pudo conectar con la API de servicios:', err.message);
            servicesData = [];
        }
        renderUserCatalog();
    }

    // Renderizar el catálogo limpio en modo lectura para el cliente
    function renderUserCatalog() {
        if (!servicesContainer) return;
        servicesContainer.innerHTML = "";

        if (!Array.isArray(servicesData) || servicesData.length === 0) {
            servicesContainer.innerHTML = `<p style="color: #666; font-size: 16px; text-align: center; padding: 20px;">No hay servicios disponibles en este momento.</p>`;
            return;
        }

        servicesData.forEach(srv => {
            // Normalización de variables procedentes de la BD
            const pGrande = parseFloat(srv.precio_grande || srv.precioGrande || 0).toFixed(2);
            const pMediano = parseFloat(srv.precio_mediano || srv.precioMediano || 0).toFixed(2);
            const pChico = parseFloat(srv.precio_chico || srv.precioChico || srv.precioPequeño || srv.precio_pequeno || 0).toFixed(2);
            const foto = srv.imagen || srv.foto || 'img/default-service.png';
            const desc = srv.descripcion || '';

            // Procesamiento dinámico de los saltos de línea introducidos en el Administrador
            const detallesRaw = srv.titulo_corto || srv.tituloCorto || '';
            const lineas = detallesRaw.split('\n').map(d => d.trim()).filter(d => d.length > 0);
            
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
            `;
            servicesContainer.appendChild(card);
        });
    }

    // Ejecución inicial automática al cargar la vista
    fetchServices();
});