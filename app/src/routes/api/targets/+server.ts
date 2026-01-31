import { target, goal } from '$lib/server/db-index';
import {
  requireAuth,
  parseJsonBody,
  errorResponse,
  jsonResponse
} from '$lib/server/auth';
import type { RequestHandler } from './$types';

// GET /api/targets?goalId=xxx
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

    const targets = await target.findByGoalId(goalId);
    return jsonResponse({ targets });
  } catch (error) {
    return errorResponse((error as Error).message, 401);
  }
};

// POST /api/targets - Create a new target
export const POST: RequestHandler = async (event) => {
  try {
    const user = await requireAuth(event);
    const data = await parseJsonBody<{
      goalId: string;
      name: string;
      description?: string;
      measurementUnit?: string;
      targetValue?: number;
      deadline?: string;
    }>(event.request);

    if (!data.goalId || !data.name) {
      return errorResponse('goalId and name are required', 400);
    }

    // Verify goal ownership
    const goalData = await goal.findById(data.goalId);
    if (!goalData || goalData.userId !== user.id) {
      return errorResponse('Goal not found or unauthorized', 403);
    }

    const newTarget = await target.create(data.goalId, data);
    return jsonResponse(newTarget, 201);
  } catch (error) {
    return errorResponse((error as Error).message, error.message === 'Unauthorized' ? 401 : 400);
  }
};
