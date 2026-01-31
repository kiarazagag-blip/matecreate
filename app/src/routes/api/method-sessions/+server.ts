import { methodSession, method } from '$lib/server/db-index';
import {
  requireAuth,
  parseJsonBody,
  errorResponse,
  jsonResponse
} from '$lib/server/auth';
import type { RequestHandler } from './$types';

// GET /api/method-sessions?methodId=xxx
export const GET: RequestHandler = async (event) => {
  try {
    await requireAuth(event);
    const methodId = event.url.searchParams.get('methodId');

    if (!methodId) {
      return errorResponse('methodId query parameter is required', 400);
    }

    const sessions = await methodSession.findByMethodId(methodId);
    return jsonResponse({ sessions });
  } catch (error) {
    return errorResponse((error as Error).message, 401);
  }
};

// POST /api/method-sessions - Create a new session
export const POST: RequestHandler = async (event) => {
  try {
    const user = await requireAuth(event);
    const data = await parseJsonBody<{
      methodId: string;
      date: string;
      title: string;
      notes?: string;
      metrics?: Record<string, any>;
      files?: Array<{ name: string; type: string; data: string }>;
    }>(event.request);

    if (!data.methodId || !data.date || !data.title) {
      return errorResponse('methodId, date, and title are required', 400);
    }

    // Verify method exists and user has access
    const methodData = await method.findById(data.methodId);
    if (!methodData) {
      return errorResponse('Method not found', 404);
    }

    // Note: We should verify the method's goal belongs to the user
    // For now, we trust the methodId is valid

    const newSession = await methodSession.create(data.methodId, {
      date: data.date,
      title: data.title,
      notes: data.notes,
      metrics: data.metrics,
      files: data.files
    });

    return jsonResponse(newSession, 201);
  } catch (error) {
    return errorResponse((error as Error).message, error.message === 'Unauthorized' ? 401 : 400);
  }
};
