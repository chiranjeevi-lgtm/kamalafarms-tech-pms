require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

function setupDatabase() {
  const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'agritech.db');

  // Ensure data directory exists
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Check if database already exists with data
  if (fs.existsSync(dbPath)) {
    try {
      const existingDb = new Database(dbPath, { readonly: true });
      const count = existingDb.prepare('SELECT COUNT(*) as c FROM users').get();
      existingDb.close();
      if (count && count.c > 0) {
        console.log(`Database already exists with ${count.c} users. Skipping setup.`);
        // Still ensure gradings table exists
        const db2 = new Database(dbPath);
        db2.pragma('journal_mode = WAL');
        db2.pragma('foreign_keys = ON');
        db2.exec(`
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
        db2.close();
        return;
      }
    } catch (e) {
      console.log('Existing database is corrupt or empty, recreating...');
      fs.unlinkSync(dbPath);
    }
  }

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  console.log(`Created database at: ${dbPath}`);

  // Read and execute schema.sql
  const schemaPath = path.resolve(__dirname, '..', 'models', 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    let schemaSql = fs.readFileSync(schemaPath, 'utf-8');
    // Convert PostgreSQL syntax to SQLite
    schemaSql = convertPgToSqlite(schemaSql);
    db.exec(schemaSql);
    console.log('Schema executed successfully.');
  } else {
    console.warn('schema.sql not found at:', schemaPath);
  }

  // Read and execute seed.sql
  const seedPath = path.resolve(__dirname, '..', 'models', 'seed.sql');
  if (fs.existsSync(seedPath)) {
    let seedSql = fs.readFileSync(seedPath, 'utf-8');
    seedSql = convertPgToSqlite(seedSql);
    db.exec(seedSql);
    console.log('Seed data inserted successfully.');
  } else {
    console.warn('seed.sql not found at:', seedPath);
  }

  // Create gradings table (not in schema.sql)
  db.exec(`
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
    CREATE INDEX IF NOT EXISTS idx_gradings_employee ON gradings(employee_id);
    CREATE INDEX IF NOT EXISTS idx_gradings_month_year ON gradings(month, year);
  `);
  console.log('Gradings table created.');

  // Verify data
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  const empCount = db.prepare('SELECT COUNT(*) as count FROM employees').get();
  const kpiCount = db.prepare('SELECT COUNT(*) as count FROM kpi_scores').get();
  console.log(`\nDatabase setup complete!`);
  console.log(`  Users: ${userCount.count}`);
  console.log(`  Employees: ${empCount.count}`);
  console.log(`  KPI Scores: ${kpiCount.count}`);

  db.close();
}

function convertPgToSqlite(sql) {
  return sql
    // Remove BEGIN/COMMIT transaction wrappers
    .replace(/^\s*BEGIN\s*;/gim, '')
    .replace(/^\s*COMMIT\s*;/gim, '')
    // Remove PostgreSQL sequence commands
    .replace(/SELECT\s+setval\([^)]*\)\s*;/gi, '')
    // SERIAL PRIMARY KEY -> INTEGER PRIMARY KEY AUTOINCREMENT
    .replace(/SERIAL\s+PRIMARY\s+KEY/gi, 'INTEGER PRIMARY KEY AUTOINCREMENT')
    // Data types
    .replace(/JSONB/gi, 'TEXT')
    .replace(/NUMERIC\([^)]*\)/gi, 'REAL')
    .replace(/VARCHAR\([^)]*\)/gi, 'TEXT')
    .replace(/VARCHAR/gi, 'TEXT')
    .replace(/\bDATE\b/gi, 'TEXT')
    .replace(/TIMESTAMP/gi, 'TEXT')
    .replace(/BOOLEAN/gi, 'INTEGER')
    // DEFAULT NOW() -> DEFAULT (datetime('now'))
    .replace(/DEFAULT\s+NOW\(\)/gi, "DEFAULT (datetime('now'))")
    // NOW() in values -> datetime('now')
    .replace(/NOW\(\)/gi, "datetime('now')")
    // true/false -> 1/0 (careful with word boundaries to avoid matching in strings)
    .replace(/DEFAULT\s+true/gi, 'DEFAULT 1')
    .replace(/DEFAULT\s+false/gi, 'DEFAULT 0')
    // true/false in VALUE lists (not inside quotes)
    .replace(/,\s*true\s*,/gi, ', 1,')
    .replace(/,\s*false\s*,/gi, ', 0,')
    .replace(/,\s*true\s*\)/gi, ', 1)')
    .replace(/,\s*false\s*\)/gi, ', 0)')
    .replace(/\(\s*true\s*,/gi, '(1,')
    .replace(/\(\s*false\s*,/gi, '(0,')
    ;
}

setupDatabase();
