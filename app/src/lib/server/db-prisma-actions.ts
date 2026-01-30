/**
 * Apex Virtus Database Layer - Actions, Tools, Assets, Reviews (Prisma)
 */

import { prisma } from './prisma';

// ============================================================================
// ACTION DEFINITIONS & ATTEMPTS
// ============================================================================

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
      if (plannedValue === null) {
        return explicit ? 'complete' : 'incomplete';
      } else {
        return actualValue !== null && actualValue >= plannedValue ? 'complete' : 'incomplete';
      }

    case 'threshold_ge':
      const minValue = completionRuleConfig.minValue || plannedValue || 0;
      return actualValue !== null && actualValue >= minValue ? 'complete' : 'incomplete';

    case 'checklist_all':
      return explicit ? 'complete' : 'incomplete';

    default:
      return 'incomplete';
  }
}

/**
 * Compute execution magnitude percentage
 */
export function computeMagnitude(
  plannedValue: number | null,
  actualValue: number | null
): number | null {
  if (plannedValue === null || actualValue === null || plannedValue === 0) {
    return null;
  }

  const magnitude = (actualValue / plannedValue) * 100;
  return Math.max(0, Math.min(magnitude, 200));
}

export const actionDefinition = {
  create: async (
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
  ) => {
    return await prisma.actionDefinition.create({
      data: {
        goalId,
        targetId: data.targetId,
        subTargetId: data.subTargetId,
        name: data.name,
        scheduleType: data.scheduleType,
        scheduleConfig: JSON.stringify(data.scheduleConfig),
        plannedValue: data.plannedValue,
        plannedUnit: data.plannedUnit,
        completionRuleType: data.completionRuleType,
        completionRuleConfig: JSON.stringify(data.completionRuleConfig)
      }
    });
  },

  findByGoalId: async (goalId: string, includeArchived = false) => {
    return await prisma.actionDefinition.findMany({
      where: {
        goalId,
        ...(includeArchived ? {} : { archivedAt: null })
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  findById: async (id: string) => {
    return await prisma.actionDefinition.findUnique({
      where: { id }
    });
  },

  update: async (
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
  ) => {
    return await prisma.actionDefinition.update({
      where: { id },
      data: {
        ...data,
        scheduleConfig: data.scheduleConfig ? JSON.stringify(data.scheduleConfig) : undefined,
        completionRuleConfig: data.completionRuleConfig
          ? JSON.stringify(data.completionRuleConfig)
          : undefined
      }
    });
  },

  archive: async (id: string) => {
    return await prisma.actionDefinition.update({
      where: { id },
      data: { archivedAt: new Date() }
    });
  },

  delete: async (id: string) => {
    await prisma.actionDefinition.delete({
      where: { id }
    });
  }
};

export const actionAttempt = {
  create: async (
    actionDefinitionId: string,
    goalId: string,
    data: {
      date: string;
      actualValue?: number;
      actualUnit?: string;
      notes?: string;
      explicit?: boolean;
    }
  ) => {
    // Get the action definition
    const definition = await prisma.actionDefinition.findUnique({
      where: { id: actionDefinitionId }
    });

    if (!definition) {
      throw new Error('Action definition not found');
    }

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

    return await prisma.actionAttempt.create({
      data: {
        actionDefinitionId,
        goalId,
        date: new Date(data.date),
        plannedValue: definition.plannedValue,
        plannedUnit: definition.plannedUnit,
        actualValue: data.actualValue,
        actualUnit: data.actualUnit,
        executionMagnitudePercent,
        disciplineVerdict,
        notes: data.notes
      }
    });
  },

  findByGoalId: async (goalId: string, limit = 100) => {
    return await prisma.actionAttempt.findMany({
      where: { goalId },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      take: limit
    });
  },

  findByDateRange: async (goalId: string, startDate: string, endDate: string) => {
    return await prisma.actionAttempt.findMany({
      where: {
        goalId,
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      },
      orderBy: { date: 'desc' }
    });
  },

  findById: async (id: string) => {
    return await prisma.actionAttempt.findUnique({
      where: { id }
    });
  },

  findByDefinitionId: async (actionDefinitionId: string, limit = 50) => {
    return await prisma.actionAttempt.findMany({
      where: { actionDefinitionId },
      orderBy: { date: 'desc' },
      take: limit
    });
  },

  update: async (
    id: string,
    data: {
      actualValue?: number;
      actualUnit?: string;
      notes?: string;
    }
  ) => {
    const existing = await prisma.actionAttempt.findUnique({
      where: { id }
    });

    if (!existing) return null;

    // Get definition to recompute verdict
    const definition = await prisma.actionDefinition.findUnique({
      where: { id: existing.actionDefinitionId }
    });

    if (!definition) return null;

    const ruleConfig = JSON.parse(definition.completionRuleConfig);

    // Recompute verdict and magnitude
    const actualValue = data.actualValue !== undefined ? data.actualValue : existing.actualValue;
    const disciplineVerdict = computeVerdict(
      definition.completionRuleType,
      ruleConfig,
      existing.plannedValue,
      actualValue,
      false
    );

    const executionMagnitudePercent = computeMagnitude(existing.plannedValue, actualValue);

    return await prisma.actionAttempt.update({
      where: { id },
      data: {
        actualValue,
        actualUnit: data.actualUnit !== undefined ? data.actualUnit : existing.actualUnit,
        executionMagnitudePercent,
        disciplineVerdict,
        notes: data.notes !== undefined ? data.notes : existing.notes
      }
    });
  },

  delete: async (id: string) => {
    await prisma.actionAttempt.delete({
      where: { id }
    });
  }
};

// ============================================================================
// TOOLS & ASSETS
// ============================================================================

export const tool = {
  create: async (
    userId: string,
    data: {
      name: string;
      description?: string;
      category: string;
      goalId?: string;
    }
  ) => {
    return await prisma.tool.create({
      data: {
        userId,
        goalId: data.goalId,
        name: data.name,
        description: data.description,
        category: data.category
      }
    });
  },

  findByUserId: async (userId: string, includeArchived = false) => {
    return await prisma.tool.findMany({
      where: {
        userId,
        ...(includeArchived ? {} : { archivedAt: null })
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  findByGoalId: async (goalId: string, includeArchived = false) => {
    return await prisma.tool.findMany({
      where: {
        goalId,
        ...(includeArchived ? {} : { archivedAt: null })
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  findById: async (id: string) => {
    return await prisma.tool.findUnique({
      where: { id }
    });
  },

  update: async (
    id: string,
    data: {
      name?: string;
      description?: string;
      category?: string;
    }
  ) => {
    return await prisma.tool.update({
      where: { id },
      data
    });
  },

  archive: async (id: string) => {
    return await prisma.tool.update({
      where: { id },
      data: { archivedAt: new Date() }
    });
  },

  delete: async (id: string) => {
    await prisma.tool.delete({
      where: { id }
    });
  }
};

export const asset = {
  create: async (
    userId: string,
    data: {
      name: string;
      description?: string;
      category: string;
      quantity?: string;
      expiresAt?: string;
      goalId?: string;
    }
  ) => {
    return await prisma.asset.create({
      data: {
        userId,
        goalId: data.goalId,
        name: data.name,
        description: data.description,
        category: data.category,
        quantity: data.quantity,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null
      }
    });
  },

  findByUserId: async (userId: string, includeArchived = false) => {
    return await prisma.asset.findMany({
      where: {
        userId,
        ...(includeArchived ? {} : { archivedAt: null })
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  findByGoalId: async (goalId: string, includeArchived = false) => {
    return await prisma.asset.findMany({
      where: {
        goalId,
        ...(includeArchived ? {} : { archivedAt: null })
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  findById: async (id: string) => {
    return await prisma.asset.findUnique({
      where: { id }
    });
  },

  update: async (
    id: string,
    data: {
      name?: string;
      description?: string;
      category?: string;
      quantity?: string;
      expiresAt?: string;
    }
  ) => {
    return await prisma.asset.update({
      where: { id },
      data: {
        ...data,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined
      }
    });
  },

  archive: async (id: string) => {
    return await prisma.asset.update({
      where: { id },
      data: { archivedAt: new Date() }
    });
  },

  delete: async (id: string) => {
    await prisma.asset.delete({
      where: { id }
    });
  }
};

// ============================================================================
// REVIEWS & QUESTIONS
// ============================================================================

export const review = {
  create: async (
    goalId: string,
    data: {
      periodStart: string;
      periodEnd: string;
      summary?: string;
    }
  ) => {
    // Compute metrics from action attempts
    const attempts = await prisma.actionAttempt.findMany({
      where: {
        goalId,
        date: {
          gte: new Date(data.periodStart),
          lte: new Date(data.periodEnd)
        }
      }
    });

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

    return await prisma.review.create({
      data: {
        goalId,
        periodStart: new Date(data.periodStart),
        periodEnd: new Date(data.periodEnd),
        disciplineCompletionRate,
        averageExecutionMagnitude,
        summary: data.summary
      }
    });
  },

  findByGoalId: async (goalId: string) => {
    return await prisma.review.findMany({
      where: { goalId },
      orderBy: { periodEnd: 'desc' }
    });
  },

  findById: async (id: string) => {
    return await prisma.review.findUnique({
      where: { id }
    });
  },

  update: async (id: string, data: { summary?: string }) => {
    return await prisma.review.update({
      where: { id },
      data
    });
  },

  delete: async (id: string) => {
    await prisma.review.delete({
      where: { id }
    });
  }
};

export const question = {
  create: async (data: {
    scope: string;
    category: string;
    prompt: string;
    answerType: string;
    options?: string[];
  }) => {
    return await prisma.question.create({
      data: {
        scope: data.scope,
        category: data.category,
        prompt: data.prompt,
        answerType: data.answerType,
        options: data.options ? JSON.stringify(data.options) : null
      }
    });
  },

  findAll: async () => {
    return await prisma.question.findMany({
      orderBy: [{ scope: 'asc' }, { category: 'asc' }]
    });
  },

  findByScope: async (scope: string) => {
    return await prisma.question.findMany({
      where: { scope },
      orderBy: { category: 'asc' }
    });
  },

  findById: async (id: string) => {
    return await prisma.question.findUnique({
      where: { id }
    });
  },

  delete: async (id: string) => {
    await prisma.question.delete({
      where: { id }
    });
  }
};

export const reviewAnswer = {
  create: async (data: {
    questionId: string;
    answerValue: string;
    answerType: string;
    reviewId?: string;
    actionAttemptId?: string;
  }) => {
    return await prisma.reviewAnswer.create({
      data: {
        reviewId: data.reviewId,
        actionAttemptId: data.actionAttemptId,
        questionId: data.questionId,
        answerType: data.answerType,
        answerValue: data.answerValue
      }
    });
  },

  findByReviewId: async (reviewId: string) => {
    return await prisma.reviewAnswer.findMany({
      where: { reviewId },
      orderBy: { createdAt: 'asc' }
    });
  },

  findByAttemptId: async (actionAttemptId: string) => {
    return await prisma.reviewAnswer.findMany({
      where: { actionAttemptId },
      orderBy: { createdAt: 'asc' }
    });
  },

  delete: async (id: string) => {
    await prisma.reviewAnswer.delete({
      where: { id }
    });
  }
};
