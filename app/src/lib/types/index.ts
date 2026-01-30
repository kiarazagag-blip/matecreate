// Core data types for Apex Virtus System

export interface User {
  id: string;
  username: string;
  password: string; // In production, this would be hashed
  createdAt: string;
}

export interface Goal {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  moduleType: string;
  createdAt: string;
  archivedAt: string | null;
}

export interface Target {
  id: string;
  goalId: string;
  name: string;
  description: string | null;
  measurementUnit: string;
  targetValue: number | null;
  deadline: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface Method {
  id: string;
  goalId: string;
  name: string;
  description: string;
  createdAt: string;
  abandonedAt: string | null;
}

export interface Action {
  id: string;
  goalId: string;
  targetId: string | null;
  date: string;
  value: number | null;
  unit: string | null;
  notes: string | null;
  completed: boolean;
  createdAt: string;
}

export interface Review {
  id: string;
  goalId: string;
  periodStart: string;
  periodEnd: string;
  adherencePercent: number;
  progressSummary: string;
  adjustments: string | null;
  createdAt: string;
}

export interface Module {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

// Form data types
export interface CreateGoalData {
  name: string;
  description?: string;
  moduleType: string;
}

export interface CreateTargetData {
  goalId: string;
  name: string;
  description?: string;
  measurementUnit: string;
  targetValue?: number;
  deadline?: string;
}

export interface CreateActionData {
  goalId: string;
  targetId?: string;
  date: string;
  value?: number;
  unit?: string;
  notes?: string;
  completed: boolean;
}

export interface CreateMethodData {
  goalId: string;
  name: string;
  description: string;
}
