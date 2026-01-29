import { json } from '@sveltejs/kit';
import { createAction } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  const data = await request.json();

  const action = createAction({
    goalId: data.goalId,
    targetId: data.targetId,
    date: data.date,
    value: data.value,
    unit: data.unit,
    notes: data.notes,
    completed: data.completed
  });

  return json(action, { status: 201 });
};
