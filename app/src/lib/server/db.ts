/**
 * Apex Virtus Database Layer
 * SQLite database with better-sqlite3
 * Follows Prisma schema structure
 */

import bcrypt from 'bcrypt';
import { db, generateId, now } from './db-utils';

// ============================================================================
// AUTHENTICATION & USERS
// ============================================================================

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: string;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  createdAt: string;
}

export const user = {
  create: async (username: string, password: string): Promise<User> => {
    // Check if username exists
    const existing = db
      .prepare('SELECT id FROM users WHERE LOWER(username) = LOWER(?)')
      .get(username) as User | undefined;

    if (existing) {
      throw new Error('Username already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    const id = generateId('user');
    const createdAt = now();

    db.prepare(`
      INSERT INTO users (id, username, passwordHash, createdAt)
      VALUES (?, ?, ?, ?)
    `).run(id, username, passwordHash, createdAt);

    return { id, username, passwordHash, createdAt };
  },

  authenticate: async (username: string, password: string): Promise<User | null> => {
    const user = db
      .prepare('SELECT * FROM users WHERE LOWER(username) = LOWER(?)')
      .get(username) as User | undefined;

    if (!user) return null;

    const valid = await bcrypt.compare(password, user.passwordHash);
    return valid ? user : null;
  },

  findById: (id: string): User | null => {
    return (db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User) || null;
  },

  findByUsername: (username: string): User | null => {
    return (
      (db
        .prepare('SELECT * FROM users WHERE LOWER(username) = LOWER(?)')
        .get(username) as User) || null
    );
  }
};

export const session = {
  create: (userId: string, expiresInDays = 30): Session => {
    const id = generateId('session');
    const token = randomBytes(32).toString('hex');
    const createdAt = now();
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();

    db.prepare(`
      INSERT INTO sessions (id, userId, token, expiresAt, createdAt)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, userId, token, expiresAt, createdAt);

    return { id, userId, token, expiresAt, createdAt };
  },

  findByToken: (token: string): Session | null => {
    const session = db
      .prepare('SELECT * FROM sessions WHERE token = ? AND expiresAt > ?')
      .get(token, now()) as Session | undefined;

    return session || null;
  },

  delete: (token: string): void => {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  },

  deleteAllForUser: (userId: string): void => {
    db.prepare('DELETE FROM sessions WHERE userId = ?').run(userId);
  },

  cleanup: (): void => {
    db.prepare('DELETE FROM sessions WHERE expiresAt <= ?').run(now());
  }
};

// ============================================================================
// PURPOSES
// ============================================================================

export interface Purpose {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  createdAt: string;
  archivedAt: string | null;
}

export const purpose = {
  create: (userId: string, data: { name: string; description?: string }): Purpose => {
    const id = generateId('purpose');
    const createdAt = now();

    db.prepare(`
      INSERT INTO purposes (id, userId, name, description, createdAt)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, userId, data.name, data.description || null, createdAt);

    return {
      id,
      userId,
      name: data.name,
      description: data.description || null,
      createdAt,
      archivedAt: null
    };
  },

  findMany: (userId: string, includeArchived = false): Purpose[] => {
    const query = includeArchived
      ? 'SELECT * FROM purposes WHERE userId = ? ORDER BY createdAt DESC'
      : 'SELECT * FROM purposes WHERE userId = ? AND archivedAt IS NULL ORDER BY createdAt DESC';

    return db.prepare(query).all(userId) as Purpose[];
  },

  findById: (id: string): Purpose | null => {
    return (db.prepare('SELECT * FROM purposes WHERE id = ?').get(id) as Purpose) || null;
  },

  update: (id: string, data: { name?: string; description?: string }): Purpose | null => {
    const existing = purpose.findById(id);
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

    if (updates.length === 0) return existing;

    values.push(id);
    db.prepare(`UPDATE purposes SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    return purpose.findById(id);
  },

  archive: (id: string): void => {
    db.prepare('UPDATE purposes SET archivedAt = ? WHERE id = ?').run(now(), id);
  },

  delete: (id: string): void => {
    db.prepare('DELETE FROM purposes WHERE id = ?').run(id);
  }
};

// ============================================================================
// GOALS
// ============================================================================

export interface Goal {
  id: string;
  userId: string;
  purposeId: string | null;
  moduleType: string;
  name: string;
  description: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  archivedAt: string | null;
}

export const goal = {
  create: (
    userId: string,
    data: {
      name: string;
      description?: string;
      moduleType: string;
      purposeId?: string;
      startDate?: string;
      endDate?: string;
      status?: string;
    }
  ): Goal => {
    const id = generateId('goal');
    const createdAt = now();

    db.prepare(`
      INSERT INTO goals (id, userId, purposeId, moduleType, name, description, status, startDate, endDate, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      userId,
      data.purposeId || null,
      data.moduleType,
      data.name,
      data.description || null,
      data.status || 'active',
      data.startDate || null,
      data.endDate || null,
      createdAt
    );

    return {
      id,
      userId,
      purposeId: data.purposeId || null,
      moduleType: data.moduleType,
      name: data.name,
      description: data.description || null,
      status: data.status || 'active',
      startDate: data.startDate || null,
      endDate: data.endDate || null,
      createdAt,
      archivedAt: null
    };
  },

  findMany: (userId: string, includeArchived = false): Goal[] => {
    const query = includeArchived
      ? 'SELECT * FROM goals WHERE userId = ? ORDER BY createdAt DESC'
      : 'SELECT * FROM goals WHERE userId = ? AND archivedAt IS NULL ORDER BY createdAt DESC';

    return db.prepare(query).all(userId) as Goal[];
  },

  findById: (id: string): Goal | null => {
    return (db.prepare('SELECT * FROM goals WHERE id = ?').get(id) as Goal) || null;
  },

  update: (
    id: string,
    data: {
      name?: string;
      description?: string;
      status?: string;
      purposeId?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Goal | null => {
    const existing = goal.findById(id);
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
    if (data.status !== undefined) {
      updates.push('status = ?');
      values.push(data.status);
    }
    if (data.purposeId !== undefined) {
      updates.push('purposeId = ?');
      values.push(data.purposeId);
    }
    if (data.startDate !== undefined) {
      updates.push('startDate = ?');
      values.push(data.startDate);
    }
    if (data.endDate !== undefined) {
      updates.push('endDate = ?');
      values.push(data.endDate);
    }

    if (updates.length === 0) return existing;

    values.push(id);
    db.prepare(`UPDATE goals SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    return goal.findById(id);
  },

  archive: (id: string): void => {
    db.prepare('UPDATE goals SET archivedAt = ?, status = ? WHERE id = ?').run(
      now(),
      'archived',
      id
    );
  },

  delete: (id: string): void => {
    db.prepare('DELETE FROM goals WHERE id = ?').run(id);
  }
};

// ============================================================================
// METHODS
// ============================================================================

export interface Method {
  id: string;
  goalId: string;
  name: string;
  description: string | null;
  status: string;
  createdAt: string;
  abandonedAt: string | null;
}

export const method = {
  create: (goalId: string, data: { name: string; description?: string }): Method => {
    const id = generateId('method');
    const createdAt = now();

    db.prepare(`
      INSERT INTO methods (id, goalId, name, description, status, createdAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, goalId, data.name, data.description || null, 'active', createdAt);

    return {
      id,
      goalId,
      name: data.name,
      description: data.description || null,
      status: 'active',
      createdAt,
      abandonedAt: null
    };
  },

  findByGoalId: (goalId: string, includeAbandoned = false): Method[] => {
    const query = includeAbandoned
      ? 'SELECT * FROM methods WHERE goalId = ? ORDER BY createdAt DESC'
      : 'SELECT * FROM methods WHERE goalId = ? AND abandonedAt IS NULL ORDER BY createdAt DESC';

    return db.prepare(query).all(goalId) as Method[];
  },

  findById: (id: string): Method | null => {
    return (db.prepare('SELECT * FROM methods WHERE id = ?').get(id) as Method) || null;
  },

  update: (id: string, data: { name?: string; description?: string }): Method | null => {
    const existing = method.findById(id);
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

    if (updates.length === 0) return existing;

    values.push(id);
    db.prepare(`UPDATE methods SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    return method.findById(id);
  },

  abandon: (id: string): void => {
    db.prepare('UPDATE methods SET abandonedAt = ?, status = ? WHERE id = ?').run(
      now(),
      'abandoned',
      id
    );
  },

  delete: (id: string): void => {
    db.prepare('DELETE FROM methods WHERE id = ?').run(id);
  }
};

// ============================================================================
// TARGETS & SUB-TARGETS
// ============================================================================

export interface Target {
  id: string;
  goalId: string;
  name: string;
  description: string | null;
  measurementUnit: string | null;
  targetValue: number | null;
  deadline: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface SubTarget {
  id: string;
  targetId: string;
  name: string;
  description: string | null;
  measurementUnit: string | null;
  targetValue: number | null;
  deadline: string | null;
  createdAt: string;
  completedAt: string | null;
}

export const target = {
  create: (
    goalId: string,
    data: {
      name: string;
      description?: string;
      measurementUnit?: string;
      targetValue?: number;
      deadline?: string;
    }
  ): Target => {
    const id = generateId('target');
    const createdAt = now();

    db.prepare(`
      INSERT INTO targets (id, goalId, name, description, measurementUnit, targetValue, deadline, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      goalId,
      data.name,
      data.description || null,
      data.measurementUnit || null,
      data.targetValue || null,
      data.deadline || null,
      createdAt
    );

    return {
      id,
      goalId,
      name: data.name,
      description: data.description || null,
      measurementUnit: data.measurementUnit || null,
      targetValue: data.targetValue || null,
      deadline: data.deadline || null,
      createdAt,
      completedAt: null
    };
  },

  findByGoalId: (goalId: string, includeCompleted = false): Target[] => {
    const query = includeCompleted
      ? 'SELECT * FROM targets WHERE goalId = ? ORDER BY createdAt DESC'
      : 'SELECT * FROM targets WHERE goalId = ? AND completedAt IS NULL ORDER BY createdAt DESC';

    return db.prepare(query).all(goalId) as Target[];
  },

  findById: (id: string): Target | null => {
    return (db.prepare('SELECT * FROM targets WHERE id = ?').get(id) as Target) || null;
  },

  update: (
    id: string,
    data: {
      name?: string;
      description?: string;
      measurementUnit?: string;
      targetValue?: number;
      deadline?: string;
    }
  ): Target | null => {
    const existing = target.findById(id);
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
    if (data.measurementUnit !== undefined) {
      updates.push('measurementUnit = ?');
      values.push(data.measurementUnit);
    }
    if (data.targetValue !== undefined) {
      updates.push('targetValue = ?');
      values.push(data.targetValue);
    }
    if (data.deadline !== undefined) {
      updates.push('deadline = ?');
      values.push(data.deadline);
    }

    if (updates.length === 0) return existing;

    values.push(id);
    db.prepare(`UPDATE targets SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    return target.findById(id);
  },

  complete: (id: string): void => {
    db.prepare('UPDATE targets SET completedAt = ? WHERE id = ?').run(now(), id);
  },

  delete: (id: string): void => {
    db.prepare('DELETE FROM targets WHERE id = ?').run(id);
  }
};

export const subTarget = {
  create: (
    targetId: string,
    data: {
      name: string;
      description?: string;
      measurementUnit?: string;
      targetValue?: number;
      deadline?: string;
    }
  ): SubTarget => {
    const id = generateId('subtarget');
    const createdAt = now();

    db.prepare(`
      INSERT INTO sub_targets (id, targetId, name, description, measurementUnit, targetValue, deadline, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      targetId,
      data.name,
      data.description || null,
      data.measurementUnit || null,
      data.targetValue || null,
      data.deadline || null,
      createdAt
    );

    return {
      id,
      targetId,
      name: data.name,
      description: data.description || null,
      measurementUnit: data.measurementUnit || null,
      targetValue: data.targetValue || null,
      deadline: data.deadline || null,
      createdAt,
      completedAt: null
    };
  },

  findByTargetId: (targetId: string, includeCompleted = false): SubTarget[] => {
    const query = includeCompleted
      ? 'SELECT * FROM sub_targets WHERE targetId = ? ORDER BY createdAt DESC'
      : 'SELECT * FROM sub_targets WHERE targetId = ? AND completedAt IS NULL ORDER BY createdAt DESC';

    return db.prepare(query).all(targetId) as SubTarget[];
  },

  findById: (id: string): SubTarget | null => {
    return (db.prepare('SELECT * FROM sub_targets WHERE id = ?').get(id) as SubTarget) || null;
  },

  update: (
    id: string,
    data: {
      name?: string;
      description?: string;
      measurementUnit?: string;
      targetValue?: number;
      deadline?: string;
    }
  ): SubTarget | null => {
    const existing = subTarget.findById(id);
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
    if (data.measurementUnit !== undefined) {
      updates.push('measurementUnit = ?');
      values.push(data.measurementUnit);
    }
    if (data.targetValue !== undefined) {
      updates.push('targetValue = ?');
      values.push(data.targetValue);
    }
    if (data.deadline !== undefined) {
      updates.push('deadline = ?');
      values.push(data.deadline);
    }

    if (updates.length === 0) return existing;

    values.push(id);
    db.prepare(`UPDATE sub_targets SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    return subTarget.findById(id);
  },

  complete: (id: string): void => {
    db.prepare('UPDATE sub_targets SET completedAt = ? WHERE id = ?').run(now(), id);
  },

  delete: (id: string): void => {
    db.prepare('DELETE FROM sub_targets WHERE id = ?').run(id);
  }
};

// Export database instance for cleanup/close
export { db };
