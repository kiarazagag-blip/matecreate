import {
  goal,
  method,
  target,
  actionAttempt,
  tool,
  asset
} from '$lib/server/db-index';
import { requireAuth, errorResponse, jsonResponse } from '$lib/server/auth';
import type { RequestHandler } from './$types';

/**
 * GET /api/goals/[id]/summary
 * Returns computed summary for a goal
 */
export const GET: RequestHandler = async (event) => {
  try {
    const user = await requireAuth(event);
    const goalData = goal.findById(event.params.id);

    if (!goalData) {
      return errorResponse('Goal not found', 404);
    }

    // Verify ownership
    if (goalData.userId !== user.id) {
      return errorResponse('Unauthorized', 403);
    }

    // Get active method
    const methods = method.findByGoalId(goalData.id, false);
    const activeMethod = methods.find((m) => m.status === 'active') || null;

    // Get upcoming deadlines (targets with deadlines in the future)
    const targets = target.findByGoalId(goalData.id, false);
    const now = new Date();
    const upcomingDeadlines = targets
      .filter((t) => t.deadline && new Date(t.deadline) > now)
      .sort((a, b) => {
        if (!a.deadline || !b.deadline) return 0;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      })
      .slice(0, 5);

    // Get tools and assets
    const goalTools = tool.findByGoalId(goalData.id, false);
    const goalAssets = asset.findByGoalId(goalData.id, false);

    // Compute metrics for different time periods
    const periods = [
      { name: 'last7Days', days: 7 },
      { name: 'last14Days', days: 14 },
      { name: 'last30Days', days: 30 }
    ];

    const metrics: Record<string, any> = {};

    for (const period of periods) {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - period.days);

      const attempts = actionAttempt.findByDateRange(
        goalData.id,
        startDate.toISOString(),
        endDate.toISOString()
      );

      let disciplineCompletionRate = null;
      let averageExecutionMagnitude = null;
      let unreviewedFailures = 0;

      if (attempts.length > 0) {
        const completeCount = attempts.filter((a) => a.disciplineVerdict === 'complete').length;
        disciplineCompletionRate = (completeCount / attempts.length) * 100;

        const magnitudes = attempts
          .map((a) => a.executionMagnitudePercent)
          .filter((m): m is number => m !== null);
        if (magnitudes.length > 0) {
          averageExecutionMagnitude =
            magnitudes.reduce((sum, m) => sum + m, 0) / magnitudes.length;
        }

        // Count unreviewed failures (failures with no review answers)
        // This would require joining with review_answers table, simplified for now
        unreviewedFailures = attempts.filter((a) => a.disciplineVerdict === 'incomplete').length;
      }

      metrics[period.name] = {
        totalAttempts: attempts.length,
        disciplineCompletionRate: disciplineCompletionRate
          ? Math.round(disciplineCompletionRate * 10) / 10
          : null,
        averageExecutionMagnitude: averageExecutionMagnitude
          ? Math.round(averageExecutionMagnitude * 10) / 10
          : null,
        unreviewedFailures
      };
    }

    return jsonResponse({
      goal: goalData,
      activeMethod,
      upcomingDeadlines,
      tools: goalTools,
      assets: goalAssets,
      metrics
    });
  } catch (error) {
    return errorResponse((error as Error).message, 401);
  }
};
