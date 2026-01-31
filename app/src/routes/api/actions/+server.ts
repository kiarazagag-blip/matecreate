import { goal } from '$lib/server/db-index';
import {
  requireAuth,
  parseJsonBody,
  errorResponse,
  jsonResponse
} from '$lib/server/auth';
import type { RequestHandler } from './$types';

/**
 * LEGACY ENDPOINT - For backward compatibility
 * This endpoint is still used by the goal detail page
 * TODO: Migrate to ActionDefinition/ActionAttempt system
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
      completed: boolean;
    }>(event.request);

    if (!data.goalId || !data.date) {
      return errorResponse('goalId and date are required', 400);
    }

    // Verify goal ownership
    const goalData = await goal.findById(data.goalId);
    if (!goalData || goalData.userId !== user.id) {
      return errorResponse('Goal not found or unauthorized', 403);
    }

    // For now, return a stub response
    // The UI will still work but won't persist data until we migrate to ActionAttempt
    const stubAction = {
      id: `action_${Date.now()}`,
      goalId: data.goalId,
      targetId: data.targetId || null,
      date: data.date,
      value: data.value || null,
      unit: data.unit || null,
      notes: data.notes || null,
      completed: data.completed,
      createdAt: new Date().toISOString()
    };

    return jsonResponse(stubAction, 201);
  } catch (error) {
    return errorResponse((error as Error).message, error.message === 'Unauthorized' ? 401 : 400);
  }
};
