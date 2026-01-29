import { getGoals } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const userId = 'user-1'; // Hardcoded for now
  const goals = getGoals(userId);
  return { goals };
};
