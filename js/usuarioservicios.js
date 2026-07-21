// Función para guardar el servicio desde el panel de administración
async function guardarServicio(event) {
  if (event) event.preventDefault();

  // 1. Capturar elementos del formulario
  const nombreInput = document.getElementById('nombreServicio') || document.querySelector('input[placeholder*="Nombre"]');
  const detallesInput = document.getElementById('detallesServicio') || document.querySelector('textarea[placeholder*="Detalles"]');
  const descripcionInput = document.getElementById('descripcionServicio') || document.querySelector('textarea[placeholder*="descripción"]');
  const precioInput = document.getElementById('precioServicio') || document.querySelector('input[placeholder*="Precio"]');
  const imagenInput = document.getElementById('imagenServicio') || document.querySelector('input[type="file"]');

  // 2. Extraer y procesar el precio
  // Si en la casilla escribes "$350 / $280 / $200" o "350/280/200", los dividimos
  const textoPrecio = precioInput.value;
  const preciosEncontrados = textoPrecio.match(/\d+/g) || [];

  // Asignar precios según los valores encontrados (o un valor por defecto)
  const precioGrande = parseFloat(preciosEncontrados[0] || 350);
  const precioMediano = parseFloat(preciosEncontrados[1] || preciosEncontrados[0] || 280);
  const precioChico = parseFloat(preciosEncontrados[2] || preciosEncontrados[0] || 200);

  // 3. Crear el FormData con los nombres EXACTOS de campos que espera tu BD
  const formData = new FormData();
  formData.append('nombre', nombreInput.value.trim());
  formData.append('descripcion', descripcionInput.value.trim());
  
  // Guardamos el texto de detalles en 'titulo_corto' (como lo lee tu renderUserCatalog)
  formData.append('titulo_corto', detallesInput.value.trim()); 
  
  // Enviamos los 3 precios individuales que tu base de datos requiere
  formData.append('precio_grande', precioGrande);
  formData.append('precio_mediano', precioMediano);
  formData.append('precio_chico', precioChico);

  // Solo adjuntar si el usuario seleccionó una imagen
  if (imagenInput && imagenInput.files && imagenInput.files[0]) {
    formData.append('imagen', imagenInput.files[0]);
  }

  // 4. Enviar Petición al Backend
  try {
    const respuesta = await fetch(`${URL_BASE}/servicios`, {
      method: 'POST',
      body: formData // NOTA: No colocar 'Content-Type' header cuando se usa FormData
    });

    const data = await respuesta.json().catch(() => ({}));

    if (!respuesta.ok) {
      throw new Error(data.message || data.error || `Error ${respuesta.status}`);
    }

    alert('¡Servicio registrado con éxito!');
    location.reload();

  } catch (error) {
    console.error('Error al guardar servicio:', error);
    alert(`No se pudo guardar: ${error.message}`);
  }
}