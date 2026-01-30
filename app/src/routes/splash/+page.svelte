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

<div class="splash">
  <div class="logo">
    <h1>APEX VIRTUS</h1>
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
    background: #1a1a1c;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .logo {
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

  h1 {
    font-family: 'Nebulica', sans-serif;
    font-size: 3.5rem;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.95);
    margin: 0;
    letter-spacing: 0.1em;
  }

  .tagline {
    font-family: 'Nebulica', sans-serif;
    font-size: 0.85rem;
    font-weight: 300;
    color: rgba(255, 255, 255, 0.5);
    margin-top: 1rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
  }
</style>
