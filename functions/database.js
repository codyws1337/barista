const Database = require('better-sqlite3');
const db = new Database('server_memory.db');

// Create tables if they don’t exist
db.prepare(`
    CREATE TABLE IF NOT EXISTS memory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_input TEXT,
        bot_response TEXT
    )
`).run();

db.prepare(`
    CREATE TABLE IF NOT EXISTS knowledge (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        intent TEXT UNIQUE,
        response TEXT
    )
`).run();

// Save admin knowledge with intent
function saveKnowledge(intent, response) {
    db.prepare(`INSERT OR REPLACE INTO knowledge (intent, response) VALUES (?, ?)`)
      .run(intent, response);
}

// Retrieve knowledge based on intent
function getKnowledge(intent) {
    const row = db.prepare(`SELECT response FROM knowledge WHERE intent = ?`).get(intent);
    return row ? row.response : null;
}

module.exports = { saveKnowledge, getKnowledge };
