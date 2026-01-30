import { actionAttempt, goal } from '$lib/server/db-index';
import {
  requireAuth,
  parseJsonBody,
  errorResponse,
  jsonResponse
} from '$lib/server/auth';
import type { RequestHandler } from './$types';

// GET /api/action-attempts?goalId=xxx&startDate=xxx&endDate=xxx
export const GET: RequestHandler = async (event) => {
  try {
    const user = await requireAuth(event);
    const goalId = event.url.searchParams.get('goalId');
    const startDate = event.url.searchParams.get('startDate');
    const endDate = event.url.searchParams.get('endDate');

    if (!goalId) {
      return errorResponse('goalId query parameter is required', 400);
    }

    // Verify goal ownership
    const goalData = goal.findById(goalId);
    if (!goalData || goalData.userId !== user.id) {
      return errorResponse('Goal not found or unauthorized', 403);
    }

    let attempts;
    if (startDate && endDate) {
      attempts = actionAttempt.findByDateRange(goalId, startDate, endDate);
    } else {
      attempts = actionAttempt.findByGoalId(goalId);
    }

    return jsonResponse({ actionAttempts: attempts });
  } catch (error) {
    return errorResponse((error as Error).message, 401);
  }
};

// POST /api/action-attempts - Log a new action attempt
export const POST: RequestHandler = async (event) => {
  try {
    const user = await requireAuth(event);
    const data = await parseJsonBody<{
      actionDefinitionId: string;
      goalId: string;
      date: string;
      actualValue?: number;
      actualUnit?: string;
      notes?: string;
      explicit?: boolean;
    }>(event.request);

    if (!data.actionDefinitionId || !data.goalId || !data.date) {
      return errorResponse('Missing required fields', 400);
    }

    // Verify goal ownership
    const goalData = goal.findById(data.goalId);
    if (!goalData || goalData.userId !== user.id) {
      return errorResponse('Goal not found or unauthorized', 403);
    }

    const attempt = actionAttempt.create(data.actionDefinitionId, data.goalId, {
      date: data.date,
      actualValue: data.actualValue,
      actualUnit: data.actualUnit,
      notes: data.notes,
      explicit: data.explicit
    });

    return jsonResponse(attempt, 201);
  } catch (error) {
    return errorResponse((error as Error).message, error.message === 'Unauthorized' ? 401 : 400);
  }
};
