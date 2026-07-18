// Base de datos inicial para Servicios
const defaultServices = [
    {
        id: 1,
        nombre: "Baño",
        titulo: "Estética Canina",
        descripcion: "Servicio completo de lavado, secado y cepillado adaptado a su pelaje.",
        precio: "$350 / $280 / $200",
        foto: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=400"
    },
    {
        id: 2,
        nombre: "Paseo",
        titulo: "Recreación activa",
        descripcion: "Caminatas recreativas controladas para mantener su salud física.",
        precio: "$150 / $120 / $90",
        foto: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=400"
    },
    {
        id: 3,
        nombre: "Hospedaje",
        titulo: "Estadía Confort",
        descripcion: "Estadía premium nocturna con suites adaptadas y monitoreo continuo.",
        precio: "$600 / $500 / $400",
        foto: "https://images.unsplash.com/photo-1596492784531-6e6eb5ea9993?q=80&w=400"
    },
    {
        id: 4,
        nombre: "Cuidados médicos",
        titulo: "Salud y Bienestar",
        descripcion: "Administración estricta de tratamientos y chequeos preventivos diarios.",
        precio: "$450 / $400 / $350",
        foto: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?q=80&w=400"
    }
];

let servicesData = JSON.parse(localStorage.getItem('pawcare_services')) || defaultServices;
if(!localStorage.getItem('pawcare_services')) {
    localStorage.setItem('pawcare_services', JSON.stringify(servicesData));
}

// Variables de Control
let editMode = false;
let currentEditId = null;
let base64Image = "";

// Selectores
const viewCatalog = document.getElementById('view-catalog');
const viewForm = document.getElementById('view-form');
const servicesContainer = document.getElementById('services-container');
const successModal = document.getElementById('success-modal');

const btnAddService = document.getElementById('btn-add-service');
const btnSave = document.getElementById('btn-save');
const btnCancel = document.getElementById('btn-cancel');

const imageDropzone = document.getElementById('image-dropzone');
const fileInput = document.getElementById('file-input');
const formPreview = document.getElementById('form-preview');
const uploadIcon = document.getElementById('upload-icon');

// Carga y renderizado del Catálogo
function renderCatalog() {
    servicesContainer.innerHTML = "";
    servicesData.forEach(srv => {
        const precios = srv.precio.split('/');
        const pGrande = precios[0] || srv.precio;
        const pMedio = precios[1] || srv.precio;
        const pPequeno = precios[2] || srv.precio;

        const card = document.createElement('div');
        card.className = 'service-card';
        card.innerHTML = `
            <img src="${srv.foto}" alt="${srv.nombre}">
            
            <!-- Contenedor del Menú de Opciones -->
            <div class="options-container">
                <div class="card-options" onclick="toggleDropdown(event, ${srv.id})">
                    <i class="fa-solid fa-ellipsis-vertical"></i>
                </div>
                <div class="options-dropdown" id="dropdown-${srv.id}">
                    <div class="dropdown-item edit-opt" onclick="openEditMode(${srv.id})">
                        <i class="fa-solid fa-pen-to-square"></i> Editar
                    </div>
                    <div class="dropdown-item delete-opt" onclick="deleteService(${srv.id})">
                        <i class="fa-solid fa-trash-can"></i> Eliminar
                    </div>
                </div>
            </div>

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

// Mostrar / ocultar el menú de tres puntos
function toggleDropdown(event, id) {
    event.stopPropagation();
    
    // Cerrar cualquier otro dropdown abierto primero
    document.querySelectorAll('.options-dropdown').forEach(dd => {
        if (dd.id !== `dropdown-${id}`) {
            dd.classList.remove('show');
        }
    });

    const currentDropdown = document.getElementById(`dropdown-${id}`);
    currentDropdown.classList.toggle('show');
}

// Cerrar dropdowns si se hace clic en cualquier otra parte de la pantalla
document.addEventListener('click', () => {
    document.querySelectorAll('.options-dropdown').forEach(dd => dd.classList.remove('show'));
});

// Función para eliminar un servicio
function deleteService(id) {
    if (confirm("¿Estás seguro de que deseas eliminar este servicio?")) {
        servicesData = servicesData.filter(srv => srv.id !== id);
        localStorage.setItem('pawcare_services', JSON.stringify(servicesData));
        renderCatalog();
    }
}

// Entrar en modo edición cargando los datos en el formulario
function openEditMode(id) {
    const srv = servicesData.find(s => s.id === id);
    if (!srv) return;

    editMode = true;
    currentEditId = id;

    // Rellenar formulario
    document.getElementById('service-name').value = srv.nombre;
    document.getElementById('service-title').value = srv.titulo;
    document.getElementById('service-desc').value = srv.descripcion;
    document.getElementById('service-price').value = srv.precio;

    // Cargar imagen previa
    base64Image = srv.foto;
    formPreview.src = srv.foto;
    formPreview.classList.remove('hidden');
    uploadIcon.classList.add('hidden');

    // Cambiar vista
    viewCatalog.classList.add('hidden');
    viewForm.classList.remove('hidden');
}

// Preparación para Crear un Nuevo Registro
btnAddService.addEventListener('click', () => {
    editMode = false;
    currentEditId = null;
    document.getElementById('service-form').reset();
    formPreview.src = "";
    formPreview.classList.add('hidden');
    uploadIcon.classList.remove('hidden');
    base64Image = "";
    
    viewCatalog.classList.add('hidden');
    viewForm.classList.remove('hidden');
});

// Cancelar Formulario
btnCancel.addEventListener('click', () => {
    viewForm.classList.add('hidden');
    viewCatalog.classList.remove('hidden');
});

// Selector de archivos de imagen
imageDropzone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            base64Image = event.target.result;
            formPreview.src = base64Image;
            formPreview.classList.remove('hidden');
            uploadIcon.classList.add('hidden');
        };
        reader.readAsDataURL(file);
    }
});

// Guardar Registro (Aceptar)
btnSave.addEventListener('click', () => {
    const name = document.getElementById('service-name').value.trim();
    const title = document.getElementById('service-title').value.trim();
    const desc = document.getElementById('service-desc').value.trim();
    const price = document.getElementById('service-price').value.trim();

    if(!name || !title || !desc || !price) {
        alert("Por favor completa todos los campos.");
        return;
    }

    if (editMode) {
        // Encontrar y actualizar el servicio existente
        const index = servicesData.findIndex(s => s.id === currentEditId);
        if (index !== -1) {
            servicesData[index] = {
                id: currentEditId,
                nombre: name,
                titulo: title,
                descripcion: desc,
                precio: price,
                foto: base64Image || servicesData[index].foto
            };
        }
    } else {
        // Crear nuevo servicio
        const newService = {
            id: Date.now(),
            nombre: name,
            titulo: title,
            descripcion: desc,
            precio: price,
            foto: base64Image || "https://via.placeholder.com/160x140?text=Servicio"
        };
        servicesData.push(newService);
    }

    localStorage.setItem('pawcare_services', JSON.stringify(servicesData));

    // Mostrar Modal de Éxito
    viewForm.classList.add('hidden');
    successModal.classList.remove('hidden');

    setTimeout(() => {
        successModal.classList.add('hidden');
        viewCatalog.classList.remove('hidden');
        renderCatalog();
    }, 2000);
});

// Carga Inicial
renderCatalog();