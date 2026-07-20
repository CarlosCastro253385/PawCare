let servicesData = [];
const servicesContainer = document.getElementById('services-container');

async function fetchServices() {
    try {
        const respuesta = await apiFetch('/servicios', { method: 'GET' });
        servicesData = respuesta.servicios || [];
    } catch (err) {
        console.warn('No se pudo conectar con la API de servicios:', err.message);
        servicesData = [];
    }
    renderUserCatalog();
}

function renderUserCatalog() {
    servicesContainer.innerHTML = "";
    if (servicesData.length === 0) {
        servicesContainer.innerHTML = `<p style="color: #666; font-size: 16px; text-align: center; padding: 20px;">No hay servicios disponibles en este momento.</p>`;
        return;
    }
    servicesData.forEach(srv => {
        const card = document.createElement('div');
        card.className = 'service-card';
        card.innerHTML = `
            <img src="${srv.foto}" alt="${srv.nombre}">
            <div class="service-info">
                <h3>${srv.nombre}</h3>
                <div class="pricing-grid">
                    <div class="price-column">
                        <h4>Raza Grande</h4>
                        <ul><li>• Detalle</li><li>• detalle</li><li>• detalle</li></ul>
                        <div class="price-value">$${srv.precio_grande}</div>
                    </div>
                    <div class="price-column">
                        <h4>Raza Mediana</h4>
                        <ul><li>• Detalle</li><li>• detalle</li><li>• detalle</li></ul>
                        <div class="price-value">$${srv.precio_mediano}</div>
                    </div>
                    <div class="price-column">
                        <h4>Raza Pequeña</h4>
                        <ul><li>• Detalle</li><li>• detalle</li><li>• detalle</li></ul>
                        <div class="price-value">$${srv.precio_pequeno}</div>
                    </div>
                </div>
            </div>
        `;
        servicesContainer.appendChild(card);
    });
}

fetchServices();