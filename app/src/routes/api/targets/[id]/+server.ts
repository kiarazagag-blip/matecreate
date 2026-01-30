import { json } from '@sveltejs/kit';
import { updateTarget, deleteTarget } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const PUT: RequestHandler = async ({ params, request }) => {
  const data = await request.json();
  const targetId = params.id;

  const target = updateTarget(targetId, {
    name: data.name,
    description: data.description,
    measurementUnit: data.measurementUnit,
    targetValue: data.targetValue,
    deadline: data.deadline
  });

  return json(target);
};

export const DELETE: RequestHandler = async ({ params }) => {
  const targetId = params.id;
  deleteTarget(targetId);
  return json({ success: true });
};
