const {
    CLOUDFLARE_ACCOUNT_ID,
    CLOUDFLARE_API_TOKEN,
} = process.env;

const D1_DB_ID = process.env.D1_DB_ID || 'aa291e37-c4b8-4e19-9b2d-76d4c5fe35c4';

export async function d1Query(sql, params = []) {
    const res = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/d1/database/${D1_DB_ID}/query`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sql, params }),
        }
    );
    const data = await res.json();
    if (!data.success) throw new Error(`D1: ${JSON.stringify(data.errors)}`);
    return data.result[0];
}

export async function initDB() {
    await d1Query(`CREATE TABLE IF NOT EXISTS clips (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        r2_key TEXT,
        device TEXT NOT NULL,
        created_at INTEGER NOT NULL
    )`);
    await d1Query(`CREATE TABLE IF NOT EXISTS devices (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        device_type TEXT NOT NULL,
        last_seen INTEGER NOT NULL,
        created_at INTEGER NOT NULL
    )`);

    // Migrate existing tables
    try { await d1Query(`ALTER TABLE clips ADD COLUMN room TEXT DEFAULT 'default'`); } catch(e) {}
    try { await d1Query(`ALTER TABLE devices ADD COLUMN room TEXT DEFAULT 'default'`); } catch(e) {}

    console.log('✅ D1 tables ready');
}
