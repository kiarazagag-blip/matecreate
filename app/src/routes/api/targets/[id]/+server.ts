import { target } from '$lib/server/db-index';
import {
  requireAuth,
  parseJsonBody,
  errorResponse,
  jsonResponse
} from '$lib/server/auth';
import type { RequestHandler } from './$types';

// PATCH /api/targets/[id] - Update a target
export const PATCH: RequestHandler = async (event) => {
  try {
    await requireAuth(event);
    const data = await parseJsonBody<{
      name?: string;
      description?: string;
      measurementUnit?: string;
      targetValue?: number;
      deadline?: string;
    }>(event.request);

    const updated = target.update(event.params.id, data);

    if (!updated) {
      return errorResponse('Target not found', 404);
    }

    return jsonResponse(updated);
  } catch (error) {
    return errorResponse((error as Error).message, error.message === 'Unauthorized' ? 401 : 400);
  }
};

// DELETE /api/targets/[id] - Delete a target
export const DELETE: RequestHandler = async (event) => {
  try {
    await requireAuth(event);
    target.delete(event.params.id);
    return jsonResponse({ success: true });
  } catch (error) {
    return errorResponse((error as Error).message, 401);
  }
};
