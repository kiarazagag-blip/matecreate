import { method } from '$lib/server/db-index';
import {
  requireAuth,
  parseJsonBody,
  errorResponse,
  jsonResponse
} from '$lib/server/auth';
import type { RequestHandler } from './$types';

// PATCH /api/methods/[id] - Update a method
export const PATCH: RequestHandler = async (event) => {
  try {
    await requireAuth(event);
    const data = await parseJsonBody<{
      name?: string;
      description?: string;
    }>(event.request);

    const updated = await method.update(event.params.id, data);

    if (!updated) {
      return errorResponse('Method not found', 404);
    }

    return jsonResponse(updated);
  } catch (error) {
    return errorResponse((error as Error).message, error.message === 'Unauthorized' ? 401 : 400);
  }
};

// DELETE /api/methods/[id] - Delete a method
export const DELETE: RequestHandler = async (event) => {
  try {
    await requireAuth(event);
    await method.delete(event.params.id);
    return jsonResponse({ success: true });
  } catch (error) {
    return errorResponse((error as Error).message, 401);
  }
};
