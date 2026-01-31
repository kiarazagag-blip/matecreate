import { review, goal } from '$lib/server/db-index';
import {
  requireAuth,
  parseJsonBody,
  errorResponse,
  jsonResponse
} from '$lib/server/auth';
import type { RequestHandler } from './$types';

// GET /api/reviews?goalId=xxx
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

    const reviews = await review.findByGoalId(goalId);
    return jsonResponse({ reviews });
  } catch (error) {
    return errorResponse((error as Error).message, 401);
  }
};

// POST /api/reviews - Create a new review
export const POST: RequestHandler = async (event) => {
  try {
    const user = await requireAuth(event);
    const data = await parseJsonBody<{
      goalId: string;
      periodStart: string;
      periodEnd: string;
      summary?: string;
    }>(event.request);

    if (!data.goalId || !data.periodStart || !data.periodEnd) {
      return errorResponse('Missing required fields', 400);
    }

    // Verify goal ownership
    const goalData = await goal.findById(data.goalId);
    if (!goalData || goalData.userId !== user.id) {
      return errorResponse('Goal not found or unauthorized', 403);
    }

    const newReview = await review.create(data.goalId, data);
    return jsonResponse(newReview, 201);
  } catch (error) {
    return errorResponse((error as Error).message, error.message === 'Unauthorized' ? 401 : 400);
  }
};
