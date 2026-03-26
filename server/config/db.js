const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const isVercel = !!process.env.VERCEL;
const DB_PATH = process.env.DB_PATH
  || (isVercel ? '/tmp/agritech.db' : path.join(__dirname, '..', 'data', 'agritech.db'));

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// sql.js requires async init — we cache the DB instance
let db = null;
let dbReady = null;

function getDbPromise() {
  if (dbReady) return dbReady;
  dbReady = (async () => {
    const SQL = await initSqlJs();

    // On Vercel cold start, run setupDb if no file exists
    if (isVercel && !fs.existsSync(DB_PATH)) {
      console.log('Vercel cold start: initializing database in /tmp...');
      const setupDatabase = require('../scripts/setupDb');
      await setupDatabase();
    }

    if (fs.existsSync(DB_PATH)) {
      const buffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(buffer);
    } else {
      db = new SQL.Database();
    }
    db.run('PRAGMA foreign_keys = ON');
    return db;
  })();
  return dbReady;
}

// Auto-save to disk after writes
function saveDb() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

/**
 * Convert sql.js result to row objects
 */
function resultToRows(result) {
  if (!result || result.length === 0) return [];
  const stmt = result[0];
  return stmt.values.map(row => {
    const obj = {};
    stmt.columns.forEach((col, i) => { obj[col] = row[i]; });
    return obj;
  });
}

/**
 * Compatibility layer: mimics pg's query interface using sql.js.
 * Converts $1, $2, ... parameterized queries to ? placeholders.
 */
async function query(text, params = []) {
  await getDbPromise();

  let convertedText = text;
  const paramMap = [];

  if (params.length > 0) {
    const refs = [];
    convertedText = text.replace(/\$(\d+)/g, (match, num) => {
      refs.push(parseInt(num, 10));
      return '?';
    });
    for (const ref of refs) {
      paramMap.push(params[ref - 1] === undefined ? null : params[ref - 1]);
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
      const result = db.exec(trimmed, paramMap);
      return { rows: resultToRows(result) };
    } else if (isInsert) {
      db.run(trimmed, paramMap);
      const changes = db.getRowsModified();
      const tableMatch = trimmed.match(/INSERT\s+INTO\s+(\w+)/i);

      // Try to return the inserted/upserted row
      if (tableMatch) {
        const conflictMatch = trimmed.match(/ON\s+CONFLICT\s*\(([^)]+)\)/i);
        if (conflictMatch && changes > 0) {
          const conflictCols = conflictMatch[1].split(',').map(c => c.trim());
          const insertColsMatch = trimmed.match(/\(([^)]+)\)\s*VALUES/i);
          if (insertColsMatch) {
            const insertCols = insertColsMatch[1].split(',').map(c => c.trim());
            const whereClause = conflictCols.map(col => `${col} = ?`).join(' AND ');
            const whereParams = conflictCols.map(col => {
              const idx = insertCols.indexOf(col);
              return idx >= 0 ? paramMap[idx] : null;
            });
            try {
              const result = db.exec(`SELECT * FROM ${tableMatch[1]} WHERE ${whereClause}`, whereParams);
              saveDb();
              return { rows: resultToRows(result), rowCount: changes };
            } catch { /* fallback */ }
          }
        }

        // Get last inserted row
        const lastId = db.exec('SELECT last_insert_rowid() as id');
        const id = resultToRows(lastId)[0]?.id;
        if (id) {
          const result = db.exec(`SELECT * FROM ${tableMatch[1]} WHERE id = ?`, [id]);
          saveDb();
          return { rows: resultToRows(result), rowCount: changes };
        }
      }

      saveDb();
      return { rows: [], rowCount: changes };
    } else if (isUpdate) {
      db.run(trimmed, paramMap);
      const changes = db.getRowsModified();
      saveDb();
      return { rows: [], rowCount: changes };
    } else if (isDelete) {
      db.run(trimmed, paramMap);
      const changes = db.getRowsModified();
      saveDb();
      return { rows: [], rowCount: changes };
    } else {
      db.run(trimmed, paramMap);
      saveDb();
      return { rows: [], rowCount: 0 };
    }
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
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
async function exec(sql) {
  await getDbPromise();
  db.run(sql);
  saveDb();
}

function getDb() { return db; }
function getDbPath() { return DB_PATH; }

module.exports = { query, exec, getDb, getDbPath, getDbPromise, saveDb };
