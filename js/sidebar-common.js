document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.sidebar').forEach((sidebar) => {
    const toggle = sidebar.querySelector('.sidebar-toggle');
    if (!toggle) return;

    toggle.setAttribute('aria-expanded', String(!sidebar.classList.contains('collapsed')));
    toggle.addEventListener('click', () => {
      const collapsed = sidebar.classList.toggle('collapsed');
      toggle.setAttribute('aria-expanded', String(!collapsed));
    });
  });
});
