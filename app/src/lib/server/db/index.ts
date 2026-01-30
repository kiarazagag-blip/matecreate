import fs from 'fs';
import path from 'path';
import type {
  User,
  Goal,
  Target,
  Method,
  Action,
  Review,
  CreateGoalData,
  CreateTargetData,
  CreateActionData,
  CreateMethodData
} from '$lib/types';

const DB_PATH = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_PATH, 'db.json');

interface Database {
  users: User[];
  goals: Goal[];
  targets: Target[];
  methods: Method[];
  actions: Action[];
  reviews: Review[];
}

// In-memory fallback for serverless environments
let inMemoryDb: Database | null = null;
let useFileSystem = true;

// Initialize database
function initDb(): Database {
  // If we already determined filesystem isn't available, use in-memory
  if (!useFileSystem) {
    if (!inMemoryDb) {
      inMemoryDb = getInitialData();
    }
    return inMemoryDb;
  }

  // Try to use filesystem
  try {
    if (!fs.existsSync(DB_PATH)) {
      fs.mkdirSync(DB_PATH, { recursive: true });
    }

    if (!fs.existsSync(DB_FILE)) {
      const initialData = getInitialData();
      fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
      return initialData;
    }

    return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  } catch (error) {
    // Filesystem not available (serverless environment)
    console.warn('Filesystem not available, using in-memory storage');
    useFileSystem = false;
    if (!inMemoryDb) {
      inMemoryDb = getInitialData();
    }
    return inMemoryDb;
  }
}

function getInitialData(): Database {
  return {
    users: [],
    goals: [],
    targets: [],
    methods: [],
    actions: [],
    reviews: []
  };
}

function saveDb(data: Database): void {
  if (!useFileSystem) {
    inMemoryDb = data;
    return;
  }

  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.warn('Failed to write to filesystem, switching to in-memory storage');
    useFileSystem = false;
    inMemoryDb = data;
  }
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Users & Auth
export function createUser(username: string, password: string): User {
  const db = initDb();

  // Check if username exists
  const existing = db.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  if (existing) {
    throw new Error('Username already exists');
  }

  const user: User = {
    id: generateId('user'),
    username,
    password, // In production, hash this
    createdAt: new Date().toISOString()
  };

  db.users.push(user);
  saveDb(db);
  return user;
}

export function authenticateUser(username: string, password: string): User | null {
  const db = initDb();
  const user = db.users.find(
    (u) => u.username.toLowerCase() === username.toLowerCase() && u.password === password
  );
  return user || null;
}

export function getUserById(id: string): User | null {
  const db = initDb();
  return db.users.find((u) => u.id === id) || null;
}

// Goals
export function getGoals(userId: string): Goal[] {
  const db = initDb();
  return db.goals.filter((g) => g.userId === userId && !g.archivedAt);
}

export function getGoal(id: string): Goal | null {
  const db = initDb();
  return db.goals.find((g) => g.id === id) || null;
}

export function createGoal(userId: string, data: CreateGoalData): Goal {
  const db = initDb();
  const goal: Goal = {
    id: generateId('goal'),
    userId,
    name: data.name,
    description: data.description || null,
    moduleType: data.moduleType,
    createdAt: new Date().toISOString(),
    archivedAt: null
  };
  db.goals.push(goal);
  saveDb(db);
  return goal;
}

// Targets
export function getTargetsByGoal(goalId: string): Target[] {
  const db = initDb();
  return db.targets.filter((t) => t.goalId === goalId && !t.completedAt);
}

export function createTarget(data: CreateTargetData): Target {
  const db = initDb();
  const target: Target = {
    id: generateId('target'),
    goalId: data.goalId,
    name: data.name,
    description: data.description || null,
    measurementUnit: data.measurementUnit,
    targetValue: data.targetValue || null,
    deadline: data.deadline || null,
    createdAt: new Date().toISOString(),
    completedAt: null
  };
  db.targets.push(target);
  saveDb(db);
  return target;
}

