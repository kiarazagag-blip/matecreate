import { user, session } from '$lib/server/db-index';
import {
  parseJsonBody,
  errorResponse,
  jsonResponse,
  setSessionCookie
} from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await parseJsonBody<{ username: string; password: string }>(request);
    const { username, password } = data;

    if (!username || !password) {
      return errorResponse('Username and password required', 400);
    }

    // Authenticate user
    const authenticatedUser = await user.authenticate(username, password);

    if (!authenticatedUser) {
      return errorResponse('Invalid credentials', 401);
    }

    // Create session
    const newSession = session.create(authenticatedUser.id);

    // Return user data with session cookie
    return jsonResponse(
      {
        userId: authenticatedUser.id,
        username: authenticatedUser.username
      },
      200,
      {
        'Set-Cookie': setSessionCookie(newSession.token)
      }
    );
  } catch (error) {
    return errorResponse((error as Error).message, 500);
  }
};
