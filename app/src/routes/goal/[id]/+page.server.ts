import { error } from '@sveltejs/kit';
import {
  getGoal,
  getTargetsByGoal,
  getMethodsByGoal,
  getActionsByGoal,
  calculateAdherence
} from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const goal = getGoal(params.id);

  if (!goal) {
    throw error(404, 'Goal not found');
  }

  const targets = getTargetsByGoal(params.id);
  const methods = getMethodsByGoal(params.id);
  const actions = getActionsByGoal(params.id, 30); // Last 30 actions

  // Calculate adherence for last 7 days
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const adherence = calculateAdherence(
    params.id,
    sevenDaysAgo.toISOString(),
    now.toISOString()
  );

  return {
    goal,
    targets,
    methods,
    actions,
    adherence
  };
};
