/**
 * Apex Virtus Database - Main Export
 * Single entry point for all database operations
 */

// Export all types and functions from db modules
export * from './db';
export * from './db-actions';
export * from './db-utils';

// Re-export organized namespace
import { user, session } from './db';
import { purpose, goal, method, target, subTarget } from './db';
import {
  actionDefinition,
  actionAttempt,
  tool,
  asset,
  review,
  question,
  reviewAnswer,
  computeVerdict,
  computeMagnitude
} from './db-actions';
import { cleanupExpiredSessions, closeDb } from './db-utils';

// Organized namespace export
export const apexDb = {
  // Auth
  user,
  session,

  // Core architecture
  purpose,
  goal,
  method,
  target,
  subTarget,

  // Actions
  actionDefinition,
  actionAttempt,

  // Execution logic
  computeVerdict,
  computeMagnitude,

  // Tools & Assets
  tool,
  asset,

  // Reviews
  review,
  question,
  reviewAnswer,

  // Utils
  cleanupExpiredSessions,
  close: closeDb
};

export default apexDb;
