import { goto } from '$app/navigation';
import { browser } from '$app/environment';

export function getUserId(): string | null {
  if (!browser) return null;
  return localStorage.getItem('userId');
}

export function getUsername(): string | null {
  if (!browser) return null;
  return localStorage.getItem('username');
}

export function logout() {
  if (!browser) return;
  localStorage.removeItem('userId');
  localStorage.removeItem('username');
  goto('/auth');
}

export function requireAuth() {
  if (!browser) return;
  const userId = getUserId();
  if (!userId) {
    goto('/auth');
  }
}
