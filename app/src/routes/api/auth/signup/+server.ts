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

    // Validate username format
    if (username.length < 3) {
      return errorResponse('Username must be at least 3 characters', 400);
    }

    // Validate password strength
    if (password.length < 8) {
      return errorResponse('Password must be at least 8 characters', 400);
    }

    // Create user with hashed password
    const newUser = await user.create(username, password);

    // Create session
    const newSession = await session.create(newUser.id);

    // Return user data with session cookie
    return jsonResponse(
      {
        userId: newUser.id,
        username: newUser.username
      },
      201,
      {
        'Set-Cookie': setSessionCookie(newSession.token)
      }
    );
  } catch (error) {
    return errorResponse((error as Error).message, 400);
  }
};
