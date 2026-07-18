document.addEventListener("DOMContentLoaded", () => {
    
    // --- 1. INTERACTIVIDAD DEL CARRUSEL DE SERVICIOS ---
    const servicesContainer = document.querySelector('.services-container');
    const nextButton = document.querySelector('.carousel-next');
    
    if (nextButton && servicesContainer) {
        nextButton.addEventListener('click', () => {
            // Tomamos la primera tarjeta de servicio
            const firstCard = servicesContainer.querySelector('.service-card');
            if (firstCard) {
                // Al removerla e insertarla al final, logramos un efecto infinito básico
                servicesContainer.insertBefore(firstCard, nextButton);
            }
        });
    }

    // --- 2. INTERACTIVIDAD DE LA GALERÍA DE INSTALACIONES ---
    const mainGalleryImg = document.querySelector('.gallery-main img');
    const mainGalleryCaption = document.querySelector('.gallery-caption');
    const thumbnails = document.querySelectorAll('.gallery-thumbnails .thumb');

    // Mapeo de subtítulos para cada foto según el diseño de Figma
    const captions = {
        "foto5.png": "Área de Descanso",
        "foto6.png": "Zona de Juegos",
        "foto7.png": "Patio Principal",
        "foto8.png": "Alberca Canina",
        "foto9.png": "Estética"
    };

    thumbnails.forEach((thumb, index) => {
        thumb.addEventListener('click', () => {
            // Quitar clase activa a todas las miniaturas
            thumbnails.forEach(t => t.classList.remove('active'));
            // Agregar clase activa a la miniatura clickeada
            thumb.classList.add('active');

            // Obtener la imagen dentro de la miniatura
            const imgInsideThumb = thumb.querySelector('img');
            if (imgInsideThumb && mainGalleryImg) {
                const newSrc = imgInsideThumb.getAttribute('src');
                mainGalleryImg.setAttribute('src', newSrc);

                // Cambiar el texto descriptivo dinámicamente basándonos en el nombre del archivo
                const fileName = newSrc.split('/').pop();
                if (captions[fileName]) {
                    mainGalleryCaption.textContent = captions[fileName];
                } else {
                    mainGalleryCaption.textContent = `Instalación ${index + 1}`;
                }
            }
        });
    });
});