import { goal, actionDefinition, actionAttempt } from '$lib/server/db-index';
import {
  requireAuth,
  parseJsonBody,
  errorResponse,
  jsonResponse
} from '$lib/server/auth';
import type { RequestHandler } from './$types';

/**
 * Simple action logging endpoint
 * Creates a default ActionDefinition if needed, then logs an ActionAttempt
 */
export const POST: RequestHandler = async (event) => {
  try {
    const user = await requireAuth(event);
    const data = await parseJsonBody<{
      goalId: string;
      targetId?: string;
      date: string;
      value?: number;
      unit?: string;
      notes?: string;
      completed?: boolean;
    }>(event.request);

    if (!data.goalId || !data.date) {
      return errorResponse('goalId and date are required', 400);
    }

    // Verify goal ownership
    const goalData = await goal.findById(data.goalId);
    if (!goalData || goalData.userId !== user.id) {
      return errorResponse('Goal not found or unauthorized', 403);
    }

    // Create or find a default action definition for this goal
    const definitions = await actionDefinition.findByGoalId(data.goalId);
    let defaultDefinition = definitions.find((d) => d.name === 'Default Action');

    if (!defaultDefinition) {
      defaultDefinition = await actionDefinition.create(data.goalId, {
        name: 'Default Action',
        scheduleType: 'daily',
        scheduleConfig: {},
        completionRuleType: 'binary_exact',
        completionRuleConfig: {}
      });
    }

    // Create the action attempt
    const attempt = await actionAttempt.create(defaultDefinition.id, data.goalId, {
      date: data.date,
      actualValue: data.value,
      actualUnit: data.unit,
      notes: data.notes,
      explicit: data.completed !== false
    });

    return jsonResponse(attempt, 201);
  } catch (error) {
    return errorResponse((error as Error).message, error.message === 'Unauthorized' ? 401 : 400);
  }
};
