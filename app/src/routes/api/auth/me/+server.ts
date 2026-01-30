import { getUserFromRequest, errorResponse, jsonResponse } from '$lib/server/auth';
import type { RequestHandler } from './$types';

/**
 * GET /api/auth/me - Get current authenticated user
 */
export const GET: RequestHandler = async (event) => {
  try {
    const user = await getUserFromRequest(event);

    if (!user) {
      return errorResponse('Not authenticated', 401);
    }

    // Don't return password hash
    return jsonResponse({
      userId: user.id,
      username: user.username
    });
  } catch (error) {
    return errorResponse((error as Error).message, 500);
  }
};
