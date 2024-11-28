const Database = require('better-sqlite3');
const path = require('path');

// Initialize the SQLite database
const dbPath = path.join(__dirname, '../databases/verificationConfig.db');
const db = new Database(dbPath);

// Create the `config` table if it doesn't exist
db.exec(`
    CREATE TABLE IF NOT EXISTS config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL
    );
`);

// Function to get a value from the database
function getConfig(key) {
    const stmt = db.prepare('SELECT value FROM config WHERE key = ?');
    const row = stmt.get(key);
    return row ? JSON.parse(row.value) : null;
}

// Function to set a value in the database
function setConfig(key, value) {
    const stmt = db.prepare(`
        INSERT INTO config (key, value) VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);
    stmt.run(key, JSON.stringify(value));
}

// Export functions
module.exports = {
    getConfig,
    setConfig,
    db,
};