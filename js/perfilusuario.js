const profileForm = document.getElementById('profile-form');
const btnEdit = document.getElementById('btn-edit');
const btnCancel = document.getElementById('btn-cancel');
const btnSave = document.getElementById('btn-save');
const inputs = profileForm.querySelectorAll('input');
const emailInput = document.getElementById('correo');
const phoneInput = document.getElementById('telefono');
const modalSuccess = document.getElementById('modal-success');
const modalError = document.getElementById('modal-error');

let profile = {};
const originalValues = new Map();

// 1. Detección flexible de sesión (revisa localStorage y sessionStorage)
const rawSesion = localStorage.getItem('usuarioActual') || 
                  localStorage.getItem('usuario') || 
                  sessionStorage.getItem('usuarioActual') || 
                  sessionStorage.getItem('usuario') || '{}';

const sesion = JSON.parse(rawSesion);

function setValue(id, value) {
  const el = document.getElementById(id);
  if (el && value !== undefined && value !== null) {
    el.value = value;
  }
}

function pintarPerfil(data) {
  profile = data || {};
  setValue('nombre', profile.nombre);
  setValue('correo', profile.correo);
  setValue('nombre-usuario', profile.usuario || profile.nombre_usuario);
  setValue('telefono', profile.telefono);
  setValue('direccion', profile.direccion);

  // Actualiza los textos de la cabecera
  if (profile.nombre) {
    const h2 = document.querySelector('.profile-header h2');
    if (h2) h2.textContent = profile.nombre;
  }
  if (profile.correo) {
    const emailMeta = document.querySelector('.profile-meta span:first-child');
    if (emailMeta) emailMeta.textContent = profile.correo;
  }
}

async function cargarPerfil() {
  // Obtiene el ID sin importar si viene como id_usuario o id
  const userId = sesion.id_usuario || sesion.id;

  if (!userId) {
    console.warn('No se encontró ID de usuario en la sesión:', sesion);
    mostrarError('No hay sesión activa. Vuelve a iniciar sesión.');
    return;
  }

  try {
    const respuesta = await apiFetch(`/perfil/${userId}`, { method: 'GET' });
    
    if (!respuesta.ok) {
      throw new Error('Error en la respuesta del servidor');
    }

    // Convertimos la respuesta a JSON
    const data = await respuesta.json();
    const datosPerfil = data.perfil || data;

    pintarPerfil(datosPerfil);
  } catch (err) {
    console.error('No se pudo cargar el perfil:', err.message);
    mostrarError('No se pudo cargar tu perfil. Intenta recargar la página.');
  }
}

function setEditing(editing) {
  inputs.forEach((input) => { input.disabled = !editing; });
  if (btnEdit) btnEdit.classList.toggle('d-none', editing);
  if (btnCancel) btnCancel.classList.toggle('d-none', !editing);
  if (btnSave) btnSave.classList.toggle('d-none', !editing);
}

if (btnEdit) {
  btnEdit.addEventListener('click', () => {
    inputs.forEach((input) => originalValues.set(input.id, input.value));
    setEditing(true);
    if (inputs[0]) inputs[0].focus();
  });
}

if (btnCancel) {
  btnCancel.addEventListener('click', () => {
    inputs.forEach((input) => { 
      input.value = originalValues.get(input.id) || ''; 
      if (input.parentElement) input.parentElement.classList.remove('error'); 
    });
    setEditing(false);
  });
}

if (profileForm) {
  profileForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const userId = sesion.id_usuario || sesion.id;
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value.trim());
    const phoneValid = /^\d{10}$/.test(phoneInput.value.replace(/\D/g, ''));

    if (emailInput.parentElement) emailInput.parentElement.classList.toggle('error', !emailValid);
    if (phoneInput.parentElement) phoneInput.parentElement.classList.toggle('error', !phoneValid);

    if (!emailValid || !phoneValid) { 
      mostrarError('Revisa el correo y el teléfono, tienen un formato inválido.'); 
      return; 
    }

    const nuevaContrasena = document.getElementById('password').value;

    const cuerpo = {
      nombre: document.getElementById('nombre').value.trim(),
      correo: emailInput.value.trim(),
      telefono: phoneInput.value.replace(/\D/g, ''),
      direccion: document.getElementById('direccion').value.trim()
    };
    
    if (nuevaContrasena) {
      cuerpo.contrasena = nuevaContrasena;
    }

    if (btnSave) btnSave.disabled = true;

    try {
      const res = await apiFetch(`/perfil/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(cuerpo)
      });

      if (!res.ok) {
        throw new Error('No se pudieron actualizar los datos.');
      }

      pintarPerfil({ ...profile, ...cuerpo });
      setEditing(false);
      mostrarModal(modalSuccess);
    } catch (err) {
      mostrarError(err.message || 'No se pudo guardar tu perfil. Intenta de nuevo.');
    } finally {
      if (btnSave) btnSave.disabled = false;
    }
  });
}

function mostrarModal(modal) {
  if (!modal) return;
  modal.classList.remove('d-none');
  setTimeout(() => modal.classList.add('d-none'), 3000);
}

function mostrarError(mensaje) {
  const texto = modalError ? modalError.querySelector('.mensaje-error') || modalError.querySelector('p') : null;
  if (texto && mensaje) texto.textContent = mensaje;
  mostrarModal(modalError);
}

// Inicializar la carga del perfil
cargarPerfil();