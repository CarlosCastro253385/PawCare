// Base de datos inicial con nuevas propiedades para indicaciones y prescripción
const defaultPets = [
    { 
        id: 1, 
        nombre: "Karol", 
        genero: "Hembra", 
        edad: "3 meses", 
        raza: "Golden Retriever", 
        dueno: "Oliver Pérez", 
        telefono: "9811234567", 
        foto: "https://images.unsplash.com/photo-1552053831-71594a27632d?q=80&w=200",
        indicaciones: "Debe mantenerlo lejos de otros cachorros, ya que en ocasiones es agresivo.\n\nademás debe darle de comer, 3 veces al día sin saltarse ninguna comida",
        prescripcion: { medicamento: "Amoxicilina", via: "Pastilla", dias: 5, cada: 8 }
    },
    { 
        id: 2, 
        nombre: "Copi Capi", 
        genero: "Macho", 
        edad: "2 meses", 
        raza: "Husky Siberiano", 
        dueno: "Oliver Pérez", 
        telefono: "9811234567", 
        foto: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?q=80&w=200",
        indicaciones: "Cuidados normales de cachorro.",
        prescripcion: { medicamento: "", via: "", dias: "", cada: "" }
    }
];

if (!localStorage.getItem('pawcare_pets')) {
    localStorage.setItem('pawcare_pets', JSON.stringify(defaultPets));
}

let petsData = JSON.parse(localStorage.getItem('pawcare_pets'));
let currentPetId = null;
let isEditMode = false;
let base64ImageStr = "";

// Elementos del DOM
const viewGrid = document.getElementById('view-grid');
const viewForm = document.getElementById('view-form');
const petsContainer = document.getElementById('pets-container');
const petDataForm = document.getElementById('pet-data-form');
const actionButtons = document.getElementById('action-buttons');
const previewImage = document.getElementById('preview-image');
const inputFile = document.getElementById('input-file');

// Sub-vistas e interruptores
const subviewData = document.getElementById('subview-data');
const subviewCuidado = document.getElementById('subview-cuidado');
const btnToggleData = document.getElementById('btn-toggle-data');
const btnToggleCuidado = document.getElementById('btn-toggle-cuidado');
const btnOpenPrescripcion = document.getElementById('btn-open-prescripcion');
const txtIndicaciones = document.getElementById('form-indicaciones');

// Modales
const statusModal = document.getElementById('status-modal');
const prescripcionModal = document.getElementById('prescripcion-modal');

// Eventos de Navegación
document.getElementById('btn-agregar-registro').addEventListener('click', openCreateMode);
document.querySelectorAll('.btn-back-grid').forEach(btn => btn.addEventListener('click', showGridView));

// Alternar entre Datos y Cuidado (Figma 1)
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

// Guardado de indicaciones independientes
document.getElementById('btn-guardar-cuidado').addEventListener('click', () => {
    if (currentPetId) {
        const petIndex = petsData.findIndex(p => p.id === currentPetId);
        if (petIndex !== -1) {
            petsData[petIndex].indicaciones = txtIndicaciones.value;
            localStorage.setItem('pawcare_pets', JSON.stringify(petsData));
            showModal(true, "CAMBIOS GUARDADOS", "Las indicaciones de cuidado se actualizaron con éxito");
            txtIndicaciones.disabled = true;
        }
    } else {
        showModal(false, "ERROR", "Guarda primero los datos generales de la mascota.");
    }
});

// Habilitar edición de indicaciones
document.querySelector('.edit-icon-cuidado').addEventListener('click', () => {
    txtIndicaciones.disabled = false;
    txtIndicaciones.focus();
});

