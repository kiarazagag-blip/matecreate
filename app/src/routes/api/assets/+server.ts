import { asset } from '$lib/server/db-index';
import {
  requireAuth,
  parseJsonBody,
  errorResponse,
  jsonResponse
} from '$lib/server/auth';
import type { RequestHandler } from './$types';

// GET /api/assets?goalId=xxx (optional goalId filter)
export const GET: RequestHandler = async (event) => {
  try {
    const user = await requireAuth(event);
    const goalId = event.url.searchParams.get('goalId');

    let assets;
    if (goalId) {
      assets = await asset.findByGoalId(goalId);
    } else {
      assets = await asset.findByUserId(user.id);
    }

    return jsonResponse({ assets });
  } catch (error) {
    return errorResponse((error as Error).message, 401);
  }
};

// POST /api/assets - Create a new asset
export const POST: RequestHandler = async (event) => {
  try {
    const user = await requireAuth(event);
    const data = await parseJsonBody<{
      name: string;
      description?: string;
      category: string;
      quantity?: string;
      expiresAt?: string;
      goalId?: string;
    }>(event.request);

    if (!data.name || !data.category) {
      return errorResponse('Name and category are required', 400);
    }

    const newAsset = await asset.create(user.id, data);
    return jsonResponse(newAsset, 201);
  } catch (error) {
    return errorResponse((error as Error).message, error.message === 'Unauthorized' ? 401 : 400);
  }
};
