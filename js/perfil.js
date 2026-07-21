const profileForm = document.getElementById('profile-form');
const btnEdit = document.getElementById('btn-edit');
const btnCancel = document.getElementById('btn-cancel');
const btnSave = document.getElementById('btn-save');
const inputs = profileForm ? profileForm.querySelectorAll('input') : [];
const emailInput = document.getElementById('correo');
const phoneInput = document.getElementById('telefono');
const modalSuccess = document.getElementById('modal-success');
const modalError = document.getElementById('modal-error');

let profile = {};
const originalValues = new Map();

const sesionPerfil = JSON.parse(sessionStorage.getItem('usuarioActual') || '{}');

function setValue(id, value) {
  const el = document.getElementById(id);
  if (el && value) el.value = value;
}

function pintarPerfil(data) {
  profile = data || {};
  setValue('nombre', profile.nombre);
  setValue('correo', profile.correo);
  setValue('nombre-usuario', profile.usuario);
  setValue('telefono', profile.telefono);
  setValue('direccion', profile.direccion);

  const headerName = document.querySelector('.profile-header h2');
  const headerEmail = document.querySelector('.profile-meta span:first-child');
  if (headerName && profile.nombre) headerName.textContent = profile.nombre;
  if (headerEmail && profile.correo) headerEmail.textContent = profile.correo;
}

async function cargarPerfil() {
  if (!sesionPerfil.id_usuario) {
    mostrarErrorPerfil('No hay sesión activa. Vuelve a iniciar sesión.');
    return;
  }
  try {
    const respuesta = await fetch(`${API_BASE}/perfil/${sesionPerfil.id_usuario}`);
    const datos = await respuesta.json();
    pintarPerfil(datos.perfil);
  } catch (err) {
    console.error('No se pudo cargar el perfil:', err.message);
    mostrarErrorPerfil('No se pudo cargar tu perfil. Intenta recargar la página.');
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
    inputs.forEach((input) => { input.value = originalValues.get(input.id) || ''; if (input.parentElement) input.parentElement.classList.remove('error'); });
    setEditing(false);
  });
}

if (profileForm) {
  profileForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value.trim());
    const phoneValid = /^\d{10}$/.test(phoneInput.value.replace(/\D/g, ''));

    if (emailInput.parentElement) emailInput.parentElement.classList.toggle('error', !emailValid);
    if (phoneInput.parentElement) phoneInput.parentElement.classList.toggle('error', !phoneValid);

    if (!emailValid || !phoneValid) { mostrarErrorPerfil('Revisa el correo y el teléfono, tienen un formato inválido.'); return; }

    const nuevaContrasena = document.getElementById('password') ? document.getElementById('password').value : '';

    const cuerpo = {
      nombre: document.getElementById('nombre').value.trim(),
      correo: emailInput.value.trim(),
      telefono: phoneInput.value.replace(/\D/g, ''),
      direccion: document.getElementById('direccion') ? document.getElementById('direccion').value.trim() : ''
    };
    if (nuevaContrasena) cuerpo.contrasena = nuevaContrasena;

    if (btnSave) { btnSave.disabled = true; }

    try {
      const resp = await fetch(`${API_BASE}/perfil/${sesionPerfil.id_usuario}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cuerpo)
      });
      const resData = await resp.json();

      if (!resp.ok) throw new Error(resData.mensaje || 'Error al actualizar perfil');

      pintarPerfil({ ...profile, ...cuerpo });
      setEditing(false);
      mostrarModalPerfil(modalSuccess);
    } catch (err) {
      mostrarErrorPerfil(err.message || 'No se pudo guardar tu perfil. Intenta de nuevo.');
    } finally {
      if (btnSave) { btnSave.disabled = false; }
    }
  });
}

function mostrarModalPerfil(modal) {
  if (!modal) return;
  modal.classList.remove('d-none');
  setTimeout(() => modal.classList.add('d-none'), 3000);
}

function mostrarErrorPerfil(mensaje) {
  const texto = modalError ? modalError.querySelector('.mensaje-error') : null;
  if (texto && mensaje) texto.textContent = mensaje;
  mostrarModalPerfil(modalError);
}

cargarPerfil();