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

<div class="auth-screen">
  <div class="mountain-bg"></div>

  <div class="auth-content">
    <div class="auth-form">
      <h1 class="auth-title">{mode === 'login' ? 'Login' : 'Sign Up'}</h1>

      <form on:submit|preventDefault={handleSubmit}>
        <div class="input-group">
          <label for="username">username</label>
          <input
            id="username"
            type="text"
            bind:value={username}
            required
            autocomplete="username"
          />
        </div>

        <div class="input-group">
          <label for="password">password</label>
          <input
            id="password"
            type="password"
            bind:value={password}
            required
            autocomplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
        </div>

        {#if error}
          <div class="error">{error}</div>
        {/if}

        <button type="submit" class="btn-submit" disabled={loading}>
          {loading ? 'Processing...' : 'Get Started'}
        </button>
      </form>

      {#if mode === 'login'}
        <button
          class="link-btn"
          on:click={() => { mode = 'signup'; error = ''; }}
        >
          new user? sign up here
        </button>
      {:else}
        <button
          class="link-btn"
          on:click={() => { mode = 'login'; error = ''; }}
        >
          already have an account? login here
        </button>
      {/if}
    </div>
  </div>
</div>

<style>
  .auth-screen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .mountain-bg {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: url('/mountain-bg.png');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
  }

  .mountain-bg::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 60%;
    background: linear-gradient(to top, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.7) 50%, transparent 100%);
  }

  .auth-content {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 450px;
    padding: 2rem;
  }

  .auth-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .auth-title {
    font-size: 2.5rem;
    font-weight: 700;
    color: #1a1a1a;
    margin: 0 0 1.5rem 0;
    text-align: center;
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .input-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  label {
    color: #1a1a1a;
    font-size: 0.9rem;
    font-weight: 500;
    text-transform: lowercase;
  }

  input {
    padding: 1.1rem 1.25rem;
    background: #1a1a1a;
    border: none;
    border-radius: 16px;
    color: white;
    font-size: 1rem;
    font-family: inherit;
    transition: all 0.2s ease;
  }

  input::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  input:focus {
    outline: none;
    background: #2d2d2d;
  }

  .btn-submit {
    background: #1a1a1a;
    color: white;
    border: none;
    padding: 1.2rem;
    border-radius: 50px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    font-family: inherit;
    margin-top: 0.5rem;
  }

  .btn-submit:hover {
    background: #2d2d2d;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
  }

  .btn-submit:active {
    transform: translateY(0);
  }

  .btn-submit:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  .link-btn {
    background: none;
    border: none;
    color: #6e6e73;
    font-size: 0.9rem;
    cursor: pointer;
    padding: 0.5rem;
    text-align: center;
    font-family: inherit;
    transition: color 0.2s ease;
  }

  .link-btn:hover {
    color: #1a1a1a;
  }

  .error {
    padding: 0.85rem 1.25rem;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 12px;
    color: #c53030;
    font-size: 0.9rem;
    text-align: center;
  }

  @media (max-width: 768px) {
    .auth-title {
      font-size: 2rem;
    }

    .auth-content {
      padding: 1.5rem;
    }
  }
</style>
