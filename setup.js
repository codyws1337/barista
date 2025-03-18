const sqlite3 = require('better-sqlite3');
const db = new sqlite3('server_memory.db');

// Create tables if they don’t exist
db.exec(`
    CREATE TABLE IF NOT EXISTS adminMemory (
        keyword TEXT PRIMARY KEY,
        response TEXT
    );

    CREATE TABLE IF NOT EXISTS knowledge (
        topic TEXT,
        question TEXT PRIMARY KEY,
        answer TEXT
    );

    CREATE TABLE IF NOT EXISTS memory (
        userInput TEXT PRIMARY KEY,
        botResponse TEXT
    );
`);

console.log("Database tables created (if they didn’t already exist).");
db.close();