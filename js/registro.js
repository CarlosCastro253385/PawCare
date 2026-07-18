const registerForm = document.getElementById('registerForm');
const formMessage = document.getElementById('formMessage');

function showMessage(message, isError = true) {
  formMessage.hidden = false;
  formMessage.textContent = message;
  formMessage.style.color = isError ? '#b42318' : '#176b3a';
}

registerForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(registerForm).entries());
  const telefono = data.telefono.replace(/\D/g, '');
  const usuarios = JSON.parse(localStorage.getItem('pawcareUsuarios') || '[]');

  if (Object.values(data).some((value) => !value.trim()) || telefono.length !== 10) {
    showMessage('Completa todos los campos y escribe un teléfono de 10 dígitos.');
    return;
  }
  if (data.contrasena.length < 6) {
    showMessage('La contraseña debe tener al menos 6 caracteres.');
    return;
  }
  if (data.contrasena !== data.confirmacion) {
    showMessage('Las contraseñas no coinciden.');
    return;
  }
  if (usuarios.some((usuario) => usuario.usuario.toLowerCase() === data.usuario.trim().toLowerCase())) {
    showMessage('Ese nombre de usuario ya está registrado.');
    return;
  }

  usuarios.push({
    rol: 'usuario', usuario: data.usuario.trim(), contrasena: data.contrasena, destino: 'usuarioreservaciones.html',
    nombre: data.nombre.trim(), correo: data.correo.trim(), telefono, direccion: ''
  });
  localStorage.setItem('pawcareUsuarios', JSON.stringify(usuarios));
  showMessage('Cuenta creada correctamente. Redirigiendo al inicio de sesión…', false);
  setTimeout(() => { window.location.href = 'login.html'; }, 1100);
});
