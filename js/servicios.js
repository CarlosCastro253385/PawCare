document.addEventListener('DOMContentLoaded', () => {
    const URL_BASE = window.URL_BASE || '/api';

    // 1. Convertir la imagen seleccionada a Base64
    function imagenABase64(file) {
        return new Promise((resolve, reject) => {
            if (!file) return resolve(null);
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
            reader.readAsDataURL(file);
        });
    }

    // 2. Función para Guardar / Crear Servicio
    async function guardarServicio(e) {
        if (e) e.preventDefault();

        // Obtener inputs de la pantalla
        const inputs = document.querySelectorAll('input, textarea');
        let nombre = "", titulo = "", descripcion = "", precioRaw = "";
        let archivoImagen = null;

        inputs.forEach(input => {
            const ph = (input.placeholder || "").toLowerCase();
            const type = input.type;

            if (type === 'file') {
                if (input.files && input.files[0]) archivoImagen = input.files[0];
            } else if (ph.includes('nombre')) {
                nombre = input.value.trim();
            } else if (ph.includes('detalle') || ph.includes('título') || ph.includes('titulo')) {
                titulo = input.value.trim();
            } else if (ph.includes('descripción') || ph.includes('descripcion')) {
                descripcion = input.value.trim();
            } else if (ph.includes('precio')) {
                precioRaw = input.value.trim();
            }
        });

        // Extraer los precios (Grande, Mediano, Pequeño)
        const numeros = precioRaw.match(/\d+/g) || [0];
        const pGrande = parseFloat(numeros[0] || 0);
        const pMediano = parseFloat(numeros[1] || numeros[0] || 0);
        const pPequeno = parseFloat(numeros[2] || numeros[0] || 0);

        try {
            // Convertir foto a Base64 si existe
            const fotoBase64 = await imagenABase64(archivoImagen);

            // Estructura EXACTA esperada por tu controlador Node.js
            const payload = {
                nombre: nombre,
                titulo: titulo,
                descripcion: descripcion,
                foto: fotoBase64,
                precio_grande: pGrande,
                precio_mediano: pMediano,
                precio_pequeno: pPequeno
            };

            // Petición HTTP POST enviando JSON
            const res = await fetch(`${URL_BASE}/servicios`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.mensaje || `Error ${res.status}`);
            }

            alert('¡Servicio registrado con éxito!');
            location.reload();

        } catch (err) {
            console.error('Error al guardar:', err);
            alert(`Error: ${err.message}`);
        }
    }

    // 3. Vincular botón de Aceptar / Procesar
    const botonesProcesar = document.querySelectorAll('button, .button-aceptar, #procesarBtn, .btn-primary');
    botonesProcesar.forEach(btn => {
        const texto = btn.innerText.toLowerCase();
        if (texto.includes('procesan') || texto.includes('aceptar') || texto.includes('guardar')) {
            btn.addEventListener('click', guardarServicio);
        }
    });
});