export function updateTarget(id: string, data: Partial<CreateTargetData>): Target | null {
  const db = initDb();
  const index = db.targets.findIndex((t) => t.id === id);
  if (index === -1) return null;

  const target = db.targets[index];
  db.targets[index] = {
    ...target,
    name: data.name ?? target.name,
    description: data.description ?? target.description,
    measurementUnit: data.measurementUnit ?? target.measurementUnit,
    targetValue: data.targetValue ?? target.targetValue,
    deadline: data.deadline ?? target.deadline
  };
  saveDb(db);
  return db.targets[index];
}

export function deleteTarget(id: string): void {
  const db = initDb();
  db.targets = db.targets.filter((t) => t.id !== id);
  saveDb(db);
}

// Methods
export function getMethodsByGoal(goalId: string): Method[] {
  const db = initDb();
  return db.methods.filter((m) => m.goalId === goalId && !m.abandonedAt);
}

export function createMethod(data: CreateMethodData): Method {
  const db = initDb();
  const method: Method = {
    id: generateId('method'),
    goalId: data.goalId,
    name: data.name,
    description: data.description,
    createdAt: new Date().toISOString(),
    abandonedAt: null
  };
  db.methods.push(method);
  saveDb(db);
  return method;
}

export function updateMethod(id: string, data: Partial<CreateMethodData>): Method | null {
  const db = initDb();
  const index = db.methods.findIndex((m) => m.id === id);
  if (index === -1) return null;

  const method = db.methods[index];
  db.methods[index] = {
    ...method,
    name: data.name ?? method.name,
    description: data.description ?? method.description
  };
  saveDb(db);
  return db.methods[index];
}

export function deleteMethod(id: string): void {
  const db = initDb();
  db.methods = db.methods.filter((m) => m.id !== id);
  saveDb(db);
}

// Actions
export function getActionsByGoal(goalId: string, limit = 100): Action[] {
  const db = initDb();
  return db.actions
    .filter((a) => a.goalId === goalId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
}

export function getActionsByDateRange(
  goalId: string,
  startDate: string,
  endDate: string
): Action[] {
  const db = initDb();
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  return db.actions
    .filter((a) => {
      if (a.goalId !== goalId) return false;
      const actionDate = new Date(a.date).getTime();
      return actionDate >= start && actionDate <= end;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function createAction(data: CreateActionData): Action {
  const db = initDb();
  const action: Action = {
    id: generateId('action'),
    goalId: data.goalId,
    targetId: data.targetId || null,
    date: data.date,
    value: data.value || null,
    unit: data.unit || null,
    notes: data.notes || null,
    completed: data.completed,
    createdAt: new Date().toISOString()
  };
  db.actions.push(action);
  saveDb(db);
  return action;
}

// Calculate adherence for a goal over a period
export function calculateAdherence(
  goalId: string,
  startDate: string,
  endDate: string
): number {
  const actions = getActionsByDateRange(goalId, startDate, endDate);
  if (actions.length === 0) return 0;

  const completed = actions.filter((a) => a.completed).length;
  return Math.round((completed / actions.length) * 100);
}

// Reviews
export function getReviewsByGoal(goalId: string): Review[] {
  const db = initDb();
  return db.reviews
    .filter((r) => r.goalId === goalId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function createReview(
  goalId: string,
  periodStart: string,
  periodEnd: string,
  progressSummary: string,
  adjustments: string | null = null
): Review {
  const db = initDb();
  const adherencePercent = calculateAdherence(goalId, periodStart, periodEnd);

  const review: Review = {
    id: generateId('review'),
    goalId,
    periodStart,
    periodEnd,
    adherencePercent,
    progressSummary,
    adjustments,
    createdAt: new Date().toISOString()
  };
  db.reviews.push(review);
  saveDb(db);
  return review;
}
