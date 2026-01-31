import { subTarget, target } from '$lib/server/db-index';
import {
  requireAuth,
  parseJsonBody,
  errorResponse,
  jsonResponse
} from '$lib/server/auth';
import type { RequestHandler } from './$types';

// GET /api/subtargets?targetId=xxx
export const GET: RequestHandler = async (event) => {
  try {
    await requireAuth(event);
    const targetId = event.url.searchParams.get('targetId');

    if (!targetId) {
      return errorResponse('targetId query parameter is required', 400);
    }

    const subTargets = await subTarget.findByTargetId(targetId);
    return jsonResponse({ subTargets });
  } catch (error) {
    return errorResponse((error as Error).message, 401);
  }
};

// POST /api/subtargets - Create a new subtarget
export const POST: RequestHandler = async (event) => {
  try {
    await requireAuth(event);
    const data = await parseJsonBody<{
      targetId: string;
      name: string;
      description?: string;
      measurementUnit?: string;
      targetValue?: number;
      deadline?: string;
    }>(event.request);

    if (!data.targetId || !data.name) {
      return errorResponse('targetId and name are required', 400);
    }

    // Verify target exists
    const targetData = await target.findById(data.targetId);
    if (!targetData) {
      return errorResponse('Target not found', 404);
    }

    const newSubTarget = await subTarget.create(data.targetId, data);
    return jsonResponse(newSubTarget, 201);
  } catch (error) {
    return errorResponse((error as Error).message, error.message === 'Unauthorized' ? 401 : 400);
  }
};
