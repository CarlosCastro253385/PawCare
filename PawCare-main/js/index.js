document.addEventListener("DOMContentLoaded", () => {
    const servicesContainer = document.querySelector('.services-container');
    const nextButton = document.querySelector('.carousel-next');
    
    if (nextButton && servicesContainer) {
        nextButton.addEventListener('click', () => {
            const firstCard = servicesContainer.querySelector('.service-card');
            if (firstCard) {
                servicesContainer.insertBefore(firstCard, nextButton);
            }
        });
    }

    const mainGalleryImg = document.querySelector('.gallery-main img');
    const mainGalleryCaption = document.querySelector('.gallery-caption');
    const thumbnails = document.querySelectorAll('.gallery-thumbnails .thumb');

    // 👇 AQUÍ ESTÁ EL CAMBIO: Usamos los nombres reales de tus archivos HTML
    const captions = {
        "instalaciones-1.png": "Área de Descanso",
        "instalaciones-2.png": "Zona de Juegos",
        "instalaciones-3.png": "Patio Principal",
        "instalaciones-4.png": "Alberca Canina",
        "instalaciones-5.png": "Área de Estética"
    };

    thumbnails.forEach((thumb, index) => {
        thumb.addEventListener('click', () => {
            thumbnails.forEach(t => t.classList.remove('active'));
            thumb.classList.add('active');

            const imgInsideThumb = thumb.querySelector('img');
            if (imgInsideThumb && mainGalleryImg) {
                const newSrc = imgInsideThumb.getAttribute('src');
                mainGalleryImg.setAttribute('src', newSrc);

                const fileName = newSrc.split('/').pop();
                if (captions[fileName]) {
                    mainGalleryCaption.textContent = captions[fileName];
                } else {
                    mainGalleryCaption.textContent = `PawCare - Área ${index + 1}`;
                }
            }
        });
    });
});