import { session } from '$lib/server/db-index';
import {
  getSessionFromCookies,
  clearSessionCookie,
  jsonResponse
} from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  const cookieHeader = request.headers.get('cookie');
  const sess = getSessionFromCookies(cookieHeader);

  if (sess) {
    // Delete session from database
    session.delete(sess.token);
  }

  // Clear session cookie
  return jsonResponse(
    { success: true },
    200,
    {
      'Set-Cookie': clearSessionCookie()
    }
  );
};
