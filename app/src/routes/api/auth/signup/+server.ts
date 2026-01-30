import { json } from '@sveltejs/kit';
import { createUser, authenticateUser } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  const data = await request.json();
  const { username, password } = data;

  if (!username || !password) {
    return json({ error: 'Username and password required' }, { status: 400 });
  }

  try {
    const user = createUser(username, password);
    return json({
      userId: user.id,
      username: user.username
    }, { status: 201 });
  } catch (error) {
    return json({ error: (error as Error).message }, { status: 400 });
  }
};
