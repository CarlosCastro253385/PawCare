const form = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const successModal = document.getElementById('successModal');
const errorModal = document.getElementById('errorModal');
const enterAppBtn = document.getElementById('enterAppBtn');
const retryBtn = document.getElementById('retryBtn'); // 👈 Se agregó la referencia al botón

[usernameInput, passwordInput].forEach((input) => {
  input.addEventListener('blur', () => input.classList.add('touched'));
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const usuario = usernameInput.value.trim();
  const contrasena = passwordInput.value.trim();

  usernameInput.classList.add('touched');
  passwordInput.classList.add('touched');

  if (!usuario || !contrasena) {
    mostrarModal(errorModal);
    return;
  }

  try {
    // 💡 CORRECCIÓN: Se usa API_BASE en lugar de API_URL
    const respuesta = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, contrasena }),
    });

    const datos = await respuesta.json();

    if (!respuesta.ok || !datos.ok) {
      mostrarModal(errorModal);
      return;
    }

    // Guardar datos de sesión
    sessionStorage.setItem('usuarioActual', JSON.stringify(datos.usuario));

    enterAppBtn.textContent = `Entrar como ${datos.usuario.rol}`;
    enterAppBtn.href = datos.usuario.rol === 'administrador' ? 'ganancias.html' : 'usuarioreservaciones.html';

    mostrarModal(successModal);
  } catch (error) {
    console.error('Error al conectar con la API:', error);
    mostrarModal(errorModal);
  }
});

function mostrarModal(modal) {
  modal.classList.add('active');
}

function ocultarModal(modal) {
  modal.classList.remove('active');
}

// 💡 CORRECCIÓN: Evento para que el botón "Reintentar" cierre el modal y seleccione el input
if (retryBtn) {
  retryBtn.addEventListener('click', () => {
    ocultarModal(errorModal);
    passwordInput.value = ''; // Limpia la contraseña
    passwordInput.focus();   // Pone el cursor directo para escribir de nuevo
  });
}

// Cerrar modales al hacer clic fuera
[successModal, errorModal].forEach((modal) => {
  modal.addEventListener('click', (event) => {
    if (event.target === modal) ocultarModal(modal);
  });
});

// Cerrar modales con tecla Escape
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    ocultarModal(successModal);
    ocultarModal(errorModal);
  }
});