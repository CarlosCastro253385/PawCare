const form = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const successModal = document.getElementById('successModal');
const errorModal = document.getElementById('errorModal');
const enterAppBtn = document.getElementById('enterAppBtn');

const usuariosValidos = [
  {
    rol: 'administrador',
    usuario: 'carlos',
    contrasena: 'pr123',
    destino: 'ganancias.html'
  },
  {
    rol: 'usuario',
    usuario: 'valeria',
    contrasena: 'tnt123',
    destino: 'usuarioreservaciones.html'
  }
];

[usernameInput, passwordInput].forEach((input) => {
  input.addEventListener('blur', () => {
    input.classList.add('touched');
  });
});

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const usuario = usernameInput.value.trim();
  const contrasena = passwordInput.value.trim();

  usernameInput.classList.add('touched');
  passwordInput.classList.add('touched');

  if (!usuario || !contrasena) {
    mostrarModal(errorModal);
    return;
  }

  const usuariosRegistrados = JSON.parse(localStorage.getItem('pawcareUsuarios') || '[]');
  const credencialValida = [...usuariosValidos, ...usuariosRegistrados].find(
    (credencial) =>
      credencial.usuario === usuario && credencial.contrasena === contrasena
  );

  if (credencialValida) {
    enterAppBtn.href = credencialValida.destino || 'usuarioreservaciones.html';
    enterAppBtn.textContent = `Entrar como ${credencialValida.rol}`;
    sessionStorage.setItem('usuarioRol', credencialValida.rol);
    sessionStorage.setItem('usuarioNombre', credencialValida.usuario);
    sessionStorage.setItem('usuarioPerfil', JSON.stringify(credencialValida));
    mostrarModal(successModal);
  } else {
    mostrarModal(errorModal);
  }
});

function mostrarModal(modal) {
  modal.classList.add('active');
}

function ocultarModal(modal) {
  modal.classList.remove('active');
}

[successModal, errorModal].forEach((modal) => {
  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      ocultarModal(modal);
    }
  });
});

const retryBtn = document.getElementById('retryBtn');
retryBtn.addEventListener('click', () => {
  ocultarModal(errorModal);
  usernameInput.value = '';
  passwordInput.value = '';
  usernameInput.classList.remove('touched');
  passwordInput.classList.remove('touched');
  usernameInput.focus();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    ocultarModal(successModal);
    ocultarModal(errorModal);
  }
});
