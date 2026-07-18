// Bypass Vite proxy in development to avoid Server-Sent Events buffering issues!
export const API_BASE = import.meta.env.DEV ? `http://${window.location.hostname}:8001` : (import.meta.env.VITE_API_URL || '');

export async function apiFetch(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    
    options.headers = {
        ...options.headers,
        'X-Room-ID': localStorage.getItem('clipoo_room') || 'default'
    };
    
    const res = await fetch(url, options);
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return res.json();
}
