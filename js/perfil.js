const profileForm = document.getElementById('profile-form');
const btnEdit = document.getElementById('btn-edit');
const btnCancel = document.getElementById('btn-cancel');
const btnSave = document.getElementById('btn-save');
const inputs = profileForm.querySelectorAll('input');
const emailInput = document.getElementById('correo');
const phoneInput = document.getElementById('telefono');
const modalSuccess = document.getElementById('modal-success');
const modalError = document.getElementById('modal-error');
const profile = JSON.parse(sessionStorage.getItem('usuarioPerfil') || '{}');
const originalValues = new Map();

function setValue(id, value) {
  if (value) document.getElementById(id).value = value;
}

setValue('nombre', profile.nombre);
setValue('correo', profile.correo);
setValue('nombre-usuario', profile.usuario);
setValue('password', profile.contrasena);
setValue('telefono', profile.telefono);
setValue('direccion', profile.direccion);
if (profile.nombre) document.querySelector('.profile-header h2').textContent = profile.nombre;
if (profile.correo) document.querySelector('.profile-meta span:first-child').textContent = profile.correo;

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

profileForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value.trim());
  const phoneValid = /^\d{10}$/.test(phoneInput.value.replace(/\D/g, ''));
  emailInput.parentElement.classList.toggle('error', !emailValid);
  phoneInput.parentElement.classList.toggle('error', !phoneValid);
  if (!emailValid || !phoneValid) { showModal(modalError); return; }

  const updated = {
    ...profile, nombre: document.getElementById('nombre').value.trim(), correo: emailInput.value.trim(),
    usuario: document.getElementById('nombre-usuario').value.trim(), contrasena: document.getElementById('password').value,
    telefono: phoneInput.value.replace(/\D/g, ''), direccion: document.getElementById('direccion').value.trim()
  };
  sessionStorage.setItem('usuarioPerfil', JSON.stringify(updated));
  sessionStorage.setItem('usuarioNombre', updated.usuario);
  const usuarios = JSON.parse(localStorage.getItem('pawcareUsuarios') || '[]');
  const index = usuarios.findIndex((usuario) => usuario.usuario === profile.usuario);
  if (index !== -1) { usuarios[index] = updated; localStorage.setItem('pawcareUsuarios', JSON.stringify(usuarios)); }
  document.querySelector('.profile-header h2').textContent = updated.nombre || 'Usuario';
  document.querySelector('.profile-meta span:first-child').textContent = updated.correo;
  setEditing(false);
  showModal(modalSuccess);
});

function showModal(modal) {
  modal.classList.remove('d-none');
  setTimeout(() => modal.classList.add('d-none'), 3000);
}
