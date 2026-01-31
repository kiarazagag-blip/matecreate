import { actionAttempt, methodSession } from '$lib/server/db-index';
import { requireAuth, errorResponse, jsonResponse } from '$lib/server/auth';
import type { RequestHandler } from './$types';

// GET /api/metrics?goalId=xxx&type=actions|method&methodId=xxx
export const GET: RequestHandler = async (event) => {
  try {
    await requireAuth(event);
    const goalId = event.url.searchParams.get('goalId');
    const type = event.url.searchParams.get('type') || 'actions';
    const methodId = event.url.searchParams.get('methodId');

    if (!goalId && !methodId) {
      return errorResponse('goalId or methodId is required', 400);
    }

    if (type === 'actions' && goalId) {
      // Get action attempts for charting
      const attempts = await actionAttempt.findByGoalId(goalId, 100);

      // Group by date and calculate metrics
      const metricsData: Record<
        string,
        Array<{ date: string; value: number | null; verdict: string }>
      > = {};

      attempts.forEach((attempt) => {
        const dateKey = attempt.date.toISOString().split('T')[0];
        const unit = attempt.actualUnit || 'value';

        if (!metricsData[unit]) {
          metricsData[unit] = [];
        }

        metricsData[unit].push({
          date: dateKey,
          value: attempt.actualValue,
          verdict: attempt.disciplineVerdict
        });
      });

      // Also calculate adherence over time (7-day rolling window)
      const adherenceData: Array<{ date: string; adherence: number }> = [];
      const sortedAttempts = [...attempts].sort(
        (a, b) => a.date.getTime() - b.date.getTime()
      );

      for (let i = 6; i < sortedAttempts.length; i++) {
        const window = sortedAttempts.slice(i - 6, i + 1);
        const completeCount = window.filter((a) => a.disciplineVerdict === 'complete').length;
        const adherence = (completeCount / window.length) * 100;

        adherenceData.push({
          date: sortedAttempts[i].date.toISOString().split('T')[0],
          adherence: Math.round(adherence)
        });
      }

      return jsonResponse({
        metrics: metricsData,
        adherence: adherenceData
      });
    } else if (type === 'method' && methodId) {
      // Get method session metrics
      const metricsSummary = await methodSession.getMetricsSummary(methodId);

      // Format for charting
      const formattedMetrics: Record<
        string,
        Array<{ date: string; value: number }>
      > = {};

      Object.entries(metricsSummary).forEach(([metric, dataPoints]) => {
        formattedMetrics[metric] = dataPoints.map((dp) => ({
          date: dp.date.toISOString().split('T')[0],
          value: dp.value
        }));
      });

      return jsonResponse({
        metrics: formattedMetrics
      });
    }

    return errorResponse('Invalid request', 400);
  } catch (error) {
    return errorResponse((error as Error).message, 401);
  }
};
