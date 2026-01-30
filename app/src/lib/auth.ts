import { goto } from '$app/navigation';
import { browser } from '$app/environment';

let cachedUser: { userId: string; username: string } | null = null;

/**
 * Get current authenticated user from session
 */
export async function getCurrentUser(): Promise<{ userId: string; username: string } | null> {
  if (!browser) return null;

  // Return cached user if available
  if (cachedUser) return cachedUser;

  try {
    const res = await fetch('/api/auth/me', {
      credentials: 'include' // Include cookies
    });

    if (!res.ok) {
      cachedUser = null;
      return null;
    }

    const data = await res.json();
    cachedUser = data;
    return cachedUser;
  } catch {
    cachedUser = null;
    return null;
  }
}

/**
 * Get user ID (async)
 */
export async function getUserId(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.userId || null;
}

/**
 * Get username (async)
 */
export async function getUsername(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.username || null;
}

/**
 * Logout user
 */
export async function logout() {
  if (!browser) return;

  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
  } catch {
    // Ignore errors
  }

  // Clear cache
  cachedUser = null;

  // Redirect to auth
  goto('/auth');
}

/**
 * Clear cached user (call this after login/signup)
 */
export function clearUserCache() {
  cachedUser = null;
}

/**
 * Require authentication (redirect if not authenticated)
 */
export async function requireAuth() {
  if (!browser) return;
  const user = await getCurrentUser();
  if (!user) {
    goto('/auth');
  }
}
