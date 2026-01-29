import { json } from '@sveltejs/kit';
import { createGoal } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  const data = await request.json();
  const userId = 'user-1'; // Hardcoded for now

  const goal = createGoal(userId, {
    name: data.name,
    description: data.description,
    moduleType: data.moduleType
  });

  return json(goal, { status: 201 });
};
