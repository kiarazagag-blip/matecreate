<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  onMount(() => {
    // Check if user is logged in
    const userId = localStorage.getItem('userId');
    if (userId) {
      // User is logged in, go to home
      setTimeout(() => goto('/'), 1500);
    } else {
      // Not logged in, go to auth
      setTimeout(() => goto('/auth'), 1500);
    }
  });
</script>

<div class="gradient-bg">
  <div class="gradient-blob blob-1"></div>
  <div class="gradient-blob blob-2"></div>
  <div class="gradient-blob blob-3"></div>
  <div class="gradient-blob blob-4"></div>
</div>

<div class="splash">
  <div class="logo-container">
    <img src="/logo-wordmark.png" alt="APEX" class="logo" />
    <div class="tagline">Execution. Data. Responsibility.</div>
  </div>
</div>

<style>
  .splash {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1;
  }

  .logo-container {
    text-align: center;
    animation: fadeIn 0.8s ease-in;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .logo {
    width: 200px;
    height: auto;
    display: block;
    margin: 0 auto;
  }

  .tagline {
    font-size: 0.85rem;
    font-weight: 400;
    color: var(--text-secondary);
    margin-top: 1.5rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
  }
</style>
