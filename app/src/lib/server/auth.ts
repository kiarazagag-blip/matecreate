/**
 * Authentication Middleware and Utilities
 * Session-based auth with HttpOnly cookies
 */

import { parse, serialize, type CookieSerializeOptions } from 'cookie';
import { session, user as userDb, type User, type Session } from './db-index';
import type { RequestEvent } from '@sveltejs/kit';

const COOKIE_NAME = 'apex_session';
const COOKIE_OPTIONS: CookieSerializeOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 60 * 60 * 24 * 30 // 30 days
};

/**
 * Get session from request cookies
 */
export function getSessionFromCookies(cookies: string | null): Session | null {
  if (!cookies) return null;

  const parsed = parse(cookies);
  const token = parsed[COOKIE_NAME];

  if (!token) return null;

  return session.findByToken(token);
}

/**
 * Get user from request event
 */
export async function getUserFromRequest(event: RequestEvent): Promise<User | null> {
  const cookieHeader = event.request.headers.get('cookie');
  const sess = getSessionFromCookies(cookieHeader);

  if (!sess) return null;

  return userDb.findById(sess.userId);
}

/**
 * Require authentication - throws error if not authenticated
 */
export async function requireAuth(event: RequestEvent): Promise<User> {
  const user = await getUserFromRequest(event);

  if (!user) {
    throw new Error('Unauthorized');
  }

  return user;
}

/**
 * Set session cookie
 */
export function setSessionCookie(token: string): string {
  return serialize(COOKIE_NAME, token, COOKIE_OPTIONS);
}

/**
 * Clear session cookie
 */
export function clearSessionCookie(): string {
  return serialize(COOKIE_NAME, '', {
    ...COOKIE_OPTIONS,
    maxAge: 0
  });
}

/**
 * Create JSON error response
 */
export function errorResponse(message: string, status = 400): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Create JSON success response
 */
export function jsonResponse(data: any, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  });
}

/**
 * Validate request has JSON body
 */
export async function parseJsonBody<T = any>(request: Request): Promise<T> {
  try {
    return await request.json();
  } catch {
    throw new Error('Invalid JSON body');
  }
}
