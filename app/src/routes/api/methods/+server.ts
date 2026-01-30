import { method, goal } from '$lib/server/db-index';
import {
  requireAuth,
  parseJsonBody,
  errorResponse,
  jsonResponse
} from '$lib/server/auth';
import type { RequestHandler } from './$types';

// GET /api/methods?goalId=xxx
export const GET: RequestHandler = async (event) => {
  try {
    const user = await requireAuth(event);
    const goalId = event.url.searchParams.get('goalId');

    if (!goalId) {
      return errorResponse('goalId query parameter is required', 400);
    }

    // Verify goal ownership
    const goalData = goal.findById(goalId);
    if (!goalData || goalData.userId !== user.id) {
      return errorResponse('Goal not found or unauthorized', 403);
    }

    const methods = method.findByGoalId(goalId);
    return jsonResponse({ methods });
  } catch (error) {
    return errorResponse((error as Error).message, 401);
  }
};

// POST /api/methods - Create a new method
export const POST: RequestHandler = async (event) => {
  try {
    const user = await requireAuth(event);
    const data = await parseJsonBody<{
      goalId: string;
      name: string;
      description?: string;
    }>(event.request);

    if (!data.goalId || !data.name) {
      return errorResponse('goalId and name are required', 400);
    }

    // Verify goal ownership
    const goalData = goal.findById(data.goalId);
    if (!goalData || goalData.userId !== user.id) {
      return errorResponse('Goal not found or unauthorized', 403);
    }

    const newMethod = method.create(data.goalId, data);
    return jsonResponse(newMethod, 201);
  } catch (error) {
    return errorResponse((error as Error).message, error.message === 'Unauthorized' ? 401 : 400);
  }
};
