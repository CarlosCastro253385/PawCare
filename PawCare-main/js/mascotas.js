let petsData = [];
let currentPetId = null;
let petToDeleteId = null;
let isEditMode = false;
let currentBase64Image = '';

// Elementos DOM
const viewGrid = document.getElementById('view-grid');
const viewForm = document.getElementById('view-form');
const petsContainer = document.getElementById('pets-container');
const previewImage = document.getElementById('preview-image');
const inputFile = document.getElementById('input-file');

const subviewData = document.getElementById('subview-data');
const subviewCuidado = document.getElementById('subview-cuidado');
const btnToggleData = document.getElementById('btn-toggle-data');
const btnToggleCuidado = document.getElementById('btn-toggle-cuidado');
const txtIndicaciones = document.getElementById('form-indicaciones');

// Modales
const statusModal = document.getElementById('status-modal');
const confirmDeleteModal = document.getElementById('confirm-delete-modal');
const prescripcionModal = document.getElementById('prescripcion-modal');

// Botones Prescripción
const btnOpenPrescripcion = document.getElementById('btn-open-prescripcion');
const btnCerrarPrescripcion = document.getElementById('btn-cerrar-prescripcion');
const btnGuardarPrescripcion = document.getElementById('btn-guardar-prescripcion');

const actionButtons = document.getElementById('action-buttons');
const cuidadoActions = document.getElementById('cuidado-actions');
const btnDeletePet = document.getElementById('btn-delete-pet');

// --- COMPRIMIR IMAGEN ---
inputFile?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        compressImage(file, 400, 0.7, (compressedBase64) => {
            currentBase64Image = compressedBase64;
            previewImage.src = compressedBase64;
        });
    }
});

function compressImage(file, maxWidth, quality, callback) {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
            callback(compressedDataUrl);
        };
    };
}

// --- NAV LISTENERS ---
document.querySelectorAll('.btn-back-grid').forEach(btn => {
    btn.addEventListener('click', showGridView);
});

document.getElementById('btn-agregar-registro').addEventListener('click', openCreateMode);

document.getElementById('btn-toggle-cuidado').addEventListener('click', () => {
    subviewData.classList.add('hidden');
    subviewCuidado.classList.remove('hidden');
    btnToggleCuidado.classList.add('hidden');
    btnToggleData.classList.remove('hidden');
});

document.getElementById('btn-toggle-data').addEventListener('click', () => {
    subviewCuidado.classList.add('hidden');
    subviewData.classList.remove('hidden');
    btnToggleData.classList.add('hidden');
    btnToggleCuidado.classList.remove('hidden');
});

document.getElementById('btn-edit-data')?.addEventListener('click', () => {
    setFormFieldsDisabled(false);
    actionButtons.classList.remove('hidden');
});

document.getElementById('btn-edit-cuidado')?.addEventListener('click', () => {
    txtIndicaciones.disabled = false;
    cuidadoActions.classList.remove('hidden');
});

document.getElementById('btn-cancelar-cuidado').addEventListener('click', () => {
    txtIndicaciones.disabled = true;
    cuidadoActions.classList.add('hidden');
});

// --- GUARDAR PRESCRIPCIÓN ---
btnOpenPrescripcion.addEventListener('click', async () => {
    if (currentPetId) {
        try {
            const res = await fetch(`${URL_BASE}/mascotas/${currentPetId}`);
            const data = await res.json();
            if (data.ok && data.prescripcion) {
                document.getElementById('presc-nombre').value = data.prescripcion.medicamento || '';
                document.getElementById('presc-dias').value = data.prescripcion.dias || '';
                document.getElementById('presc-cada').value = data.prescripcion.cada_horas || '';
                
                const viaRadio = document.querySelector(`input[name="via"][value="${data.prescripcion.via}"]`);
                if (viaRadio) {
                    viaRadio.checked = true;
                } else if(data.prescripcion.via) {
                    document.querySelector('input[name="via"][value="Otro"]').checked = true;
                    document.getElementById('presc-via-otro').value = data.prescripcion.via;
                }
            }
        } catch(e) {
            console.error('Error al obtener la prescripción:', e);
        }
    }
    prescripcionModal.classList.remove('hidden');
});

btnCerrarPrescripcion.addEventListener('click', () => {
    prescripcionModal.classList.add('hidden');
});

