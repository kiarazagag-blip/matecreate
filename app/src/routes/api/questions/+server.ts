import { question } from '$lib/server/db-index';
import { requireAuth, errorResponse, jsonResponse } from '$lib/server/auth';
import type { RequestHandler } from './$types';

// GET /api/questions?scope=xxx (optional scope filter)
export const GET: RequestHandler = async (event) => {
  try {
    await requireAuth(event);
    const scope = event.url.searchParams.get('scope');

    let questions;
    if (scope) {
      questions = question.findByScope(scope);
    } else {
      questions = question.findAll();
    }

    return jsonResponse({ questions });
  } catch (error) {
    return errorResponse((error as Error).message, 401);
  }
};
