const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'agritech.db');

// Ensure data directory exists
const fs = require('fs');
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

/**
 * Compatibility layer: mimics pg's query interface using better-sqlite3.
 * Converts $1, $2, ... parameterized queries to ? placeholders.
 */
function query(text, params = []) {
  // Convert PostgreSQL-style $1, $2 placeholders to SQLite ? placeholders
  let convertedText = text;
  const paramMap = [];

  if (params.length > 0) {
    // Find all $N references and build ordered param list
    const refs = [];
    convertedText = text.replace(/\$(\d+)/g, (match, num) => {
      refs.push(parseInt(num, 10));
      return '?';
    });
    // Map params in order of appearance
    for (const ref of refs) {
      paramMap.push(params[ref - 1]);
    }
  }

  // Convert PostgreSQL-specific syntax to SQLite
  convertedText = convertedText
    .replace(/\bRETURNING\s+\*/gi, '')
    .replace(/\bON\s+CONFLICT\s*\(([^)]+)\)\s*DO\s+UPDATE\s+SET\s+/gi, 'ON CONFLICT($1) DO UPDATE SET ')
    .replace(/\bNOW\(\)/gi, "datetime('now')")
    .replace(/\bSERIAL/gi, 'INTEGER')
    .replace(/\bJSONB/gi, 'TEXT')
    .replace(/\bNUMERIC\([^)]*\)/gi, 'REAL')
    .replace(/\bVARCHAR\([^)]*\)/gi, 'TEXT')
    .replace(/\bVARCHAR/gi, 'TEXT')
    .replace(/\bTIMESTAMP/gi, 'TEXT')
    .replace(/\bBOOLEAN/gi, 'INTEGER')
    .replace(/\btrue\b/gi, '1')
    .replace(/\bfalse\b/gi, '0');

  const trimmed = convertedText.trim();
  const isSelect = /^\s*(SELECT|WITH)\b/i.test(trimmed);
  const isInsert = /^\s*INSERT\b/i.test(trimmed);
  const isUpdate = /^\s*UPDATE\b/i.test(trimmed);
  const isDelete = /^\s*DELETE\b/i.test(trimmed);

  try {
    if (isSelect) {
      const rows = db.prepare(trimmed).all(...paramMap);
      return { rows };
    } else if (isInsert) {
      const info = db.prepare(trimmed).run(...paramMap);
      const tableMatch = trimmed.match(/INSERT\s+INTO\s+(\w+)/i);
      if (tableMatch) {
        // For upsert (ON CONFLICT), lastInsertRowid may be 0 on update path
        // Try to fetch the row using the conflict columns
        const conflictMatch = trimmed.match(/ON\s+CONFLICT\s*\(([^)]+)\)/i);
        if (conflictMatch && info.changes > 0) {
          const conflictCols = conflictMatch[1].split(',').map(c => c.trim());
          // Extract the values for conflict columns from the VALUES clause
          const valuesMatch = trimmed.match(/VALUES\s*\(([^)]+)\)/i);
          if (valuesMatch) {
            const valuePlaceholders = valuesMatch[1].split(',').map(v => v.trim());
            const insertColsMatch = trimmed.match(/\(([^)]+)\)\s*VALUES/i);
            if (insertColsMatch) {
              const insertCols = insertColsMatch[1].split(',').map(c => c.trim());
              const whereClause = conflictCols.map(col => {
                const idx = insertCols.indexOf(col);
                return `${col} = ?`;
              }).join(' AND ');
              const whereParams = conflictCols.map(col => {
                const idx = insertCols.indexOf(col);
                return idx >= 0 ? paramMap[idx] : null;
              });
              try {
                const rows = db.prepare(`SELECT * FROM ${tableMatch[1]} WHERE ${whereClause}`).all(...whereParams);
                return { rows, rowCount: info.changes };
              } catch { /* fallback below */ }
            }
          }
        }
        if (info.lastInsertRowid) {
          const rows = db.prepare(`SELECT * FROM ${tableMatch[1]} WHERE id = ?`).all(info.lastInsertRowid);
          return { rows, rowCount: info.changes };
        }
      }
      return { rows: [], rowCount: info.changes };
    } else if (isUpdate) {
      const info = db.prepare(trimmed).run(...paramMap);
      // Try to return updated row(s) by extracting table and WHERE clause
      const tableMatch = trimmed.match(/UPDATE\s+(\w+)\s+SET/i);
      const whereMatch = trimmed.match(/WHERE\s+(.+)$/i);
      if (tableMatch && whereMatch && info.changes > 0) {
        try {
          const selectSql = `SELECT * FROM ${tableMatch[1]} WHERE ${whereMatch[1]}`;
          const rows = db.prepare(selectSql).all(...paramMap.slice(-countPlaceholders(whereMatch[1])));
          return { rows, rowCount: info.changes };
        } catch { /* fallback */ }
      }
      return { rows: [], rowCount: info.changes };
    } else if (isDelete) {
      const info = db.prepare(trimmed).run(...paramMap);
      return { rows: [], rowCount: info.changes };
    } else {
      // DDL or other statements
      db.exec(trimmed);
      return { rows: [], rowCount: 0 };
    }
  } catch (err) {
    // Map SQLite error codes to PostgreSQL-like codes
    if (err.message.includes('UNIQUE constraint failed')) {
      const pgErr = new Error(err.message);
      pgErr.code = '23505';
      throw pgErr;
    }
    throw err;
  }
}

/**
 * Execute raw SQL (for schema setup, etc.)
 */
function exec(sql) {
  return db.exec(sql);
}

/**
 * Get the raw database instance for advanced operations
 */
function getDb() {
  return db;
}

function countPlaceholders(str) {
  return (str.match(/\?/g) || []).length;
}

module.exports = { query, exec, getDb, db };
