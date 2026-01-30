<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  let mode: 'login' | 'signup' = 'login';
  let username = '';
  let password = '';
  let error = '';
  let loading = false;

  onMount(() => {
    // Redirect if already logged in
    const userId = localStorage.getItem('userId');
    if (userId) {
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
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (!res.ok) {
        error = data.error || 'Something went wrong';
        loading = false;
        return;
      }

      // Store user data
      localStorage.setItem('userId', data.userId);
      localStorage.setItem('username', data.username);

      // Redirect to home
      goto('/');
    } catch (err) {
      error = 'Network error';
      loading = false;
    }
  }

  function toggleMode() {
    mode = mode === 'login' ? 'signup' : 'login';
    error = '';
  }
</script>

<div class="auth-container">
  <div class="auth-card">
    <h1>APEX VIRTUS</h1>
    <p class="tagline">Execution. Data. Responsibility.</p>

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
      <label>
        Username
        <input type="text" bind:value={username} required autocomplete="username" />
      </label>

      <label>
        Password
        <input
          type="password"
          bind:value={password}
          required
          autocomplete={mode === 'login' ? 'current-password' : 'new-password'}
        />
      </label>

      {#if error}
        <div class="error">{error}</div>
      {/if}

      <button type="submit" disabled={loading}>
        {loading ? 'Processing...' : mode === 'login' ? 'Login' : 'Create Account'}
      </button>
    </form>
  </div>
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: 'Nebulica', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #1a1a1c;
    color: rgba(255, 255, 255, 0.85);
  }

  .auth-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }

  .auth-card {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    padding: 3rem 2.5rem;
    border-radius: 25px;
    max-width: 400px;
    width: 100%;
  }

  h1 {
    margin: 0 0 0.5rem 0;
    font-size: 2rem;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.95);
    letter-spacing: 0.1em;
    text-align: center;
  }

  .tagline {
    margin: 0 0 2rem 0;
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.75rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    text-align: center;
    font-weight: 300;
  }

  .mode-toggle {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 2rem;
    background: rgba(255, 255, 255, 0.03);
    padding: 0.25rem;
    border-radius: 25px;
  }

  .mode-btn {
    flex: 1;
    background: transparent;
    color: rgba(255, 255, 255, 0.5);
    border: none;
    padding: 0.75rem 1rem;
    font-size: 0.75rem;
    font-weight: 400;
    cursor: pointer;
    border-radius: 25px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    transition: all 0.2s ease;
  }

  .mode-btn.active {
    background: rgba(255, 255, 255, 0.12);
    color: rgba(255, 255, 255, 0.9);
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.85rem;
    font-weight: 400;
  }

  input {
    padding: 0.875rem 1rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 25px;
    color: rgba(255, 255, 255, 0.9);
    font-size: 0.95rem;
    font-family: inherit;
    transition: all 0.2s ease;
  }

  input:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.25);
    background: rgba(255, 255, 255, 0.08);
  }

  button[type='submit'] {
    margin-top: 0.5rem;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.12);
    color: rgba(255, 255, 255, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 25px;
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    transition: all 0.2s ease;
  }

  button[type='submit']:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.18);
    border-color: rgba(255, 255, 255, 0.25);
  }

  button[type='submit']:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .error {
    padding: 0.75rem 1rem;
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 25px;
    color: rgba(239, 68, 68, 0.9);
    font-size: 0.85rem;
    text-align: center;
  }
</style>
