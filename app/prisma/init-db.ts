import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'dev.db');
const schemaPath = path.join(__dirname, 'schema.sql');

console.log('Initializing Apex Virtus database...');

// Create or open database
const db = new Database(dbPath);

// Read and execute schema
const schema = fs.readFileSync(schemaPath, 'utf-8');
const statements = schema.split(';').filter(s => s.trim());

console.log(`Executing ${statements.length} SQL statements...`);

try {
  db.exec('BEGIN TRANSACTION');

  for (const statement of statements) {
    if (statement.trim()) {
      db.exec(statement);
    }
  }

  db.exec('COMMIT');
  console.log('✓ Database schema created successfully');
} catch (error) {
  db.exec('ROLLBACK');
  console.error('✗ Error creating database schema:', error);
  process.exit(1);
}

db.close();
console.log('✓ Database initialization complete');