btnGuardarPrescripcion.addEventListener('click', async () => {
    if (!currentPetId) {
        showStatusModal('ATENCIÓN', 'Primero debes guardar la mascota.', false);
        return;
    }

    const viaRadio = document.querySelector('input[name="via"]:checked');
    let viaValue = viaRadio ? viaRadio.value : '';
    if (viaValue === 'Otro') {
        viaValue = document.getElementById('presc-via-otro').value.trim() || 'Otro';
    }

    const payloadPrescripcion = {
        medicamento: document.getElementById('presc-nombre').value,
        via: viaValue,
        dias: parseInt(document.getElementById('presc-dias').value, 10) || 0,
        cada_horas: parseInt(document.getElementById('presc-cada').value, 10) || 0
    };

    if (!payloadPrescripcion.medicamento) {
        showStatusModal('ATENCIÓN', 'Ingresa el nombre del medicamento.', false);
        return;
    }

    try {
        const res = await fetch(`${URL_BASE}/mascotas/${currentPetId}/prescripcion`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payloadPrescripcion)
        });

        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.mensaje);

        prescripcionModal.classList.add('hidden');
        showStatusModal('GUARDADO', 'La prescripción médica fue guardada.', true);
    } catch (err) {
        showStatusModal('ERROR', err.message || 'Error al guardar prescripción.', false);
    }
});

// --- ELIMINAR MASCOTA ---
btnDeletePet.addEventListener('click', () => {
    if (currentPetId) askDeleteConfirmation(currentPetId);
});

function askDeleteConfirmation(id) {
    petToDeleteId = id;
    confirmDeleteModal.classList.remove('hidden');
}

document.getElementById('btn-confirm-delete').addEventListener('click', async () => {
    if (petToDeleteId) {
        confirmDeleteModal.classList.add('hidden');
        await executeDelete(petToDeleteId);
        petToDeleteId = null;
    }
});

document.getElementById('btn-cancel-delete').addEventListener('click', () => {
    confirmDeleteModal.classList.add('hidden');
    petToDeleteId = null;
});

async function executeDelete(id) {
    try {
        const res = await fetch(`${URL_BASE}/mascotas/${id}`, { method: 'DELETE' });
        const data = await res.json();

        if (!res.ok || !data.ok) throw new Error(data.mensaje);

        showStatusModal('ELIMINADO', 'Mascota eliminada correctamente.', true);
        await fetchPets();
        showGridView();
    } catch (err) {
        showStatusModal('ERROR', err.message || 'No se pudo eliminar la mascota.', false);
    }
}

// --- PETS GRID & CARGA ---
async function fetchPets() {
    try {
        const res = await fetch(`${URL_BASE}/mascotas`);
        if (!res.ok) throw new Error();

        const respuesta = await res.json();
        petsData = respuesta.mascotas || [];
    } catch (err) {
        console.error('Error al obtener mascotas:', err);
    }
    renderGrid();
}

