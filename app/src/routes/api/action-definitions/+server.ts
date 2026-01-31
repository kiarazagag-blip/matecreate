import { actionDefinition, goal } from '$lib/server/db-index';
import {
  requireAuth,
  parseJsonBody,
  errorResponse,
  jsonResponse
} from '$lib/server/auth';
import type { RequestHandler } from './$types';

// GET /api/action-definitions?goalId=xxx - List action definitions for a goal
export const GET: RequestHandler = async (event) => {
  try {
    const user = await requireAuth(event);
    const goalId = event.url.searchParams.get('goalId');

    if (!goalId) {
      return errorResponse('goalId query parameter is required', 400);
    }

    // Verify goal ownership
    const goalData = await goal.findById(goalId);
    if (!goalData || goalData.userId !== user.id) {
      return errorResponse('Goal not found or unauthorized', 403);
    }

    const definitions = await actionDefinition.findByGoalId(goalId);
    return jsonResponse({ actionDefinitions: definitions });
  } catch (error) {
    return errorResponse((error as Error).message, 401);
  }
};

// POST /api/action-definitions - Create a new action definition
export const POST: RequestHandler = async (event) => {
  try {
    const user = await requireAuth(event);
    const data = await parseJsonBody<{
      goalId: string;
      name: string;
      targetId?: string;
      subTargetId?: string;
      scheduleType: string;
      scheduleConfig: object;
      plannedValue?: number;
      plannedUnit?: string;
      completionRuleType: string;
      completionRuleConfig: object;
    }>(event.request);

    if (!data.goalId || !data.name || !data.scheduleType || !data.completionRuleType) {
      return errorResponse('Missing required fields', 400);
    }

    // Verify goal ownership
    const goalData = await goal.findById(data.goalId);
    if (!goalData || goalData.userId !== user.id) {
      return errorResponse('Goal not found or unauthorized', 403);
    }

    const definition = await actionDefinition.create(data.goalId, data);
    return jsonResponse(definition, 201);
  } catch (error) {
    return errorResponse((error as Error).message, error.message === 'Unauthorized' ? 401 : 400);
  }
};
