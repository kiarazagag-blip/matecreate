import { json } from '@sveltejs/kit';
import { createMethod } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  const data = await request.json();

  const method = createMethod({
    goalId: data.goalId,
    name: data.name,
    description: data.description
  });

  return json(method, { status: 201 });
};
