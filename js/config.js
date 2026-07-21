// URLs base (definimos ambas para que no falle ninguna vista)
const API_BASE = 'https://pawcare.hopto.org/api';
const URL_BASE = 'https://pawcare.hopto.org/api';

// Función global helper para peticiones
async function apiFetch(endpoint, options = {}) {
    const defaultHeaders = {
        'Content-Type': 'application/json'
    };

    const token = localStorage.getItem('token');
    if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers
        }
    };

    // Usa API_BASE o URL_BASE
    const base = typeof API_BASE !== 'undefined' ? API_BASE : URL_BASE;
    const response = await fetch(`${base}${endpoint}`, config);
    return response;
}