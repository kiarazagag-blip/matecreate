import { redirect } from '@sveltejs/kit';
import { goal, target, method, actionAttempt } from '$lib/server/db-index';
import { getUserFromRequest } from '$lib/server/auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
  // Check authentication
  const user = await getUserFromRequest(event);

  if (!user) {
    throw redirect(302, '/auth');
  }

  // Get goal
  const goalData = await goal.findById(event.params.id);

  if (!goalData) {
    throw redirect(302, '/');
  }

  // Verify ownership
  if (goalData.userId !== user.id) {
    throw redirect(302, '/');
  }

  // Get related data
  const targets = await target.findByGoalId(goalData.id);
  const methods = await method.findByGoalId(goalData.id);
  const attempts = await actionAttempt.findByGoalId(goalData.id, 30); // Last 30 attempts

  // Calculate adherence for last 7 days
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const recentAttempts = await actionAttempt.findByDateRange(
    goalData.id,
    sevenDaysAgo.toISOString(),
    now.toISOString()
  );

  let adherence = 0;
  if (recentAttempts.length > 0) {
    const completeCount = recentAttempts.filter((a) => a.disciplineVerdict === 'complete').length;
    adherence = Math.round((completeCount / recentAttempts.length) * 100);
  }

  return {
    goal: goalData,
    targets,
    methods,
    actions: attempts, // Keep 'actions' key for backward compatibility with page component
    adherence,
    user: {
      userId: user.id,
      username: user.username
    }
  };
};
