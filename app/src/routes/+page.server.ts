import { redirect } from '@sveltejs/kit';
import { goal } from '$lib/server/db-index';
import { getUserFromRequest } from '$lib/server/auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
  // Check authentication
  const user = await getUserFromRequest(event);

  if (!user) {
    throw redirect(302, '/auth');
  }

  // Get goals for user
  const goals = goal.findMany(user.id);

  return {
    goals,
    user: {
      userId: user.id,
      username: user.username
    }
  };
};
