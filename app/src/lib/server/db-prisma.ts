/**
 * Apex Virtus Database Layer - Prisma Implementation
 * PostgreSQL database with Prisma ORM
 */

import bcrypt from 'bcrypt';
import { prisma } from './prisma';
import { randomBytes } from 'crypto';

// Helper function to generate IDs
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${randomBytes(8).toString('hex')}`;
}

// ============================================================================
// AUTHENTICATION & USERS
// ============================================================================

export const user = {
  create: async (username: string, password: string) => {
    // Check if username exists
    const existing = await prisma.user.findUnique({
      where: { username: username.toLowerCase() }
    });

    if (existing) {
      throw new Error('Username already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    return await prisma.user.create({
      data: {
        username,
        passwordHash
      }
    });
  },

  authenticate: async (username: string, password: string) => {
    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() }
    });

    if (!user) return null;

    const valid = await bcrypt.compare(password, user.passwordHash);
    return valid ? user : null;
  },

  findById: async (id: string) => {
    return await prisma.user.findUnique({
      where: { id }
    });
  },

  findByUsername: async (username: string) => {
    return await prisma.user.findUnique({
      where: { username: username.toLowerCase() }
    });
  }
};

export const session = {
  create: async (userId: string, expiresInDays = 30) => {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    return await prisma.session.create({
      data: {
        userId,
        token,
        expiresAt
      }
    });
  },

  findByToken: async (token: string) => {
    return await prisma.session.findFirst({
      where: {
        token,
        expiresAt: {
          gt: new Date()
        }
      }
    });
  },

  delete: async (token: string) => {
    await prisma.session.deleteMany({
      where: { token }
    });
  },

  deleteAllForUser: async (userId: string) => {
    await prisma.session.deleteMany({
      where: { userId }
    });
  },

  cleanup: async () => {
    await prisma.session.deleteMany({
      where: {
        expiresAt: {
          lte: new Date()
        }
      }
    });
  }
};

// ============================================================================
// PURPOSES
// ============================================================================

export const purpose = {
  create: async (userId: string, data: { name: string; description?: string }) => {
    return await prisma.purpose.create({
      data: {
        userId,
        name: data.name,
        description: data.description
      }
    });
  },

  findMany: async (userId: string, includeArchived = false) => {
    return await prisma.purpose.findMany({
      where: {
        userId,
        ...(includeArchived ? {} : { archivedAt: null })
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  findById: async (id: string) => {
    return await prisma.purpose.findUnique({
      where: { id }
    });
  },

  update: async (id: string, data: { name?: string; description?: string }) => {
    return await prisma.purpose.update({
      where: { id },
      data
    });
  },

  archive: async (id: string) => {
    return await prisma.purpose.update({
      where: { id },
      data: { archivedAt: new Date() }
    });
  },

  delete: async (id: string) => {
    await prisma.purpose.delete({
      where: { id }
    });
  }
};

// ============================================================================
// GOALS
// ============================================================================

export const goal = {
  create: async (
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
  ) => {
    return await prisma.goal.create({
      data: {
        userId,
        name: data.name,
        description: data.description,
        moduleType: data.moduleType,
        purposeId: data.purposeId,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        status: data.status || 'active'
      }
    });
  },

  findMany: async (userId: string, includeArchived = false) => {
    return await prisma.goal.findMany({
      where: {
        userId,
        ...(includeArchived ? {} : { archivedAt: null })
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  findById: async (id: string) => {
    return await prisma.goal.findUnique({
      where: { id }
    });
  },

  update: async (
    id: string,
    data: {
      name?: string;
      description?: string;
      status?: string;
      purposeId?: string;
      startDate?: string;
      endDate?: string;
    }
  ) => {
    return await prisma.goal.update({
      where: { id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined
      }
    });
  },

  archive: async (id: string) => {
    return await prisma.goal.update({
      where: { id },
      data: {
        archivedAt: new Date(),
        status: 'archived'
      }
    });
  },

  delete: async (id: string) => {
    await prisma.goal.delete({
      where: { id }
    });
  }
};

// ============================================================================
// METHODS
// ============================================================================

export const method = {
  create: async (goalId: string, data: { name: string; description?: string }) => {
    return await prisma.method.create({
      data: {
        goalId,
        name: data.name,
        description: data.description
      }
    });
  },

  findByGoalId: async (goalId: string, includeAbandoned = false) => {
    return await prisma.method.findMany({
      where: {
        goalId,
        ...(includeAbandoned ? {} : { abandonedAt: null })
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  findById: async (id: string) => {
    return await prisma.method.findUnique({
      where: { id }
    });
  },

  update: async (id: string, data: { name?: string; description?: string }) => {
    return await prisma.method.update({
      where: { id },
      data
    });
  },

  abandon: async (id: string) => {
    return await prisma.method.update({
      where: { id },
      data: {
        abandonedAt: new Date(),
        status: 'abandoned'
      }
    });
  },

  delete: async (id: string) => {
    await prisma.method.delete({
      where: { id }
    });
  }
};

// ============================================================================
// TARGETS & SUB-TARGETS
// ============================================================================

export const target = {
  create: async (
    goalId: string,
    data: {
      name: string;
      description?: string;
      measurementUnit?: string;
      targetValue?: number;
      deadline?: string;
    }
  ) => {
    return await prisma.target.create({
      data: {
        goalId,
        name: data.name,
        description: data.description,
        measurementUnit: data.measurementUnit,
        targetValue: data.targetValue,
        deadline: data.deadline ? new Date(data.deadline) : null
      }
    });
  },

  findByGoalId: async (goalId: string, includeCompleted = false) => {
    return await prisma.target.findMany({
      where: {
        goalId,
        ...(includeCompleted ? {} : { completedAt: null })
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  findById: async (id: string) => {
    return await prisma.target.findUnique({
      where: { id }
    });
  },

  update: async (
    id: string,
    data: {
      name?: string;
      description?: string;
      measurementUnit?: string;
      targetValue?: number;
      deadline?: string;
    }
  ) => {
    return await prisma.target.update({
      where: { id },
      data: {
        ...data,
        deadline: data.deadline ? new Date(data.deadline) : undefined
      }
    });
  },

  complete: async (id: string) => {
    return await prisma.target.update({
      where: { id },
      data: { completedAt: new Date() }
    });
  },

  delete: async (id: string) => {
    await prisma.target.delete({
      where: { id }
    });
  }
};

export const subTarget = {
  create: async (
    targetId: string,
    data: {
      name: string;
      description?: string;
      measurementUnit?: string;
      targetValue?: number;
      deadline?: string;
    }
  ) => {
    return await prisma.subTarget.create({
      data: {
        targetId,
        name: data.name,
        description: data.description,
        measurementUnit: data.measurementUnit,
        targetValue: data.targetValue,
        deadline: data.deadline ? new Date(data.deadline) : null
      }
    });
  },

  findByTargetId: async (targetId: string, includeCompleted = false) => {
    return await prisma.subTarget.findMany({
      where: {
        targetId,
        ...(includeCompleted ? {} : { completedAt: null })
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  findById: async (id: string) => {
    return await prisma.subTarget.findUnique({
      where: { id }
    });
  },

  update: async (
    id: string,
    data: {
      name?: string;
      description?: string;
      measurementUnit?: string;
      targetValue?: number;
      deadline?: string;
    }
  ) => {
    return await prisma.subTarget.update({
      where: { id },
      data: {
        ...data,
        deadline: data.deadline ? new Date(data.deadline) : undefined
      }
    });
  },

  complete: async (id: string) => {
    return await prisma.subTarget.update({
      where: { id },
      data: { completedAt: new Date() }
    });
  },

  delete: async (id: string) => {
    await prisma.subTarget.delete({
      where: { id }
    });
  }
};

// Export prisma instance for cleanup
export { prisma };
