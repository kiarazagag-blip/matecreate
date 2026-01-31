/**
 * Method Sessions - Track training sessions, notes, and files per method
 */

import { prisma } from './prisma';

export const methodSession = {
  create: async (
    methodId: string,
    data: {
      date: string;
      title: string;
      notes?: string;
      metrics?: Record<string, any>;
      files?: Array<{ name: string; type: string; data: string }>;
    }
  ) => {
    return await prisma.methodSession.create({
      data: {
        methodId,
        date: new Date(data.date),
        title: data.title,
        notes: data.notes,
        metrics: data.metrics ? JSON.stringify(data.metrics) : null,
        files: data.files ? JSON.stringify(data.files) : null
      }
    });
  },

  findByMethodId: async (methodId: string, limit = 50) => {
    const sessions = await prisma.methodSession.findMany({
      where: { methodId },
      orderBy: { date: 'desc' },
      take: limit
    });

    return sessions.map((s) => ({
      ...s,
      metrics: s.metrics ? JSON.parse(s.metrics) : null,
      files: s.files ? JSON.parse(s.files) : null
    }));
  },

  findById: async (id: string) => {
    const session = await prisma.methodSession.findUnique({
      where: { id }
    });

    if (!session) return null;

    return {
      ...session,
      metrics: session.metrics ? JSON.parse(session.metrics) : null,
      files: session.files ? JSON.parse(session.files) : null
    };
  },

  update: async (
    id: string,
    data: {
      title?: string;
      notes?: string;
      metrics?: Record<string, any>;
      files?: Array<{ name: string; type: string; data: string }>;
    }
  ) => {
    return await prisma.methodSession.update({
      where: { id },
      data: {
        title: data.title,
        notes: data.notes,
        metrics: data.metrics ? JSON.stringify(data.metrics) : undefined,
        files: data.files ? JSON.stringify(data.files) : undefined
      }
    });
  },

  delete: async (id: string) => {
    await prisma.methodSession.delete({
      where: { id }
    });
  },

  // Get metrics summary for a method
  getMetricsSummary: async (methodId: string) => {
    const sessions = await prisma.methodSession.findMany({
      where: { methodId },
      orderBy: { date: 'asc' }
    });

    const metricsData: Record<string, Array<{ date: Date; value: number }>> = {};

    sessions.forEach((session) => {
      if (!session.metrics) return;

      const metrics = JSON.parse(session.metrics);
      Object.entries(metrics).forEach(([key, value]) => {
        if (typeof value === 'number') {
          if (!metricsData[key]) {
            metricsData[key] = [];
          }
          metricsData[key].push({
            date: session.date,
            value: value
          });
        }
      });
    });

    return metricsData;
  }
};
