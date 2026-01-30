/**
 * Database utilities and shared functions
 */

import Database from 'better-sqlite3';
import path from 'path';
import { randomBytes } from 'crypto';

// Database connection
const dbPath = path.join(process.cwd(), 'dev.db');
export const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Helper functions
export function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${randomBytes(8).toString('hex')}`;
}

export function now(): string {
  return new Date().toISOString();
}

// Cleanup function for expired sessions
export function cleanupExpiredSessions(): void {
  db.prepare('DELETE FROM sessions WHERE expiresAt <= ?').run(now());
}

// Close database connection
export function closeDb(): void {
  db.close();
}
