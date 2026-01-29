import { json } from '@sveltejs/kit';
import { createTarget } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  const data = await request.json();

  const target = createTarget({
    goalId: data.goalId,
    name: data.name,
    description: data.description,
    measurementUnit: data.measurementUnit,
    targetValue: data.targetValue,
    deadline: data.deadline
  });

  return json(target, { status: 201 });
};
