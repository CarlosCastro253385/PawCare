const API_URL = 'http://107.22.53.32:8080';

let servicesData = []; 

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

async function cargarServicios() {
  try {
    const respuesta = await fetch(`${API_URL}/api/servicios`);
    const datos = await respuesta.json();

    if (datos.ok) {
      servicesData = datos.servicios.map((s) => ({
        id: s.id_servicio,
        nombre: s.nombre,
        titulo: s.titulo,
        descripcion: s.descripcion,
        precio: `$${s.precio_grande} / $${s.precio_mediano} / $${s.precio_pequeno}`,
        foto: s.foto,
      }));
    }
    renderCatalog();
  } catch (error) {
    console.error('Error al cargar servicios:', error);
  }
}

function partirPrecios(textoPrecio) {
  const partes = textoPrecio.split('/').map((p) => Number(p.replace(/[^0-9.]/g, '')) || 0);
  return {
    precio_grande: partes[0] || 0,
    precio_mediano: partes[1] || 0,
    precio_pequeno: partes[2] || 0,
  };
}

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

function toggleDropdown(event, id) {
  event.stopPropagation();
  document.querySelectorAll('.options-dropdown').forEach(dd => {
    if (dd.id !== `dropdown-${id}`) dd.classList.remove('show');
  });
  document.getElementById(`dropdown-${id}`).classList.toggle('show');
}

document.addEventListener('click', () => {
  document.querySelectorAll('.options-dropdown').forEach(dd => dd.classList.remove('show'));
});

// ---------- Eliminar: ahora llama a DELETE /api/servicios/:id ----------
async function deleteService(id) {
  if (!confirm("¿Estás seguro de que deseas eliminar este servicio?")) return;

  try {
    const respuesta = await fetch(`${API_URL}/api/servicios/${id}`, { method: 'DELETE' });
    const resultado = await respuesta.json();

    if (resultado.ok) {
      await cargarServicios();
    } else {
      alert('No se pudo eliminar el servicio.');
    }
  } catch (error) {
    console.error('Error al eliminar servicio:', error);
    alert('No se pudo conectar con el servidor.');
  }
}

function openEditMode(id) {
  const srv = servicesData.find(s => s.id === id);
  if (!srv) return;

  editMode = true;
  currentEditId = id;

  document.getElementById('service-name').value = srv.nombre;
  document.getElementById('service-title').value = srv.titulo;
  document.getElementById('service-desc').value = srv.descripcion;
  document.getElementById('service-price').value = srv.precio;

  base64Image = srv.foto;
  formPreview.src = srv.foto;
  formPreview.classList.remove('hidden');
  uploadIcon.classList.add('hidden');

  viewCatalog.classList.add('hidden');
  viewForm.classList.remove('hidden');
}

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

btnCancel.addEventListener('click', () => {
  viewForm.classList.add('hidden');
  viewCatalog.classList.remove('hidden');
});

imageDropzone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (event) {
      base64Image = event.target.result;
      formPreview.src = base64Image;
      formPreview.classList.remove('hidden');
      uploadIcon.classList.add('hidden');
    };
    reader.readAsDataURL(file);
  }
});

btnSave.addEventListener('click', async () => {
  const name = document.getElementById('service-name').value.trim();
  const title = document.getElementById('service-title').value.trim();
  const desc = document.getElementById('service-desc').value.trim();
  const price = document.getElementById('service-price').value.trim();

  if (!name || !title || !desc || !price) {
    alert("Por favor completa todos los campos.");
    return;
  }

  const cuerpo = {
    nombre: name,
    titulo: title,
    descripcion: desc,
    foto: base64Image || "https://via.placeholder.com/160x140?text=Servicio",
    ...partirPrecios(price),
  };

  try {
    let respuesta;
    if (editMode) {
      respuesta = await fetch(`${API_URL}/api/servicios/${currentEditId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cuerpo),
      });
    } else {
      respuesta = await fetch(`${API_URL}/api/servicios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cuerpo),
      });
    }

    const resultado = await respuesta.json();
    if (!resultado.ok) {
      alert(resultado.mensaje || 'No se pudo guardar el servicio.');
      return;
    }

    viewForm.classList.add('hidden');
    successModal.classList.remove('hidden');

    setTimeout(async () => {
      successModal.classList.add('hidden');
      viewCatalog.classList.remove('hidden');
      await cargarServicios(); // recarga la lista real desde la BD
    }, 2000);
  } catch (error) {
    console.error('Error al guardar servicio:', error);
    alert('No se pudo conectar con el servidor.');
  }
});

cargarServicios();