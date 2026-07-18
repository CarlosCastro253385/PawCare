// Servicios por defecto por si el localStorage está vacío
const defaultServices = [
    {
        id: 1,
        nombre: "Baño",
        precio: "$350 / $280 / $200",
        foto: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=400"
    },
    {
        id: 2,
        nombre: "Paseo",
        precio: "$150 / $120 / $90",
        foto: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=400"
    },
    {
        id: 3,
        nombre: "Hospedaje",
        precio: "$600 / $500 / $400",
        foto: "https://images.unsplash.com/photo-1596492784531-6e6eb5ea9993?q=80&w=400"
    },
    {
        id: 4,
        nombre: "Cuidados médicos",
        precio: "$450 / $400 / $350",
        foto: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?q=80&w=400"
    }
];

// Leer los servicios que gestiona el administrador
let servicesData = JSON.parse(localStorage.getItem('pawcare_services')) || defaultServices;

const servicesContainer = document.getElementById('services-container');

// Renderizar el catálogo en modo Solo Lectura
function renderUserCatalog() {
    servicesContainer.innerHTML = "";
    
    if (servicesData.length === 0) {
        servicesContainer.innerHTML = `<p style="color: #666; font-size: 16px; text-align: center; padding: 20px;">No hay servicios disponibles en este momento.</p>`;
        return;
    }

    servicesData.forEach(srv => {
        // Descomponer los precios por tamaño de raza
        const precios = srv.precio.split('/');
        const pGrande = precios[0] || srv.precio;
        const pMedio = precios[1] || srv.precio;
        const pPequeno = precios[2] || srv.precio;

        const card = document.createElement('div');
        card.className = 'service-card';
        
        // El HTML de la tarjeta NO incluye el contenedor de los 3 puntos ni dropdowns
        card.innerHTML = `
            <img src="${srv.foto}" alt="${srv.nombre}">
            <div class="service-info">
                <h3>${srv.nombre}</h3>
                <div class="pricing-grid">
                    <div class="price-column">
                        <h4>Raza Grande</h4>
                        <ul><li>• Detalle</li><li>• detalle</li><li>• detalle</li></ul>
                        <div class="price-value">${pGrande.trim()}</div>
                    </div>
                    <div class="price-column">
                        <h4>Raza Mediana</h4>
                        <ul><li>• Detalle</li><li>• detalle</li><li>• detalle</li></ul>
                        <div class="price-value">${pMedio.trim()}</div>
                    </div>
                    <div class="price-column">
                        <h4>Raza Pequeña</h4>
                        <ul><li>• Detalle</li><li>• detalle</li><li>• detalle</li></ul>
                        <div class="price-value">${pPequeno.trim()}</div>
                    </div>
                </div>
            </div>
        `;
        servicesContainer.appendChild(card);
    });
}

// Inicializar catálogo al cargar
renderUserCatalog();