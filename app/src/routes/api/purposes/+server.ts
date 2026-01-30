import { purpose } from '$lib/server/db-index';
import {
  requireAuth,
  parseJsonBody,
  errorResponse,
  jsonResponse
} from '$lib/server/auth';
import type { RequestHandler } from './$types';

// GET /api/purposes - List all purposes for authenticated user
export const GET: RequestHandler = async (event) => {
  try {
    const user = await requireAuth(event);
    const purposes = purpose.findMany(user.id);
    return jsonResponse({ purposes });
  } catch (error) {
    return errorResponse((error as Error).message, 401);
  }
};

// POST /api/purposes - Create a new purpose
export const POST: RequestHandler = async (event) => {
  try {
    const user = await requireAuth(event);
    const data = await parseJsonBody<{
      name: string;
      description?: string;
    }>(event.request);

    if (!data.name) {
      return errorResponse('Name is required', 400);
    }

    const newPurpose = purpose.create(user.id, data);
    return jsonResponse(newPurpose, 201);
  } catch (error) {
    return errorResponse((error as Error).message, error.message === 'Unauthorized' ? 401 : 400);
  }
};
