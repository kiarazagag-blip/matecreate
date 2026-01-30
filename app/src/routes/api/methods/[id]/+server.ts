import { json } from '@sveltejs/kit';
import { updateMethod, deleteMethod } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const PUT: RequestHandler = async ({ params, request }) => {
  const data = await request.json();
  const methodId = params.id;

  const method = updateMethod(methodId, {
    name: data.name,
    description: data.description
  });

  return json(method);
};

export const DELETE: RequestHandler = async ({ params }) => {
  const methodId = params.id;
  deleteMethod(methodId);
  return json({ success: true });
};