function renderGrid() {
    petsContainer.innerHTML = "";
    if (petsData.length === 0) {
        petsContainer.innerHTML = `<p style="color: #666; text-align: center; grid-column: 1/-1;">No hay mascotas registradas.</p>`;
        return;
    }

    petsData.forEach(pet => {
        const idMascota = pet.id_mascota || pet.id;
        const card = document.createElement('div');
        card.className = 'pet-card';
        card.onclick = () => openDetailMode(idMascota);

        card.innerHTML = `
            <div class="delete-card-icon" title="Eliminar" onclick="event.stopPropagation(); askDeleteConfirmation(${idMascota});">
                <i class="fa-solid fa-trash"></i>
            </div>
            <img src="${pet.foto || 'https://via.placeholder.com/150'}" alt="${pet.nombre}">
            <h4>Nombre: ${pet.nombre}</h4>
            <p>Género: ${pet.genero || 'N/A'}</p>
            <p>Edad: ${pet.edad || 0} años</p>
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

// MODIFICADO: Consulta al backend directamente para obtener datos actualizados en tiempo real
async function openDetailMode(id) {
    isEditMode = true;
    currentPetId = id;

    try {
        const res = await fetch(`${URL_BASE}/mascotas/${id}`);
        const data = await res.json();

        if (!res.ok || !data.ok || !data.mascota) {
            throw new Error(data.mensaje || 'Error al obtener la mascota');
        }

        const pet = data.mascota;
        currentBase64Image = pet.foto || '';

        document.getElementById('form-nombre').value = pet.nombre || '';
        document.getElementById('form-genero').value = pet.genero || '';
        document.getElementById('form-edad').value = pet.edad || '';
        document.getElementById('form-raza').value = pet.raza || '';
        document.getElementById('form-dueno').value = pet.dueno || '';
        document.getElementById('form-telefono').value = pet.telefono || '';
        txtIndicaciones.value = pet.indicaciones || "";

        setFormFieldsDisabled(true);
        actionButtons.classList.add('hidden');
        cuidadoActions.classList.add('hidden');
        btnDeletePet.classList.remove('hidden');

        previewImage.src = pet.foto || 'https://via.placeholder.com/150';

        subviewData.classList.remove('hidden');
        subviewCuidado.classList.add('hidden');
        btnToggleData.classList.add('hidden');
        btnToggleCuidado.classList.remove('hidden');

        viewGrid.classList.add('hidden');
        viewForm.classList.remove('hidden');
    } catch (err) {
        showStatusModal('ERROR', err.message || 'No se pudo cargar la información.', false);
    }
}

function openCreateMode() {
    isEditMode = false;
    currentPetId = null;
    currentBase64Image = '';
    document.getElementById('pet-data-form').reset();
    document.getElementById('prescripcion-form').reset();
    txtIndicaciones.value = "";
    previewImage.src = 'https://via.placeholder.com/150';

    setFormFieldsDisabled(false);
    actionButtons.classList.remove('hidden');
    btnDeletePet.classList.add('hidden');

    subviewData.classList.remove('hidden');
    subviewCuidado.classList.add('hidden');
    btnToggleData.classList.add('hidden');
    btnToggleCuidado.classList.remove('hidden');

    viewGrid.classList.add('hidden');
    viewForm.classList.remove('hidden');
}

function setFormFieldsDisabled(disabled) {
    const inputs = document.querySelectorAll('#pet-data-form input, #pet-data-form select, #form-indicaciones');
    inputs.forEach(input => input.disabled = disabled);
}

// --- GUARDAR O ACTUALIZAR MASCOTA ---
document.getElementById('pet-data-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {
        nombre: document.getElementById('form-nombre').value,
        genero: document.getElementById('form-genero').value,
        edad: parseInt(document.getElementById('form-edad').value, 10) || 0,
        raza: document.getElementById('form-raza').value,
        nombreCliente: document.getElementById('form-dueno').value,
        telefonoCliente: document.getElementById('form-telefono').value,
        indicaciones: txtIndicaciones.value,
        foto: currentBase64Image || previewImage.src
    };

    try {
        const url = isEditMode ? `${URL_BASE}/mascotas/${currentPetId}` : `${URL_BASE}/mascotas`;
        const method = isEditMode ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (!res.ok || !data.ok) {
            throw new Error(data.mensaje || `Error HTTP ${res.status}`);
        }

        showStatusModal('GUARDADO', 'Registro de mascota guardado correctamente.', true);
        await fetchPets();
        showGridView();
    } catch (err) {
        showStatusModal('ERROR', err.message || 'Error al conectar con el servidor.', false);
    }
});

// GUARDAR INDICACIONES DE CUIDADO
document.getElementById('btn-guardar-cuidado').addEventListener('click', async () => {
    if (!currentPetId) return;

    try {
        const res = await fetch(`${URL_BASE}/mascotas/${currentPetId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nombre: document.getElementById('form-nombre').value,
                genero: document.getElementById('form-genero').value,
                edad: parseInt(document.getElementById('form-edad').value, 10) || 0,
                raza: document.getElementById('form-raza').value,
                nombreCliente: document.getElementById('form-dueno').value,
                telefonoCliente: document.getElementById('form-telefono').value,
                foto: currentBase64Image || previewImage.src,
                indicaciones: txtIndicaciones.value
            })
        });

        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.mensaje);

        showStatusModal('ACTUALIZADO', 'Indicaciones de cuidado guardadas.', true);
        txtIndicaciones.disabled = true;
        cuidadoActions.classList.add('hidden');
    } catch (err) {
        showStatusModal('ERROR', err.message || 'No se guardaron las indicaciones.', false);
    }
});

// MODAL DE STATUS
document.getElementById('modal-close-btn').addEventListener('click', () => {
    statusModal.classList.add('hidden');
});

function showStatusModal(title, message, success = true) {
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-message').innerText = message;
    const icon = document.getElementById('modal-icon');
    const bg = document.getElementById('modal-icon-bg');
    
    if (success) {
        icon.className = 'fa-solid fa-check';
        if (bg) bg.style.backgroundColor = '#2ecc71';
    } else {
        icon.className = 'fa-solid fa-xmark';
        if (bg) bg.style.backgroundColor = '#e74c3c';
    }
    
    statusModal.classList.remove('hidden');
}

// INICIO
fetchPets();