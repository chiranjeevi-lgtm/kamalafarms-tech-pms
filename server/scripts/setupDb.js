require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

async function setupDatabase() {
  const isVercel = !!process.env.VERCEL;
  const dbPath = process.env.DB_PATH
    || (isVercel ? '/tmp/agritech.db' : path.join(__dirname, '..', 'data', 'agritech.db'));

  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Check if database already exists with data
  if (fs.existsSync(dbPath)) {
    try {
      const SQL = await initSqlJs();
      const buffer = fs.readFileSync(dbPath);
      const existingDb = new SQL.Database(buffer);
      const result = existingDb.exec('SELECT COUNT(*) as c FROM users');
      const count = result[0]?.values[0]?.[0];
      existingDb.close();
      if (count && count > 0) {
        console.log(`Database already exists with ${count} users. Skipping setup.`);
        // Ensure gradings table exists
        const db2 = new SQL.Database(buffer);
        db2.run('PRAGMA foreign_keys = ON');
        db2.run(`
          CREATE TABLE IF NOT EXISTS gradings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_id INT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
            graded_by INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
            year INT NOT NULL,
            department TEXT,
            scores TEXT DEFAULT '{}',
            total_grade REAL DEFAULT 0,
            remarks TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now')),
            UNIQUE(employee_id, graded_by, month, year)
          );
        `);
        const data = db2.export();
        fs.writeFileSync(dbPath, Buffer.from(data));
        db2.close();
        return;
      }
    } catch (e) {
      console.log('Existing database is corrupt or empty, recreating...');
    }
  }

  const SQL = await initSqlJs();
  const db = new SQL.Database();
  db.run('PRAGMA foreign_keys = ON');

  console.log(`Creating database at: ${dbPath}`);

  // Read and execute schema.sql
  const schemaPath = path.resolve(__dirname, '..', 'models', 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    let schemaSql = fs.readFileSync(schemaPath, 'utf-8');
    schemaSql = convertPgToSqlite(schemaSql);
    // Split by semicolons and execute each statement
    const stmts = schemaSql.split(';').map(s => s.trim()).filter(s => s.length > 0);
    for (const stmt of stmts) {
      try { db.run(stmt); } catch (e) { /* skip errors for IF NOT EXISTS etc */ }
    }
    console.log('Schema executed successfully.');
  }

  // Read and execute seed.sql
  const seedPath = path.resolve(__dirname, '..', 'models', 'seed.sql');
  if (fs.existsSync(seedPath)) {
    let seedSql = fs.readFileSync(seedPath, 'utf-8');
    seedSql = convertPgToSqlite(seedSql);
    const stmts = seedSql.split(';').map(s => s.trim()).filter(s => s.length > 0);
    for (const stmt of stmts) {
      try { db.run(stmt); } catch (e) { console.log('Seed skip:', e.message?.substring(0, 80)); }
    }
    console.log('Seed data inserted successfully.');
  }

  // Create gradings table
  db.run(`
    CREATE TABLE IF NOT EXISTS gradings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      graded_by INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
      year INT NOT NULL,
      department TEXT,
      scores TEXT DEFAULT '{}',
      total_grade REAL DEFAULT 0,
      remarks TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(employee_id, graded_by, month, year)
    );
  `);
  console.log('Gradings table created.');

  // Save to file
  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));

  // Verify
  const userCount = db.exec('SELECT COUNT(*) FROM users')[0]?.values[0]?.[0] || 0;
  const empCount = db.exec('SELECT COUNT(*) FROM employees')[0]?.values[0]?.[0] || 0;
  console.log(`\nDatabase setup complete!`);
  console.log(`  Users: ${userCount}`);
  console.log(`  Employees: ${empCount}`);

  db.close();
}

function convertPgToSqlite(sql) {
  return sql
    .replace(/^\s*BEGIN\s*;/gim, '')
    .replace(/^\s*COMMIT\s*;/gim, '')
    .replace(/SELECT\s+setval\([^)]*\)\s*;/gi, '')
    .replace(/SERIAL\s+PRIMARY\s+KEY/gi, 'INTEGER PRIMARY KEY AUTOINCREMENT')
    .replace(/JSONB/gi, 'TEXT')
    .replace(/NUMERIC\([^)]*\)/gi, 'REAL')
    .replace(/VARCHAR\([^)]*\)/gi, 'TEXT')
    .replace(/VARCHAR/gi, 'TEXT')
    .replace(/\bDATE\b/gi, 'TEXT')
    .replace(/TIMESTAMP/gi, 'TEXT')
    .replace(/BOOLEAN/gi, 'INTEGER')
    .replace(/DEFAULT\s+NOW\(\)/gi, "DEFAULT (datetime('now'))")
    .replace(/NOW\(\)/gi, "datetime('now')")
    .replace(/DEFAULT\s+true/gi, 'DEFAULT 1')
    .replace(/DEFAULT\s+false/gi, 'DEFAULT 0')
    .replace(/,\s*true\s*,/gi, ', 1,')
    .replace(/,\s*false\s*,/gi, ', 0,')
    .replace(/,\s*true\s*\)/gi, ', 1)')
    .replace(/,\s*false\s*\)/gi, ', 0)')
    .replace(/\(\s*true\s*,/gi, '(1,')
    .replace(/\(\s*false\s*,/gi, '(0,');
}

if (require.main === module) {
  setupDatabase().catch(e => { console.error(e); process.exit(1); });
}
module.exports = setupDatabase;
