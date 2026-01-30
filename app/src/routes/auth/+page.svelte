<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { getCurrentUser, clearUserCache } from '$lib/auth';

  let mode: 'login' | 'signup' = 'login';
  let username = '';
  let password = '';
  let error = '';
  let loading = false;

  onMount(async () => {
    // Redirect if already logged in
    const user = await getCurrentUser();
    if (user) {
      goto('/');
    }
  });

  async function handleSubmit() {
    error = '';
    loading = true;

    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (!res.ok) {
        error = data.error || 'Something went wrong';
        loading = false;
        return;
      }

      // Clear user cache to force refetch on next page
      clearUserCache();

      // Redirect to home
      goto('/');
    } catch (err) {
      error = 'Network error';
      loading = false;
    }
  }
</script>

<div class="gradient-bg">
  <div class="gradient-blob blob-1"></div>
  <div class="gradient-blob blob-2"></div>
  <div class="gradient-blob blob-3"></div>
  <div class="gradient-blob blob-4"></div>
</div>

<div class="auth-container">
  <div class="auth-card card">
    <div class="logo-section">
      <img src="/logo.png" alt="APEX" class="logo" />
    </div>

    <div class="mode-toggle">
      <button
        class="mode-btn"
        class:active={mode === 'login'}
        on:click={() => {
          mode = 'login';
          error = '';
        }}
      >
        Login
      </button>
      <button
        class="mode-btn"
        class:active={mode === 'signup'}
        on:click={() => {
          mode = 'signup';
          error = '';
        }}
      >
        Sign Up
      </button>
    </div>

    <form on:submit|preventDefault={handleSubmit}>
      <div class="input-group">
        <label for="username">Username</label>
        <input
          id="username"
          type="text"
          bind:value={username}
          required
          autocomplete="username"
          placeholder="Enter username"
        />
      </div>

      <div class="input-group">
        <label for="password">Password</label>
        <input
          id="password"
          type="password"
          bind:value={password}
          required
          autocomplete={mode === 'login' ? 'current-password' : 'new-password'}
          placeholder="Enter password"
        />
      </div>

      {#if error}
        <div class="error">{error}</div>
      {/if}

      <button type="submit" class="btn btn-primary submit-btn" disabled={loading}>
        {loading ? 'Processing...' : mode === 'login' ? 'Login' : 'Create Account'}
      </button>
    </form>
  </div>
</div>

<style>
  .auth-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    position: relative;
    z-index: 1;
  }

  .auth-card {
    max-width: 420px;
    width: 100%;
    padding: 3rem 2.5rem;
  }

  .logo-section {
    text-align: center;
    margin-bottom: 2.5rem;
  }

  .logo {
    width: 160px;
    height: auto;
  }

  .mode-toggle {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 2rem;
    background: var(--bg-primary);
    padding: 0.35rem;
    border-radius: 50px;
  }

  .mode-btn {
    flex: 1;
    background: transparent;
    color: var(--text-secondary);
    border: none;
    padding: 0.85rem 1.5rem;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    border-radius: 50px;
    transition: all 0.2s ease;
    font-family: inherit;
  }

  .mode-btn.active {
    background: var(--btn-primary-bg);
    color: var(--btn-primary-text);
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .input-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  label {
    color: var(--text-primary);
    font-size: 0.9rem;
    font-weight: 500;
  }

  input {
    padding: 1rem 1.25rem;
    background: var(--bg-primary);
    border: 1px solid #e5e5e7;
    border-radius: 12px;
    color: var(--text-primary);
    font-size: 1rem;
    font-family: inherit;
    transition: all 0.2s ease;
  }

  input::placeholder {
    color: var(--text-tertiary);
  }

  input:focus {
    outline: none;
    border-color: var(--text-primary);
    background: #fafafa;
  }

  .submit-btn {
    margin-top: 0.5rem;
    padding: 1.1rem;
    font-size: 0.95rem;
    font-weight: 600;
  }

  .submit-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  .error {
    padding: 0.85rem 1.25rem;
    background: #fff5f5;
    border: 1px solid #feb2b2;
    border-radius: 12px;
    color: #c53030;
    font-size: 0.9rem;
    text-align: center;
  }
</style>
