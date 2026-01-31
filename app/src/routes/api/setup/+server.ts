import { prisma } from '$lib/server/prisma';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * Database Setup Endpoint
 * Visit this endpoint ONCE to initialize the database
 * DELETE THIS FILE after setup is complete for security
 */
export const GET: RequestHandler = async () => {
  try {
    // Check if tables already exist
    const tableCheck = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'users'
    `;

    if (Array.isArray(tableCheck) && tableCheck.length > 0) {
      return json({
        success: true,
        message: 'Database already initialized',
        tables: 'already exist'
      });
    }

    // Create each table separately (PostgreSQL doesn't allow multiple statements in one call)

    // Users table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" TEXT PRIMARY KEY,
        "username" TEXT UNIQUE NOT NULL,
        "passwordHash" TEXT NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Sessions table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "sessions" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "token" TEXT UNIQUE NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `;

    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "idx_sessions_userId" ON "sessions"("userId")`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "idx_sessions_token" ON "sessions"("token")`;

    // Purposes table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "purposes" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "archivedAt" TIMESTAMP,
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `;

    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "idx_purposes_userId" ON "purposes"("userId")`;

    // Goals table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "goals" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "purposeId" TEXT,
        "moduleType" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "status" TEXT NOT NULL DEFAULT 'active',
        "startDate" TIMESTAMP,
        "endDate" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "archivedAt" TIMESTAMP,
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
        FOREIGN KEY ("purposeId") REFERENCES "purposes"("id") ON DELETE SET NULL
      )
    `;

    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "idx_goals_userId" ON "goals"("userId")`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "idx_goals_purposeId" ON "goals"("purposeId")`;

    // Methods table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "methods" (
        "id" TEXT PRIMARY KEY,
        "goalId" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "status" TEXT NOT NULL DEFAULT 'active',
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "abandonedAt" TIMESTAMP,
        FOREIGN KEY ("goalId") REFERENCES "goals"("id") ON DELETE CASCADE
      )
    `;

    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "idx_methods_goalId" ON "methods"("goalId")`;

    // Targets table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "targets" (
        "id" TEXT PRIMARY KEY,
        "goalId" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "measurementUnit" TEXT,
        "targetValue" DOUBLE PRECISION,
        "deadline" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "completedAt" TIMESTAMP,
        FOREIGN KEY ("goalId") REFERENCES "goals"("id") ON DELETE CASCADE
      )
    `;

    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "idx_targets_goalId" ON "targets"("goalId")`;

    // SubTargets table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "sub_targets" (
        "id" TEXT PRIMARY KEY,
        "targetId" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "measurementUnit" TEXT,
        "targetValue" DOUBLE PRECISION,
        "deadline" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "completedAt" TIMESTAMP,
        FOREIGN KEY ("targetId") REFERENCES "targets"("id") ON DELETE CASCADE
      )
    `;

    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "idx_sub_targets_targetId" ON "sub_targets"("targetId")`;

    // ActionDefinitions table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "action_definitions" (
        "id" TEXT PRIMARY KEY,
        "goalId" TEXT NOT NULL,
        "targetId" TEXT,
        "subTargetId" TEXT,
        "name" TEXT NOT NULL,
        "scheduleType" TEXT NOT NULL,
        "scheduleConfig" TEXT NOT NULL,
        "plannedValue" DOUBLE PRECISION,
        "plannedUnit" TEXT,
        "completionRuleType" TEXT NOT NULL,
        "completionRuleConfig" TEXT NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "archivedAt" TIMESTAMP,
        FOREIGN KEY ("goalId") REFERENCES "goals"("id") ON DELETE CASCADE,
        FOREIGN KEY ("targetId") REFERENCES "targets"("id") ON DELETE SET NULL,
        FOREIGN KEY ("subTargetId") REFERENCES "sub_targets"("id") ON DELETE SET NULL
      )
    `;

    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "idx_action_definitions_goalId" ON "action_definitions"("goalId")`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "idx_action_definitions_targetId" ON "action_definitions"("targetId")`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "idx_action_definitions_subTargetId" ON "action_definitions"("subTargetId")`;

    // ActionAttempts table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "action_attempts" (
        "id" TEXT PRIMARY KEY,
        "actionDefinitionId" TEXT NOT NULL,
        "goalId" TEXT NOT NULL,
        "date" TIMESTAMP NOT NULL,
        "plannedValue" DOUBLE PRECISION,
        "plannedUnit" TEXT,
        "actualValue" DOUBLE PRECISION,
        "actualUnit" TEXT,
        "executionMagnitudePercent" DOUBLE PRECISION,
        "disciplineVerdict" TEXT NOT NULL,
        "notes" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("actionDefinitionId") REFERENCES "action_definitions"("id") ON DELETE CASCADE,
        FOREIGN KEY ("goalId") REFERENCES "goals"("id") ON DELETE CASCADE
      )
    `;

    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "idx_action_attempts_actionDefinitionId" ON "action_attempts"("actionDefinitionId")`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "idx_action_attempts_goalId" ON "action_attempts"("goalId")`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "idx_action_attempts_date" ON "action_attempts"("date")`;

    // Tools table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "tools" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "goalId" TEXT,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "category" TEXT NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "archivedAt" TIMESTAMP,
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
        FOREIGN KEY ("goalId") REFERENCES "goals"("id") ON DELETE CASCADE
      )
    `;

    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "idx_tools_userId" ON "tools"("userId")`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "idx_tools_goalId" ON "tools"("goalId")`;

    // Assets table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "assets" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "goalId" TEXT,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "category" TEXT NOT NULL,
        "quantity" TEXT,
        "expiresAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "archivedAt" TIMESTAMP,
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
        FOREIGN KEY ("goalId") REFERENCES "goals"("id") ON DELETE CASCADE
      )
    `;

    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "idx_assets_userId" ON "assets"("userId")`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "idx_assets_goalId" ON "assets"("goalId")`;

    // Reviews table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "reviews" (
        "id" TEXT PRIMARY KEY,
        "goalId" TEXT NOT NULL,
        "periodStart" TIMESTAMP NOT NULL,
        "periodEnd" TIMESTAMP NOT NULL,
        "disciplineCompletionRate" DOUBLE PRECISION,
        "averageExecutionMagnitude" DOUBLE PRECISION,
        "summary" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("goalId") REFERENCES "goals"("id") ON DELETE CASCADE
      )
    `;

    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "idx_reviews_goalId" ON "reviews"("goalId")`;

    // Questions table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "questions" (
        "id" TEXT PRIMARY KEY,
        "scope" TEXT NOT NULL,
        "category" TEXT NOT NULL,
        "prompt" TEXT NOT NULL,
        "answerType" TEXT NOT NULL,
        "options" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // ReviewAnswers table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "review_answers" (
        "id" TEXT PRIMARY KEY,
        "reviewId" TEXT,
        "actionAttemptId" TEXT,
        "questionId" TEXT NOT NULL,
        "answerType" TEXT NOT NULL,
        "answerValue" TEXT NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("reviewId") REFERENCES "reviews"("id") ON DELETE CASCADE,
        FOREIGN KEY ("actionAttemptId") REFERENCES "action_attempts"("id") ON DELETE CASCADE,
        FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE
      )
    `;

    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "idx_review_answers_reviewId" ON "review_answers"("reviewId")`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "idx_review_answers_actionAttemptId" ON "review_answers"("actionAttemptId")`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "idx_review_answers_questionId" ON "review_answers"("questionId")`;

    return json({
      success: true,
      message: 'Database initialized successfully! All 18 tables created.',
      note: 'You can now create an account. DELETE the /api/setup endpoint file for security.'
    });
  } catch (error) {
    console.error('Database setup error:', error);
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
};
