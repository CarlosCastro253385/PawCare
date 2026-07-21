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

// Este objeto lo guarda login.js al iniciar sesión
const sesion = JSON.parse(sessionStorage.getItem('usuarioActual') || '{}');

function setValue(id, value) {
  if (value) document.getElementById(id).value = value;
}

function pintarPerfil(data) {
  profile = data || {};
  setValue('nombre', profile.nombre);
  setValue('correo', profile.correo);
  setValue('nombre-usuario', profile.usuario);
  setValue('telefono', profile.telefono);
  setValue('direccion', profile.direccion);
  // La contraseña no la regresa la API por seguridad, se deja en blanco

  if (profile.nombre) document.querySelector('.profile-header h2').textContent = profile.nombre;
  if (profile.correo) document.querySelector('.profile-meta span:first-child').textContent = profile.correo;
}

async function cargarPerfil() {
  if (!sesion.id_usuario) {
    mostrarError('No hay sesión activa. Vuelve a iniciar sesión.');
    return;
  }
  try {
    const respuesta = await apiFetch(`/perfil/${sesion.id_usuario}`, { method: 'GET' });
    pintarPerfil(respuesta.perfil);
  } catch (err) {
    console.error('No se pudo cargar el perfil:', err.message);
    mostrarError('No se pudo cargar tu perfil. Intenta recargar la página.');
  }
}

function setEditing(editing) {
  inputs.forEach((input) => { input.disabled = !editing; });
  btnEdit.classList.toggle('d-none', editing);
  btnCancel.classList.toggle('d-none', !editing);
  btnSave.classList.toggle('d-none', !editing);
}

btnEdit.addEventListener('click', () => {
  inputs.forEach((input) => originalValues.set(input.id, input.value));
  setEditing(true);
  inputs[0].focus();
});

btnCancel.addEventListener('click', () => {
  inputs.forEach((input) => { input.value = originalValues.get(input.id) || ''; input.parentElement.classList.remove('error'); });
  setEditing(false);
});

profileForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value.trim());
  const phoneValid = /^\d{10}$/.test(phoneInput.value.replace(/\D/g, ''));

  emailInput.parentElement.classList.toggle('error', !emailValid);
  phoneInput.parentElement.classList.toggle('error', !phoneValid);

  if (!emailValid || !phoneValid) { mostrarError('Revisa el correo y el teléfono, tienen un formato inválido.'); return; }

  const nuevaContrasena = document.getElementById('password').value;

  const cuerpo = {
    nombre: document.getElementById('nombre').value.trim(),
    correo: emailInput.value.trim(),
    telefono: phoneInput.value.replace(/\D/g, ''),
    direccion: document.getElementById('direccion').value.trim()
  };
  if (nuevaContrasena) cuerpo.contrasena = nuevaContrasena;

  if (btnSave) { btnSave.disabled = true; }

  try {
    await apiFetch(`/perfil/${sesion.id_usuario}`, {
      method: 'PUT',
      body: JSON.stringify(cuerpo)
    });

    pintarPerfil({ ...profile, ...cuerpo });
    setEditing(false);
    mostrarModal(modalSuccess);
  } catch (err) {
    mostrarError(err.message || 'No se pudo guardar tu perfil. Intenta de nuevo.');
  } finally {
    if (btnSave) { btnSave.disabled = false; }
  }
});

function mostrarModal(modal) {
  modal.classList.remove('d-none');
  setTimeout(() => modal.classList.add('d-none'), 3000);
}

function mostrarError(mensaje) {
  const texto = modalError ? modalError.querySelector('.mensaje-error') : null;
  if (texto && mensaje) texto.textContent = mensaje;
  mostrarModal(modalError);
}

cargarPerfil();