// Modal de Prescripción Médica (Figma 2)
btnOpenPrescripcion.addEventListener('click', () => {
    if (!currentPetId) {
        showModal(false, "ERROR", "Debes seleccionar o crear una mascota antes de asignar prescripción médica.");
        return;
    }
    
    // Cargar prescripción existente
    const pet = petsData.find(p => p.id === currentPetId);
    if (pet && pet.prescripcion) {
        document.getElementById('presc-nombre').value = pet.prescripcion.medicamento || "";
        document.getElementById('presc-dias').value = pet.prescripcion.dias || "";
        document.getElementById('presc-cada').value = pet.prescripcion.cada || "";
        
        // Marcar radio
        const viaVal = pet.prescripcion.via || "";
        const radios = document.getElementsByName('via');
        let matched = false;
        radios.forEach(radio => {
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

document.getElementById('btn-guardar-prescripcion').addEventListener('click', () => {
    const petIndex = petsData.findIndex(p => p.id === currentPetId);
    if (petIndex !== -1) {
        const medicamento = document.getElementById('presc-nombre').value;
        const dias = document.getElementById('presc-dias').value;
        const cada = document.getElementById('presc-cada').value;
        
        let viaSelected = "";
        const radios = document.getElementsByName('via');
        radios.forEach(radio => {
            if (radio.checked) viaSelected = radio.value;
        });
        if (viaSelected === "Otro") {
            viaSelected = document.getElementById('presc-via-otro').value;
        }

        petsData[petIndex].prescripcion = { medicamento, via: viaSelected, dias, cada };
        localStorage.setItem('pawcare_pets', JSON.stringify(petsData));
        
        prescripcionModal.classList.add('hidden');
        showModal(true, "PREINSCRIPCIÓN GUARDADA", "La información médica se guardó correctamente.");
    }
});

// Cancelar edición de cuidado restablece su valor
document.getElementById('btn-cancelar-cuidado').addEventListener('click', () => {
    if (currentPetId) {
        const pet = petsData.find(p => p.id === currentPetId);
        txtIndicaciones.value = pet ? pet.indicaciones || "" : "";
    }
    txtIndicaciones.disabled = true;
});

// Cargar imagen
inputFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            previewImage.src = event.target.result;
            base64ImageStr = event.target.result;
        }
        reader.readAsDataURL(file);
    }
});

function renderGrid() {
    petsContainer.innerHTML = "";
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

function openDetailMode(id) {
    const pet = petsData.find(p => p.id === id);
    if (!pet) return;
    
    currentPetId = id;
    isEditMode = true;
    
    // Cargar datos principales
    document.getElementById('form-nombre').value = pet.nombre;
    document.getElementById('form-genero').value = pet.genero;
    document.getElementById('form-edad').value = pet.edad;
    document.getElementById('form-raza').value = pet.raza;
    document.getElementById('form-dueno').value = pet.dueno;
    document.getElementById('form-telefono').value = pet.telefono;
    
    // Cargar indicaciones
    txtIndicaciones.value = pet.indicaciones || "";
    
    previewImage.src = pet.foto || 'https://via.placeholder.com/150';
    base64ImageStr = pet.foto || '';

    enableFormInputs(false);
    
    // Resetear sub-vistas a la vista de datos por defecto
    subviewData.classList.remove('hidden');
    subviewCuidado.classList.add('hidden');
    btnToggleData.classList.add('hidden');
    btnToggleCuidado.classList.remove('hidden');

    viewGrid.classList.add('hidden');
    viewForm.classList.remove('hidden');
}

function openCreateMode() {
    currentPetId = null;
    isEditMode = false;
    petDataForm.reset();
    txtIndicaciones.value = "";
    previewImage.src = "https://via.placeholder.com/150";
    base64ImageStr = "";
    
    enableFormInputs(true);
    
    subviewData.classList.remove('hidden');
    subviewCuidado.classList.add('hidden');
    btnToggleData.classList.add('hidden');
    btnToggleCuidado.classList.remove('hidden');

    viewGrid.classList.add('hidden');
    viewForm.classList.remove('hidden');
}

function enableFormInputs(status) {
    const inputs = petDataForm.querySelectorAll('input');
    inputs.forEach(input => input.disabled = !status);
    txtIndicaciones.disabled = !status;
    if (status) {
        actionButtons.classList.remove('hidden');
    } else {
        actionButtons.classList.add('hidden');
    }
}

// Escuchar click de edición
document.querySelector('.edit-icon-main').addEventListener('click', () => {
    if(currentPetId) enableFormInputs(true);
});

// Enviar formulario principal
petDataForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const nombre = document.getElementById('form-nombre').value.trim();
    const genero = document.getElementById('form-genero').value.trim();
    const edad = document.getElementById('form-edad').value.trim();
    const raza = document.getElementById('form-raza').value.trim();
    const dueno = document.getElementById('form-dueno').value.trim();
    const telefono = document.getElementById('form-telefono').value.trim();

    if(isEditMode && currentPetId) {
        const index = petsData.findIndex(p => p.id === currentPetId);
        if(index !== -1) {
            petsData[index] = { 
                ...petsData[index], 
                nombre, genero, edad, raza, dueno, telefono, 
                foto: base64ImageStr 
            };
        }
    } else {
        const newPet = {
            id: Date.now(),
            nombre, genero, edad, raza, dueno, telefono,
            foto: base64ImageStr || "https://via.placeholder.com/150",
            indicaciones: "",
            prescripcion: { medicamento: "", via: "", dias: "", cada: "" }
        };
        petsData.push(newPet);
        currentPetId = newPet.id; // Asignar para poder agregar indicaciones de inmediato
    }

    localStorage.setItem('pawcare_pets', JSON.stringify(petsData));
    showModal(true, "CAMBIOS GUARDADOS", "Tus datos se registraron correctamente");
    showGridView();
});

// Modal de status
function showModal(isSuccess, title, message) {
    const iconBg = document.getElementById('modal-icon-bg');
    const icon = document.getElementById('modal-icon');
    
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-message').innerText = message;
    
    if(isSuccess) {
        iconBg.className = "modal-icon-circle success";
        icon.className = "fa-solid fa-user-check";
    } else {
        iconBg.className = "modal-icon-circle error";
        icon.className = "fa-solid fa-triangle-exclamation";
    }
    
    statusModal.classList.remove('hidden');
}

document.getElementById('modal-close-btn').addEventListener('click', () => {
    statusModal.classList.add('hidden');
});

// Render inicial
renderGrid();