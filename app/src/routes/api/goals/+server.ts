import { json } from '@sveltejs/kit';
import { createGoal } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  const data = await request.json();
  const userId = data.userId;

  if (!userId) {
    return json({ error: 'User ID required' }, { status: 400 });
  }

  const goal = createGoal(userId, {
    name: data.name,
    description: data.description,
    moduleType: data.moduleType
  });

  return json(goal, { status: 201 });
};
