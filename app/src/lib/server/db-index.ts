/**
 * Apex Virtus Database - Main Export (Prisma)
 * Single entry point for all database operations
 */

// Export all functions from Prisma implementation
export * from './db-prisma';
export * from './db-prisma-actions';
export * from './db-method-sessions';

// Re-export organized namespace
import { user, session, purpose, goal, method, target, subTarget, prisma } from './db-prisma';
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
} from './db-prisma-actions';
import { methodSession } from './db-method-sessions';

// Organized namespace export
export const apexDb = {
  // Auth
  user,
  session,

  // Core architecture
  purpose,
  goal,
  method,
  methodSession,
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

  // Prisma client
  prisma
};

export default apexDb;
