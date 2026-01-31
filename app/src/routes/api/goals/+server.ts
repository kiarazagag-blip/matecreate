import { goal } from '$lib/server/db-index';
import {
  requireAuth,
  parseJsonBody,
  errorResponse,
  jsonResponse
} from '$lib/server/auth';
import type { RequestHandler } from './$types';

// GET /api/goals - List all goals for authenticated user
export const GET: RequestHandler = async (event) => {
  try {
    const user = await requireAuth(event);
    const goals = await goal.findMany(user.id);
    return jsonResponse({ goals });
  } catch (error) {
    return errorResponse((error as Error).message, 401);
  }
};

// POST /api/goals - Create a new goal
export const POST: RequestHandler = async (event) => {
  try {
    const user = await requireAuth(event);
    const data = await parseJsonBody<{
      name: string;
      description?: string;
      moduleType: string;
      purposeId?: string;
      startDate?: string;
      endDate?: string;
    }>(event.request);

    if (!data.name || !data.moduleType) {
      return errorResponse('Name and moduleType are required', 400);
    }

    const newGoal = await goal.create(user.id, data);
    return jsonResponse(newGoal, 201);
  } catch (error) {
    return errorResponse((error as Error).message, error.message === 'Unauthorized' ? 401 : 400);
  }
};
