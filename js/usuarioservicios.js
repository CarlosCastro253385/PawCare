document.addEventListener('DOMContentLoaded', () => {
    const formServicio = document.querySelector('form') || document;
    const btnAceptar = document.querySelector('.button-aceptar') || document.querySelector('button[type="submit"]') || document.getElementById('procesarBtn');

    // Función para procesar y enviar el formulario
    async function guardarServicio(e) {
        if (e) e.preventDefault();

        // Obtener inputs por sus ubicaciones/placeholders
        const inputs = document.querySelectorAll('input, textarea');
        let nombre = "", detalles = "", descripcion = "", precioRaw = "";
        let archivoImagen = null;

        // Búsqueda inteligente de inputs en la pantalla
        inputs.forEach(input => {
            const ph = (input.placeholder || "").toLowerCase();
            const type = input.type;

            if (type === 'file') {
                if (input.files && input.files[0]) archivoImagen = input.files[0];
            } else if (ph.includes('nombre')) {
                nombre = input.value.trim();
            } else if (ph.includes('detalle')) {
                detalles = input.value.trim();
            } else if (ph.includes('descripción') || ph.includes('descripcion')) {
                descripcion = input.value.trim();
            } else if (ph.includes('precio')) {
                precioRaw = input.value.trim();
            }
        });

        // Extraer números para los precios
        const numeros = precioRaw.match(/\d+/g) || [250];
        const pGrande = parseFloat(numeros[0] || 250);
        const pMediano = parseFloat(numeros[1] || numeros[0] || 200);
        const pChico = parseFloat(numeros[2] || numeros[0] || 150);

        // Armar el FormData
        const formData = new FormData();
        formData.append('nombre', nombre);
        formData.append('descripcion', descripcion);
        formData.append('titulo_corto', detalles);
        formData.append('precio_grande', pGrande);
        formData.append('precio_mediano', pMediano);
        formData.append('precio_chico', pChico);
        formData.append('precio', pGrande); // Por si el backend busca 'precio' genérico

        if (archivoImagen) {
            formData.append('imagen', archivoImagen);
        }

        try {
            // NOTA CLAVE: Al enviar FormData, NO se pone header 'Content-Type'
            const res = await fetch(`${URL_BASE}/servicios`, {
                method: 'POST',
                body: formData
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                // Muestra la razón EXACTA enviada por el backend
                const errorMsg = data.message || data.error || JSON.stringify(data) || `Error ${res.status}`;
                throw new Error(errorMsg);
            }

            alert('¡Servicio guardado con éxito!');
            location.reload();

        } catch (err) {
            console.error('Error detallado:', err);
            alert(`Error del servidor (400): ${err.message}`);
        }
    }

    // Evento al presionar el botón de Aceptar/Procesar
    const aceptarBtn = document.getElementById('aceptarBtn') || document.querySelector('.btn-primary') || document.querySelector('button');
    if (aceptarBtn) {
        aceptarBtn.addEventListener('click', guardarServicio);
    }
});