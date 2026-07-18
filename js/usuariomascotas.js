// Obtener la base de datos que maneja el administrador
let petsData = JSON.parse(localStorage.getItem('pawcare_pets')) || [];
let currentPetId = null;

// Elementos del DOM
const viewGrid = document.getElementById('view-grid');
const viewForm = document.getElementById('view-form');
const petsContainer = document.getElementById('pets-container');
const previewImage = document.getElementById('preview-image');

// Sub-vistas e interruptores
const subviewData = document.getElementById('subview-data');
const subviewCuidado = document.getElementById('subview-cuidado');
const btnToggleData = document.getElementById('btn-toggle-data');
const btnToggleCuidado = document.getElementById('btn-toggle-cuidado');
const btnOpenPrescripcion = document.getElementById('btn-open-prescripcion');
const txtIndicaciones = document.getElementById('form-indicaciones');

// Modales
const prescripcionModal = document.getElementById('prescripcion-modal');

// Eventos de Navegación
document.querySelectorAll('.btn-back-grid').forEach(btn => btn.addEventListener('click', showGridView));
document.getElementById('btn-volver-cuidado').addEventListener('click', () => btnToggleData.click());

// Alternar pantallas (Datos / Cuidado)
btnToggleCuidado.addEventListener('click', () => {
    subviewData.classList.add('hidden');
    subviewCuidado.classList.remove('hidden');
    btnToggleCuidado.classList.add('hidden');
    btnToggleData.classList.remove('hidden');
});

btnToggleData.addEventListener('click', () => {
    subviewCuidado.classList.add('hidden');
    subviewData.classList.remove('hidden');
    btnToggleData.classList.add('hidden');
    btnToggleCuidado.classList.remove('hidden');
});

// Modal de Prescripción Médica (Solo lectura)
btnOpenPrescripcion.addEventListener('click', () => {
    const pet = petsData.find(p => p.id === currentPetId);
    if (pet && pet.prescripcion) {
        document.getElementById('presc-nombre').value = pet.prescripcion.medicamento || "Sin especificar";
        document.getElementById('presc-dias').value = pet.prescripcion.dias || "";
        document.getElementById('presc-cada').value = pet.prescripcion.cada || "";
        
        const viaVal = pet.prescripcion.via || "";
        const radios = document.getElementsByName('via');
        let matched = false;
        
        radios.forEach(radio => {
            radio.checked = false; // reset
            if (radio.value === viaVal) {
                radio.checked = true;
                matched = true;
            }
        });

        if (!matched && viaVal !== "") {
            document.getElementById('radio-otro').checked = true;
            document.getElementById('presc-via-otro').value = viaVal;
        } else {
            document.getElementById('presc-via-otro').value = "";
        }
    }
    prescripcionModal.classList.remove('hidden');
});

document.getElementById('btn-cerrar-prescripcion').addEventListener('click', () => {
    prescripcionModal.classList.add('hidden');
});

// Renderizar el catálogo de mascotas
function renderGrid() {
    petsContainer.innerHTML = "";
    if (petsData.length === 0) {
        petsContainer.innerHTML = `<p style="color: #666; font-size: 16px; grid-column: 1/-1; text-align: center;">No hay mascotas registradas en el sistema.</p>`;
        return;
    }

    petsData.forEach(pet => {
        const card = document.createElement('div');
        card.className = 'pet-card';
        card.onclick = () => openDetailMode(pet.id);
        
        card.innerHTML = `
            <img src="${pet.foto || 'https://via.placeholder.com/150'}" alt="${pet.nombre}">
            <h4>Nombre: ${pet.nombre}</h4>
            <p>Género: ${pet.genero}</p>
            <p>Edad: ${pet.edad}</p>
            <div class="info-icon"><i class="fa-solid fa-circle-info"></i></div>
        `;
        petsContainer.appendChild(card);
    });
}

function showGridView() {
    viewGrid.classList.remove('hidden');
    viewForm.classList.add('hidden');
    renderGrid();
}

// Abrir detalle en modo lectura estricto
function openDetailMode(id) {
    const pet = petsData.find(p => p.id === id);
    if (!pet) return;
    
    currentPetId = id;
    
    // Asignar datos del formulario
    document.getElementById('form-nombre').value = pet.nombre;
    document.getElementById('form-genero').value = pet.genero;
    document.getElementById('form-edad').value = pet.edad;
    document.getElementById('form-raza').value = pet.raza;
    document.getElementById('form-dueno').value = pet.dueno;
    document.getElementById('form-telefono').value = pet.telefono;
    
    // Asignar indicaciones
    txtIndicaciones.value = pet.indicaciones || "Sin indicaciones particulares de cuidado.";
    
    // Forzar deshabilitado de inputs (por seguridad extra)
    const inputs = document.querySelectorAll('#pet-data-form input, #form-indicaciones');
    inputs.forEach(input => input.disabled = true);
    
    previewImage.src = pet.foto || 'https://via.placeholder.com/150';

    // Resetear vistas internas
    subviewData.classList.remove('hidden');
    subviewCuidado.classList.add('hidden');
    btnToggleData.classList.add('hidden');
    btnToggleCuidado.classList.remove('hidden');

    viewGrid.classList.add('hidden');
    viewForm.classList.remove('hidden');
}

// Carga Inicial del Grid
renderGrid();