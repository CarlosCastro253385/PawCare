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

    const captions = {
        "foto5.png": "Área de Descanso",
        "foto6.png": "Zona de Juegos",
        "foto7.png": "Patio Principal",
        "foto8.png": "Alberca Canina",
        "foto9.png": "Estética"
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
                    mainGalleryCaption.textContent = `Instalación ${index + 1}`;
                }
            }
        });
    });
});