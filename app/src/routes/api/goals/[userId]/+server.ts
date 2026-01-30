import { json } from '@sveltejs/kit';
import { getGoals } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
  const userId = params.userId;
  const goals = getGoals(userId);
  return json({ goals });
};
