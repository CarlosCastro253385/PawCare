document.addEventListener('DOMContentLoaded', () => {
    const sidebars = document.querySelectorAll('.sidebar');

    sidebars.forEach((sidebar) => {
        const toggle = sidebar.querySelector('.sidebar-toggle');
        if (!toggle) return;

        // Configuración inicial de accesibilidad
        const isCollapsed = sidebar.classList.contains('collapsed');
        toggle.setAttribute('aria-expanded', String(!isCollapsed));

        // Evento de clic para abrir / cerrar
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const collapsed = sidebar.classList.toggle('collapsed');
            toggle.setAttribute('aria-expanded', String(!collapsed));
        });
    });
});