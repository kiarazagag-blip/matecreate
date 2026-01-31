import { goal } from '$lib/server/db-index';
import {
  requireAuth,
  parseJsonBody,
  errorResponse,
  jsonResponse
} from '$lib/server/auth';
import type { RequestHandler } from './$types';

// GET /api/goals/[id] - Get a specific goal
export const GET: RequestHandler = async (event) => {
  try {
    const user = await requireAuth(event);
    const goalData = await goal.findById(event.params.id);

    if (!goalData) {
      return errorResponse('Goal not found', 404);
    }

    // Verify ownership
    if (goalData.userId !== user.id) {
      return errorResponse('Unauthorized', 403);
    }

    return jsonResponse(goalData);
  } catch (error) {
    return errorResponse((error as Error).message, 401);
  }
};

// PATCH /api/goals/[id] - Update a goal
export const PATCH: RequestHandler = async (event) => {
  try {
    const user = await requireAuth(event);
    const goalData = await goal.findById(event.params.id);

    if (!goalData) {
      return errorResponse('Goal not found', 404);
    }

    // Verify ownership
    if (goalData.userId !== user.id) {
      return errorResponse('Unauthorized', 403);
    }

    const data = await parseJsonBody<{
      name?: string;
      description?: string;
      status?: string;
      purposeId?: string;
      startDate?: string;
      endDate?: string;
    }>(event.request);

    const updated = await goal.update(event.params.id, data);
    return jsonResponse(updated);
  } catch (error) {
    return errorResponse((error as Error).message, error.message === 'Unauthorized' ? 401 : 400);
  }
};

// DELETE /api/goals/[id] - Delete a goal
export const DELETE: RequestHandler = async (event) => {
  try {
    const user = await requireAuth(event);
    const goalData = await goal.findById(event.params.id);

    if (!goalData) {
      return errorResponse('Goal not found', 404);
    }

    // Verify ownership
    if (goalData.userId !== user.id) {
      return errorResponse('Unauthorized', 403);
    }

    await goal.delete(event.params.id);
    return jsonResponse({ success: true });
  } catch (error) {
    return errorResponse((error as Error).message, 401);
  }
};
