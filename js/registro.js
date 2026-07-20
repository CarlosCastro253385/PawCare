// js/registro.js
// Ahora este archivo crea la cuenta en tu base de datos real (vía tu API)
// en vez de guardarla en localStorage.

const API_URL = 'http://107.22.53.32:8080'; // misma URL que en login.js

const registerForm = document.getElementById('registerForm');
const formMessage = document.getElementById('formMessage');

function showMessage(message, isError = true) {
  formMessage.hidden = false;
  formMessage.textContent = message;
  formMessage.style.color = isError ? '#b42318' : '#176b3a';
}

registerForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(registerForm).entries());
  const telefono = data.telefono.replace(/\D/g, '');

  // ---------- Las mismas validaciones de antes, se quedan igual ----------
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

  // ---------- Aquí es donde antes se guardaba en localStorage ----------
  // Ahora se lo mandamos a la API real:
  try {
    const respuesta = await fetch(`${API_URL}/api/registro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: data.nombre.trim(),
        usuario: data.usuario.trim(),
        correo: data.correo.trim(),
        contrasena: data.contrasena,
        telefono,
        direccion: '', // tu formulario actual no pide dirección; se puede agregar luego en el perfil
      }),
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok || !resultado.ok) {
      // El endpoint regresa 409 si el usuario o correo ya existen
      showMessage(resultado.mensaje || 'No se pudo crear la cuenta.');
      return;
    }

    showMessage('Cuenta creada correctamente. Redirigiendo al inicio de sesión…', false);
    setTimeout(() => { window.location.href = 'login.html'; }, 1100);
  } catch (error) {
    console.error('Error al conectar con la API:', error);
    showMessage('No se pudo conectar con el servidor. Intenta de nuevo.');
  }
});