const API_BASE = 'https://pawcare-api-2026.loca.lt/api';

const originalFetch = window.fetch;
window.fetch = async function(...args) {
    let [resource, config] = args;
    config = config || {};
    config.headers = {
        ...config.headers,
        'Bypass-Tunnel-Remainder': 'true'
    };
    return originalFetch(resource, config);
};