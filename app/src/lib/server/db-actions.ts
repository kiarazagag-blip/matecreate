/**
 * Apex Virtus Database Layer - Actions, Tools, Assets, Reviews
 */

import { db, now, generateId } from './db-utils';

// ============================================================================
// ACTION DEFINITIONS & ATTEMPTS
// ============================================================================

export interface ActionDefinition {
  id: string;
  goalId: string;
  targetId: string | null;
  subTargetId: string | null;
  name: string;
  scheduleType: string;
  scheduleConfig: string;
  plannedValue: number | null;
  plannedUnit: string | null;
  completionRuleType: string;
  completionRuleConfig: string;
  createdAt: string;
  archivedAt: string | null;
}

export interface ActionAttempt {
  id: string;
  actionDefinitionId: string;
  goalId: string;
  date: string;
  plannedValue: number | null;
  plannedUnit: string | null;
  actualValue: number | null;
  actualUnit: string | null;
  executionMagnitudePercent: number | null;
  disciplineVerdict: 'complete' | 'incomplete';
  notes: string | null;
  createdAt: string;
}

export const actionDefinition = {
  create: (
    goalId: string,
    data: {
      name: string;
      targetId?: string;
      subTargetId?: string;
      scheduleType: string;
      scheduleConfig: object;
      plannedValue?: number;
      plannedUnit?: string;
      completionRuleType: string;
      completionRuleConfig: object;
    }
  ): ActionDefinition => {
    const id = generateId('actiondef');
    const createdAt = now();

    db.prepare(`
      INSERT INTO action_definitions (
        id, goalId, targetId, subTargetId, name, scheduleType, scheduleConfig,
        plannedValue, plannedUnit, completionRuleType, completionRuleConfig, createdAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      goalId,
      data.targetId || null,
      data.subTargetId || null,
      data.name,
      data.scheduleType,
      JSON.stringify(data.scheduleConfig),
      data.plannedValue || null,
      data.plannedUnit || null,
      data.completionRuleType,
      JSON.stringify(data.completionRuleConfig),
      createdAt
    );

    return {
      id,
      goalId,
      targetId: data.targetId || null,
      subTargetId: data.subTargetId || null,
      name: data.name,
      scheduleType: data.scheduleType,
      scheduleConfig: JSON.stringify(data.scheduleConfig),
      plannedValue: data.plannedValue || null,
      plannedUnit: data.plannedUnit || null,
      completionRuleType: data.completionRuleType,
      completionRuleConfig: JSON.stringify(data.completionRuleConfig),
      createdAt,
      archivedAt: null
    };
  },

  findByGoalId: (goalId: string, includeArchived = false): ActionDefinition[] => {
    const query = includeArchived
      ? 'SELECT * FROM action_definitions WHERE goalId = ? ORDER BY createdAt DESC'
      : 'SELECT * FROM action_definitions WHERE goalId = ? AND archivedAt IS NULL ORDER BY createdAt DESC';

    return db.prepare(query).all(goalId) as ActionDefinition[];
  },

  findById: (id: string): ActionDefinition | null => {
    return (
      (db.prepare('SELECT * FROM action_definitions WHERE id = ?').get(id) as ActionDefinition) ||
      null
    );
  },

  update: (
    id: string,
    data: {
      name?: string;
      scheduleType?: string;
      scheduleConfig?: object;
      plannedValue?: number;
      plannedUnit?: string;
      completionRuleType?: string;
      completionRuleConfig?: object;
    }
  ): ActionDefinition | null => {
    const existing = actionDefinition.findById(id);
    if (!existing) return null;

    const updates: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.scheduleType !== undefined) {
      updates.push('scheduleType = ?');
      values.push(data.scheduleType);
    }
    if (data.scheduleConfig !== undefined) {
      updates.push('scheduleConfig = ?');
      values.push(JSON.stringify(data.scheduleConfig));
    }
    if (data.plannedValue !== undefined) {
      updates.push('plannedValue = ?');
      values.push(data.plannedValue);
    }
    if (data.plannedUnit !== undefined) {
      updates.push('plannedUnit = ?');
      values.push(data.plannedUnit);
    }
    if (data.completionRuleType !== undefined) {
      updates.push('completionRuleType = ?');
      values.push(data.completionRuleType);
    }
    if (data.completionRuleConfig !== undefined) {
      updates.push('completionRuleConfig = ?');
      values.push(JSON.stringify(data.completionRuleConfig));
    }

    if (updates.length === 0) return existing;

    values.push(id);
    db.prepare(`UPDATE action_definitions SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    return actionDefinition.findById(id);
  },

  archive: (id: string): void => {
    db.prepare('UPDATE action_definitions SET archivedAt = ? WHERE id = ?').run(now(), id);
  },

  delete: (id: string): void => {
    db.prepare('DELETE FROM action_definitions WHERE id = ?').run(id);
  }
};

/**
 * Compute discipline verdict based on completion rule
 * This is a pure, deterministic function
 */
export function computeVerdict(
  completionRuleType: string,
  completionRuleConfig: any,
  plannedValue: number | null,
  actualValue: number | null,
  explicit: boolean = false
): 'complete' | 'incomplete' {
  switch (completionRuleType) {
    case 'binary_exact':
      // For checkbox-type actions or exact value matches
      if (plannedValue === null) {
        // Checkbox action: requires explicit marking
        return explicit ? 'complete' : 'incomplete';
      } else {
        // Numeric action: requires actualValue >= plannedValue
        return actualValue !== null && actualValue >= plannedValue ? 'complete' : 'incomplete';
      }

    case 'threshold_ge':
      // Greater than or equal to threshold
      const minValue = completionRuleConfig.minValue || plannedValue || 0;
      return actualValue !== null && actualValue >= minValue ? 'complete' : 'incomplete';

    case 'checklist_all':
      // All items must be checked (for future implementation)
      return explicit ? 'complete' : 'incomplete';

    default:
      return 'incomplete';
  }
}

/**
 * Compute execution magnitude percentage
 * This shows "how much" was done, separate from the binary verdict
 */
export function computeMagnitude(
  plannedValue: number | null,
  actualValue: number | null
): number | null {
  if (plannedValue === null || actualValue === null || plannedValue === 0) {
    return null;
  }

  const magnitude = (actualValue / plannedValue) * 100;
  return Math.max(0, Math.min(magnitude, 200)); // Cap at 200% (allow over-achievement)
}

export const actionAttempt = {
  create: (
    actionDefinitionId: string,
    goalId: string,
    data: {
      date: string;
      actualValue?: number;
      actualUnit?: string;
      notes?: string;
      explicit?: boolean; // For checkbox-type actions
    }
  ): ActionAttempt => {
    // Get the action definition to compute verdict
    const definition = actionDefinition.findById(actionDefinitionId);
    if (!definition) {
      throw new Error('Action definition not found');
    }

    const id = generateId('attempt');
    const createdAt = now();

    // Parse completion rule config
    const ruleConfig = JSON.parse(definition.completionRuleConfig);

    // Compute verdict and magnitude
    const disciplineVerdict = computeVerdict(
      definition.completionRuleType,
      ruleConfig,
      definition.plannedValue,
      data.actualValue || null,
      data.explicit || false
    );

    const executionMagnitudePercent = computeMagnitude(
      definition.plannedValue,
      data.actualValue || null
    );

    db.prepare(`
      INSERT INTO action_attempts (
        id, actionDefinitionId, goalId, date, plannedValue, plannedUnit,
        actualValue, actualUnit, executionMagnitudePercent, disciplineVerdict, notes, createdAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      actionDefinitionId,
      goalId,
      data.date,
      definition.plannedValue,
      definition.plannedUnit,
      data.actualValue || null,
      data.actualUnit || null,
      executionMagnitudePercent,
      disciplineVerdict,
      data.notes || null,
      createdAt
    );

    return {
      id,
      actionDefinitionId,
      goalId,
      date: data.date,
      plannedValue: definition.plannedValue,
      plannedUnit: definition.plannedUnit,
      actualValue: data.actualValue || null,
      actualUnit: data.actualUnit || null,
      executionMagnitudePercent,
      disciplineVerdict,
      notes: data.notes || null,
      createdAt
    };
  },

  findByGoalId: (goalId: string, limit = 100): ActionAttempt[] => {
    return db
      .prepare(
        'SELECT * FROM action_attempts WHERE goalId = ? ORDER BY date DESC, createdAt DESC LIMIT ?'
      )
      .all(goalId, limit) as ActionAttempt[];
  },

  findByDateRange: (goalId: string, startDate: string, endDate: string): ActionAttempt[] => {
    return db
      .prepare(
        'SELECT * FROM action_attempts WHERE goalId = ? AND date >= ? AND date <= ? ORDER BY date DESC'
      )
      .all(goalId, startDate, endDate) as ActionAttempt[];
  },

  findById: (id: string): ActionAttempt | null => {
    return (
      (db.prepare('SELECT * FROM action_attempts WHERE id = ?').get(id) as ActionAttempt) || null
    );
  },

  findByDefinitionId: (actionDefinitionId: string, limit = 50): ActionAttempt[] => {
    return db
      .prepare(
        'SELECT * FROM action_attempts WHERE actionDefinitionId = ? ORDER BY date DESC LIMIT ?'
      )
      .all(actionDefinitionId, limit) as ActionAttempt[];
  },

  update: (
    id: string,
    data: {
      actualValue?: number;
      actualUnit?: string;
      notes?: string;
    }
  ): ActionAttempt | null => {
    const existing = actionAttempt.findById(id);
    if (!existing) return null;

    // Get definition to recompute verdict
    const definition = actionDefinition.findById(existing.actionDefinitionId);
    if (!definition) return null;

    const ruleConfig = JSON.parse(definition.completionRuleConfig);

    // Recompute verdict and magnitude with new values
    const actualValue = data.actualValue !== undefined ? data.actualValue : existing.actualValue;
    const disciplineVerdict = computeVerdict(
      definition.completionRuleType,
      ruleConfig,
      existing.plannedValue,
      actualValue,
      false
    );

    const executionMagnitudePercent = computeMagnitude(existing.plannedValue, actualValue);

    db.prepare(`
      UPDATE action_attempts
      SET actualValue = ?, actualUnit = ?, executionMagnitudePercent = ?,
          disciplineVerdict = ?, notes = ?
      WHERE id = ?
    `).run(
      actualValue,
      data.actualUnit !== undefined ? data.actualUnit : existing.actualUnit,
      executionMagnitudePercent,
      disciplineVerdict,
      data.notes !== undefined ? data.notes : existing.notes,
      id
    );

    return actionAttempt.findById(id);
  },

  delete: (id: string): void => {
    db.prepare('DELETE FROM action_attempts WHERE id = ?').run(id);
  }
};

// ============================================================================
// TOOLS & ASSETS
// ============================================================================

export interface Tool {
  id: string;
  userId: string;
  goalId: string | null;
  name: string;
  description: string | null;
  category: string;
  createdAt: string;
  archivedAt: string | null;
}

export interface Asset {
  id: string;
  userId: string;
  goalId: string | null;
  name: string;
  description: string | null;
  category: string;
  quantity: string | null;
  expiresAt: string | null;
  createdAt: string;
  archivedAt: string | null;
}

export const tool = {
  create: (
    userId: string,
    data: {
      name: string;
      description?: string;
      category: string;
      goalId?: string;
    }
  ): Tool => {
    const id = generateId('tool');
    const createdAt = now();

    db.prepare(`
      INSERT INTO tools (id, userId, goalId, name, description, category, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      userId,
      data.goalId || null,
      data.name,
      data.description || null,
      data.category,
      createdAt
    );

    return {
      id,
      userId,
      goalId: data.goalId || null,
      name: data.name,
      description: data.description || null,
      category: data.category,
      createdAt,
      archivedAt: null
    };
  },

  findByUserId: (userId: string, includeArchived = false): Tool[] => {
    const query = includeArchived
      ? 'SELECT * FROM tools WHERE userId = ? ORDER BY createdAt DESC'
      : 'SELECT * FROM tools WHERE userId = ? AND archivedAt IS NULL ORDER BY createdAt DESC';

    return db.prepare(query).all(userId) as Tool[];
  },

  findByGoalId: (goalId: string, includeArchived = false): Tool[] => {
    const query = includeArchived
      ? 'SELECT * FROM tools WHERE goalId = ? ORDER BY createdAt DESC'
      : 'SELECT * FROM tools WHERE goalId = ? AND archivedAt IS NULL ORDER BY createdAt DESC';

    return db.prepare(query).all(goalId) as Tool[];
  },

  findById: (id: string): Tool | null => {
    return (db.prepare('SELECT * FROM tools WHERE id = ?').get(id) as Tool) || null;
  },

  update: (
    id: string,
    data: {
      name?: string;
      description?: string;
      category?: string;
    }
  ): Tool | null => {
    const existing = tool.findById(id);
    if (!existing) return null;

    const updates: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      values.push(data.description);
    }
    if (data.category !== undefined) {
      updates.push('category = ?');
      values.push(data.category);
    }

    if (updates.length === 0) return existing;

    values.push(id);
    db.prepare(`UPDATE tools SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    return tool.findById(id);
  },

  archive: (id: string): void => {
    db.prepare('UPDATE tools SET archivedAt = ? WHERE id = ?').run(now(), id);
  },

  delete: (id: string): void => {
    db.prepare('DELETE FROM tools WHERE id = ?').run(id);
  }
};

export const asset = {
  create: (
    userId: string,
    data: {
      name: string;
      description?: string;
      category: string;
      quantity?: string;
      expiresAt?: string;
      goalId?: string;
    }
  ): Asset => {
    const id = generateId('asset');
    const createdAt = now();

    db.prepare(`
      INSERT INTO assets (id, userId, goalId, name, description, category, quantity, expiresAt, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      userId,
      data.goalId || null,
      data.name,
      data.description || null,
      data.category,
      data.quantity || null,
      data.expiresAt || null,
      createdAt
    );

    return {
      id,
      userId,
      goalId: data.goalId || null,
      name: data.name,
      description: data.description || null,
      category: data.category,
      quantity: data.quantity || null,
      expiresAt: data.expiresAt || null,
      createdAt,
      archivedAt: null
    };
  },

  findByUserId: (userId: string, includeArchived = false): Asset[] => {
    const query = includeArchived
      ? 'SELECT * FROM assets WHERE userId = ? ORDER BY createdAt DESC'
      : 'SELECT * FROM assets WHERE userId = ? AND archivedAt IS NULL ORDER BY createdAt DESC';

    return db.prepare(query).all(userId) as Asset[];
  },

  findByGoalId: (goalId: string, includeArchived = false): Asset[] => {
    const query = includeArchived
      ? 'SELECT * FROM assets WHERE goalId = ? ORDER BY createdAt DESC'
      : 'SELECT * FROM assets WHERE goalId = ? AND archivedAt IS NULL ORDER BY createdAt DESC';

    return db.prepare(query).all(goalId) as Asset[];
  },

  findById: (id: string): Asset | null => {
    return (db.prepare('SELECT * FROM assets WHERE id = ?').get(id) as Asset) || null;
  },

  update: (
    id: string,
    data: {
      name?: string;
      description?: string;
      category?: string;
      quantity?: string;
      expiresAt?: string;
    }
  ): Asset | null => {
    const existing = asset.findById(id);
    if (!existing) return null;

    const updates: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      values.push(data.description);
    }
    if (data.category !== undefined) {
      updates.push('category = ?');
      values.push(data.category);
    }
    if (data.quantity !== undefined) {
      updates.push('quantity = ?');
      values.push(data.quantity);
    }
    if (data.expiresAt !== undefined) {
      updates.push('expiresAt = ?');
      values.push(data.expiresAt);
    }

    if (updates.length === 0) return existing;

    values.push(id);
    db.prepare(`UPDATE assets SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    return asset.findById(id);
  },

  archive: (id: string): void => {
    db.prepare('UPDATE assets SET archivedAt = ? WHERE id = ?').run(now(), id);
  },

  delete: (id: string): void => {
    db.prepare('DELETE FROM assets WHERE id = ?').run(id);
  }
};

// ============================================================================
// REVIEWS & QUESTIONS
// ============================================================================

export interface Review {
  id: string;
  goalId: string;
  periodStart: string;
  periodEnd: string;
  disciplineCompletionRate: number | null;
  averageExecutionMagnitude: number | null;
  summary: string | null;
  createdAt: string;
}

export interface Question {
  id: string;
  scope: string;
  category: string;
  prompt: string;
  answerType: string;
  options: string | null;
  createdAt: string;
}

export interface ReviewAnswer {
  id: string;
  reviewId: string | null;
  actionAttemptId: string | null;
  questionId: string;
  answerType: string;
  answerValue: string;
  createdAt: string;
}

export const review = {
  create: (
    goalId: string,
    data: {
      periodStart: string;
      periodEnd: string;
      summary?: string;
    }
  ): Review => {
    const id = generateId('review');
    const createdAt = now();

    // Compute metrics from action attempts in this period
    const attempts = actionAttempt.findByDateRange(goalId, data.periodStart, data.periodEnd);

    let disciplineCompletionRate: number | null = null;
    let averageExecutionMagnitude: number | null = null;

    if (attempts.length > 0) {
      const completeCount = attempts.filter((a) => a.disciplineVerdict === 'complete').length;
      disciplineCompletionRate = (completeCount / attempts.length) * 100;

      const magnitudes = attempts
        .map((a) => a.executionMagnitudePercent)
        .filter((m): m is number => m !== null);
      if (magnitudes.length > 0) {
        averageExecutionMagnitude =
          magnitudes.reduce((sum, m) => sum + m, 0) / magnitudes.length;
      }
    }

    db.prepare(`
      INSERT INTO reviews (
        id, goalId, periodStart, periodEnd, disciplineCompletionRate,
        averageExecutionMagnitude, summary, createdAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      goalId,
      data.periodStart,
      data.periodEnd,
      disciplineCompletionRate,
      averageExecutionMagnitude,
      data.summary || null,
      createdAt
    );

    return {
      id,
      goalId,
      periodStart: data.periodStart,
      periodEnd: data.periodEnd,
      disciplineCompletionRate,
      averageExecutionMagnitude,
      summary: data.summary || null,
      createdAt
    };
  },

  findByGoalId: (goalId: string): Review[] => {
    return db
      .prepare('SELECT * FROM reviews WHERE goalId = ? ORDER BY periodEnd DESC')
      .all(goalId) as Review[];
  },

  findById: (id: string): Review | null => {
    return (db.prepare('SELECT * FROM reviews WHERE id = ?').get(id) as Review) || null;
  },

  update: (id: string, data: { summary?: string }): Review | null => {
    const existing = review.findById(id);
    if (!existing) return null;

    if (data.summary !== undefined) {
      db.prepare('UPDATE reviews SET summary = ? WHERE id = ?').run(data.summary, id);
    }

    return review.findById(id);
  },

  delete: (id: string): void => {
    db.prepare('DELETE FROM reviews WHERE id = ?').run(id);
  }
};

export const question = {
  create: (data: {
    scope: string;
    category: string;
    prompt: string;
    answerType: string;
    options?: string[];
  }): Question => {
    const id = generateId('question');
    const createdAt = now();

    db.prepare(`
      INSERT INTO questions (id, scope, category, prompt, answerType, options, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.scope,
      data.category,
      data.prompt,
      data.answerType,
      data.options ? JSON.stringify(data.options) : null,
      createdAt
    );

    return {
      id,
      scope: data.scope,
      category: data.category,
      prompt: data.prompt,
      answerType: data.answerType,
      options: data.options ? JSON.stringify(data.options) : null,
      createdAt
    };
  },

  findAll: (): Question[] => {
    return db.prepare('SELECT * FROM questions ORDER BY scope, category').all() as Question[];
  },

  findByScope: (scope: string): Question[] => {
    return db
      .prepare('SELECT * FROM questions WHERE scope = ? ORDER BY category')
      .all(scope) as Question[];
  },

  findById: (id: string): Question | null => {
    return (db.prepare('SELECT * FROM questions WHERE id = ?').get(id) as Question) || null;
  },

  delete: (id: string): void => {
    db.prepare('DELETE FROM questions WHERE id = ?').run(id);
  }
};

export const reviewAnswer = {
  create: (data: {
    questionId: string;
    answerValue: string;
    answerType: string;
    reviewId?: string;
    actionAttemptId?: string;
  }): ReviewAnswer => {
    const id = generateId('answer');
    const createdAt = now();

    db.prepare(`
      INSERT INTO review_answers (id, reviewId, actionAttemptId, questionId, answerType, answerValue, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.reviewId || null,
      data.actionAttemptId || null,
      data.questionId,
      data.answerType,
      data.answerValue,
      createdAt
    );

    return {
      id,
      reviewId: data.reviewId || null,
      actionAttemptId: data.actionAttemptId || null,
      questionId: data.questionId,
      answerType: data.answerType,
      answerValue: data.answerValue,
      createdAt
    };
  },

  findByReviewId: (reviewId: string): ReviewAnswer[] => {
    return db
      .prepare('SELECT * FROM review_answers WHERE reviewId = ? ORDER BY createdAt')
      .all(reviewId) as ReviewAnswer[];
  },

  findByAttemptId: (actionAttemptId: string): ReviewAnswer[] => {
    return db
      .prepare('SELECT * FROM review_answers WHERE actionAttemptId = ? ORDER BY createdAt')
      .all(actionAttemptId) as ReviewAnswer[];
  },

  delete: (id: string): void => {
    db.prepare('DELETE FROM review_answers WHERE id = ?').run(id);
  }
};
