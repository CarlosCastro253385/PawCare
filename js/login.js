const form = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const successModal = document.getElementById('successModal');
const errorModal = document.getElementById('errorModal');
const enterAppBtn = document.getElementById('enterAppBtn');
 
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
    const respuesta = await fetch(`${API_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, contrasena }),
    });
 
    const datos = await respuesta.json();
 
    if (!respuesta.ok || !datos.ok) {
      mostrarModal(errorModal);
      return;
    }
 
    // Guardamos los datos del usuario en sessionStorage para que otras
    // páginas (ganancias.html, usuarioreservaciones.html, etc.) sepan
    // quién inició sesión. Esto SÍ se sigue usando localStorage/sessionStorage
    // — no para simular la base de datos, sino para recordar la sesión
    // mientras navegas, que es su uso normal en cualquier sitio web.
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
 
[successModal, errorModal].forEach((modal) => {
  modal.addEventListener('click', (event) => {
    if (event.target === modal) ocultarModal(modal);
  });
});
 
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    ocultarModal(successModal);
    ocultarModal(errorModal);
  }
});