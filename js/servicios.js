document.addEventListener('DOMContentLoaded', () => {
    const URL_BASE = window.URL_BASE || '/api';

    // -------------------------------------------------------------------
    // 1. ELEMENTOS DEL DOM
    // -------------------------------------------------------------------
    const btnSave = document.getElementById('btn-save');
    const inputName = document.getElementById('service-name');
    const inputTitle = document.getElementById('service-title');
    const inputDesc = document.getElementById('service-desc');
    const inputPrice = document.getElementById('service-price');
    const inputFileInput = document.getElementById('file-input');
    const successModal = document.getElementById('success-modal');

    // -------------------------------------------------------------------
    // 2. FUNCIÓN PARA CONVERTIR IMAGEN A BASE64
    // -------------------------------------------------------------------
    function imagenABase64(file) {
        return new Promise((resolve, reject) => {
            if (!file) return resolve(null);
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
            reader.readAsDataURL(file);
        });
    }

    // -------------------------------------------------------------------
    // 3. FUNCIÓN DE GUARDAR / CREAR SERVICIO
    // -------------------------------------------------------------------
    async function guardarServicio(e) {
        if (e) e.preventDefault();

        // Extraer valores del HTML
        const nombre = inputName ? inputName.value.trim() : "";
        const titulo = inputTitle ? inputTitle.value.trim() : "";
        const descripcion = inputDesc ? inputDesc.value.trim() : "";
        const precioRaw = inputPrice ? inputPrice.value.trim() : "";
        const archivoImagen = (inputFileInput && inputFileInput.files) ? inputFileInput.files[0] : null;

        // Validaciones básicas antes de enviar
        if (!nombre || !titulo) {
            alert('Por favor, completa los campos obligatorios: Nombre y Detalles.');
            return;
        }

        // Parsear precios desde el input
        const numeros = precioRaw.match(/\d+/g) || [0];
        const pGrande = parseFloat(numeros[0] || 0);
        const pMediano = parseFloat(numeros[1] || numeros[0] || 0);
        const pPequeno = parseFloat(numeros[2] || numeros[0] || 0);

        try {
            // Deshabilitar botón temporalmente
            if (btnSave) {
                btnSave.disabled = true;
                btnSave.innerText = "Procesando...";
            }

            // Convertir foto a Base64
            const fotoBase64 = await imagenABase64(archivoImagen);

            // Payload exacto según tu controlador de Node.js
            const payload = {
                nombre: nombre,
                titulo: titulo,
                descripcion: descripcion,
                foto: fotoBase64,
                precio_grande: pGrande,
                precio_mediano: pMediano,
                precio_pequeno: pPequeno
            };

            // Petición POST enviando JSON
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

            // Mostrar modal de éxito si existe en el HTML
            if (successModal) {
                successModal.classList.remove('hidden');
                setTimeout(() => {
                    location.reload();
                }, 1500);
            } else {
                alert('¡Servicio registrado con éxito!');
                location.reload();
            }

        } catch (err) {
            console.error('Error al guardar:', err);
            alert(`Error del servidor: ${err.message}`);
        } finally {
            if (btnSave) {
                btnSave.disabled = false;
                btnSave.innerText = "Aceptar";
            }
        }
    }

    // -------------------------------------------------------------------
    // 4. VINCULAR EVENTO AL BOTÓN Y ENTRADAS DE FOTO
    // -------------------------------------------------------------------
    if (btnSave) {
        btnSave.addEventListener('click', guardarServicio);
    }

    // Abrir selector de archivos al hacer clic en el área de imagen
    const dropzone = document.getElementById('image-dropzone');
    if (dropzone && inputFileInput) {
        dropzone.addEventListener('click', () => inputFileInput.click());
        
        // Mostrar vista previa al seleccionar imagen
        inputFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            const preview = document.getElementById('form-preview');
            const icon = document.getElementById('upload-icon');
            if (file && preview) {
                preview.src = URL.createObjectURL(file);
                preview.classList.remove('hidden');
                if (icon) icon.classList.add('hidden');
            }
        });
    }
});