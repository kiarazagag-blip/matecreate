-- Apex Virtus SQLite Schema
-- Generated from Prisma schema

-- Users and Authentication
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  passwordHash TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expiresAt TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_userId ON sessions(userId);
CREATE INDEX idx_sessions_token ON sessions(token);

-- Apex Virtus Core Architecture
CREATE TABLE IF NOT EXISTS purposes (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  archivedAt TEXT,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_purposes_userId ON purposes(userId);

CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  purposeId TEXT,
  moduleType TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  startDate TEXT,
  endDate TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  archivedAt TEXT,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (purposeId) REFERENCES purposes(id) ON DELETE SET NULL
);

CREATE INDEX idx_goals_userId ON goals(userId);
CREATE INDEX idx_goals_purposeId ON goals(purposeId);

CREATE TABLE IF NOT EXISTS methods (
  id TEXT PRIMARY KEY,
  goalId TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  abandonedAt TEXT,
  FOREIGN KEY (goalId) REFERENCES goals(id) ON DELETE CASCADE
);

CREATE INDEX idx_methods_goalId ON methods(goalId);

CREATE TABLE IF NOT EXISTS targets (
  id TEXT PRIMARY KEY,
  goalId TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  measurementUnit TEXT,
  targetValue REAL,
  deadline TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  completedAt TEXT,
  FOREIGN KEY (goalId) REFERENCES goals(id) ON DELETE CASCADE
);

CREATE INDEX idx_targets_goalId ON targets(goalId);

CREATE TABLE IF NOT EXISTS sub_targets (
  id TEXT PRIMARY KEY,
  targetId TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  measurementUnit TEXT,
  targetValue REAL,
  deadline TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  completedAt TEXT,
  FOREIGN KEY (targetId) REFERENCES targets(id) ON DELETE CASCADE
);

CREATE INDEX idx_sub_targets_targetId ON sub_targets(targetId);

-- Action System
CREATE TABLE IF NOT EXISTS action_definitions (
  id TEXT PRIMARY KEY,
  goalId TEXT NOT NULL,
  targetId TEXT,
  subTargetId TEXT,
  name TEXT NOT NULL,
  scheduleType TEXT NOT NULL,
  scheduleConfig TEXT NOT NULL,
  plannedValue REAL,
  plannedUnit TEXT,
  completionRuleType TEXT NOT NULL,
  completionRuleConfig TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  archivedAt TEXT,
  FOREIGN KEY (goalId) REFERENCES goals(id) ON DELETE CASCADE,
  FOREIGN KEY (targetId) REFERENCES targets(id) ON DELETE SET NULL,
  FOREIGN KEY (subTargetId) REFERENCES sub_targets(id) ON DELETE SET NULL
);

CREATE INDEX idx_action_definitions_goalId ON action_definitions(goalId);
CREATE INDEX idx_action_definitions_targetId ON action_definitions(targetId);
CREATE INDEX idx_action_definitions_subTargetId ON action_definitions(subTargetId);

CREATE TABLE IF NOT EXISTS action_attempts (
  id TEXT PRIMARY KEY,
  actionDefinitionId TEXT NOT NULL,
  goalId TEXT NOT NULL,
  date TEXT NOT NULL,
  plannedValue REAL,
  plannedUnit TEXT,
  actualValue REAL,
  actualUnit TEXT,
  executionMagnitudePercent REAL,
  disciplineVerdict TEXT NOT NULL,
  notes TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (actionDefinitionId) REFERENCES action_definitions(id) ON DELETE CASCADE,
  FOREIGN KEY (goalId) REFERENCES goals(id) ON DELETE CASCADE
);

CREATE INDEX idx_action_attempts_actionDefinitionId ON action_attempts(actionDefinitionId);
CREATE INDEX idx_action_attempts_goalId ON action_attempts(goalId);
CREATE INDEX idx_action_attempts_date ON action_attempts(date);

-- Tools and Assets
CREATE TABLE IF NOT EXISTS tools (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  goalId TEXT,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  archivedAt TEXT,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (goalId) REFERENCES goals(id) ON DELETE CASCADE
);

CREATE INDEX idx_tools_userId ON tools(userId);
CREATE INDEX idx_tools_goalId ON tools(goalId);

CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  goalId TEXT,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  quantity TEXT,
  expiresAt TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  archivedAt TEXT,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (goalId) REFERENCES goals(id) ON DELETE CASCADE
);

CREATE INDEX idx_assets_userId ON assets(userId);
CREATE INDEX idx_assets_goalId ON assets(goalId);

-- Review System
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  goalId TEXT NOT NULL,
  periodStart TEXT NOT NULL,
  periodEnd TEXT NOT NULL,
  disciplineCompletionRate REAL,
  averageExecutionMagnitude REAL,
  summary TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (goalId) REFERENCES goals(id) ON DELETE CASCADE
);

CREATE INDEX idx_reviews_goalId ON reviews(goalId);

CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  scope TEXT NOT NULL,
  category TEXT NOT NULL,
  prompt TEXT NOT NULL,
  answerType TEXT NOT NULL,
  options TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS review_answers (
  id TEXT PRIMARY KEY,
  reviewId TEXT,
  actionAttemptId TEXT,
  questionId TEXT NOT NULL,
  answerType TEXT NOT NULL,
  answerValue TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (reviewId) REFERENCES reviews(id) ON DELETE CASCADE,
  FOREIGN KEY (actionAttemptId) REFERENCES action_attempts(id) ON DELETE CASCADE,
  FOREIGN KEY (questionId) REFERENCES questions(id) ON DELETE CASCADE
);

CREATE INDEX idx_review_answers_reviewId ON review_answers(reviewId);
CREATE INDEX idx_review_answers_actionAttemptId ON review_answers(actionAttemptId);
CREATE INDEX idx_review_answers_questionId ON review_answers(questionId);
