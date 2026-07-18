export const rooms = new Map();

export function addClient(room, controller) {
    if (!rooms.has(room)) rooms.set(room, new Set());
    rooms.get(room).add(controller);
}

export function removeClient(room, controller) {
    if (rooms.has(room)) {
        rooms.get(room).delete(controller);
        if (rooms.get(room).size === 0) rooms.delete(room);
    }
}

export function broadcast(room, payload) {
    if (!rooms.has(room)) return;
    const msg = `data: ${JSON.stringify(payload)}\n\n`;
    for (const controller of rooms.get(room)) {
        try { controller.enqueue(new TextEncoder().encode(msg)); } catch {}
    }
}
