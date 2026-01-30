import { json } from '@sveltejs/kit';
import { authenticateUser } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  const data = await request.json();
  const { username, password } = data;

  if (!username || !password) {
    return json({ error: 'Username and password required' }, { status: 400 });
  }

  const user = authenticateUser(username, password);

  if (!user) {
    return json({ error: 'Invalid credentials' }, { status: 401 });
  }

  return json({
    userId: user.id,
    username: user.username
  });
};
