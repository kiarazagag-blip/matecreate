<script lang="ts">
  import { onMount } from 'svelte';
  import { getUserId, getUsername, logout } from '$lib/auth';
  import { goto } from '$app/navigation';
  import type { Goal } from '$lib/types';

  let goals: Goal[] = [];
  let username = '';
  let loading = true;
  let showNewGoalForm = false;
  let newGoalName = '';
  let newGoalModule = 'fitness';

  onMount(async () => {
    const userId = getUserId();
    username = getUsername() || '';

    if (!userId) {
      goto('/auth');
      return;
    }

    // Fetch goals
    const res = await fetch(`/api/goals/${userId}`);
    if (res.ok) {
      const data = await res.json();
      goals = data.goals;
    }
    loading = false;
  });

  async function createGoal() {
    const userId = getUserId();
    if (!userId) return;

    const res = await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        name: newGoalName,
        moduleType: newGoalModule
      })
    });

    if (res.ok) {
      window.location.reload();
    }
  }
</script>

<div class="container">
  <header>
    <div class="header-content">
      <div>
        <h1>APEX VIRTUS</h1>
        <p class="tagline">Execution. Data. Responsibility.</p>
      </div>
      {#if username}
        <div class="user-section">
          <span class="username">{username}</span>
          <button class="logout-btn" on:click={logout}>Logout</button>
        </div>
      {/if}
    </div>
  </header>

  <main>
    {#if loading}
      <div class="loading">Loading...</div>
    {:else if goals.length === 0}
      <div class="empty-state">
        <p>No goals defined.</p>
        <p>Choose a method. Apply it fully. Track reality.</p>
        <button on:click={() => (showNewGoalForm = true)}>Define Goal</button>
      </div>
    {:else}
      <div class="goals-header">
        <h2>Active Goals</h2>
        <button on:click={() => (showNewGoalForm = true)}>+ New Goal</button>
      </div>

      <div class="goals-grid">
        {#each goals as goal}
          <a href="/goal/{goal.id}" class="goal-card">
            <h3>{goal.name}</h3>
            <span class="module-badge">{goal.moduleType}</span>
            {#if goal.description}
              <p>{goal.description}</p>
            {/if}
          </a>
        {/each}
      </div>
    {/if}

    {#if showNewGoalForm}
      <div class="modal" on:click={() => (showNewGoalForm = false)}>
        <div class="modal-content" on:click|stopPropagation>
          <h2>New Goal</h2>
          <form on:submit|preventDefault={createGoal}>
            <label>
              Goal Name
              <input type="text" bind:value={newGoalName} required />
            </label>

            <label>
              Module
              <select bind:value={newGoalModule}>
                <option value="fitness">Fitness & Strength</option>
                <option value="recovery">Recovery & Sleep</option>
                <option value="discipline">Discipline & Routines</option>
                <option value="knowledge">Knowledge & Learning</option>
                <option value="work">Strategy & Work</option>
              </select>
            </label>

            <div class="form-actions">
              <button type="button" on:click={() => (showNewGoalForm = false)}>Cancel</button>
              <button type="submit">Create</button>
            </div>
          </form>
        </div>
      </div>
    {/if}
  </main>
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: 'Nebulica', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #1a1a1c;
    color: rgba(255, 255, 255, 0.85);
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  header {
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding-bottom: 1rem;
    margin-bottom: 2rem;
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  h1 {
    margin: 0;
    font-size: 2.5rem;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.95);
    letter-spacing: 0.05em;
  }

  .tagline {
    margin: 0.5rem 0 0 0;
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.85rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    font-weight: 300;
  }

  .user-section {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .username {
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.85rem;
    font-weight: 400;
  }

  .logout-btn {
    background: rgba(239, 68, 68, 0.15);
    color: rgba(239, 68, 68, 0.9);
    border: 1px solid rgba(239, 68, 68, 0.3);
    padding: 0.5rem 1rem;
    font-size: 0.7rem;
  }

  .logout-btn:hover {
    background: rgba(239, 68, 68, 0.25);
    border-color: rgba(239, 68, 68, 0.5);
    color: rgba(239, 68, 68, 1);
  }

  .loading {
    text-align: center;
    padding: 4rem 2rem;
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.9rem;
  }

  .empty-state {
    text-align: center;
    padding: 4rem 2rem;
  }

  .empty-state p {
    color: #888;
    margin: 1rem 0;
  }

  .goals-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }

  .goals-header h2 {
    margin: 0;
    color: #fff;
  }

  .goals-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
  }

  .goal-card {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    padding: 1.5rem;
    border-radius: 25px;
    text-decoration: none;
    color: inherit;
    transition: all 0.2s ease;
    backdrop-filter: blur(10px);
  }

  .goal-card:hover {
    border-color: rgba(255, 255, 255, 0.15);
    background: rgba(255, 255, 255, 0.08);
  }

  .goal-card h3 {
    margin: 0 0 0.5rem 0;
    color: #fff;
  }

  .goal-card p {
    margin: 0.5rem 0 0 0;
    color: #888;
    font-size: 0.9rem;
  }

  .module-badge {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 25px;
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.6);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  button {
    background: rgba(255, 255, 255, 0.12);
    color: rgba(255, 255, 255, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.15);
    padding: 0.75rem 1.5rem;
    font-size: 0.75rem;
    font-weight: 400;
    cursor: pointer;
    border-radius: 25px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    transition: all 0.2s ease;
  }

  button:hover {
    background: rgba(255, 255, 255, 0.18);
    border-color: rgba(255, 255, 255, 0.25);
  }

  .modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal-content {
    background: rgba(20, 20, 20, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 2rem;
    border-radius: 25px;
    max-width: 500px;
    width: 90%;
    backdrop-filter: blur(20px);
  }

  .modal-content h2 {
    margin: 0 0 1.5rem 0;
    color: rgba(255, 255, 255, 0.9);
    font-weight: 500;
  }

  form label {
    display: block;
    margin-bottom: 1rem;
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.85rem;
    font-weight: 400;
  }

  form input,
  form select {
    display: block;
    width: 100%;
    padding: 0.75rem;
    margin-top: 0.5rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.85);
    border-radius: 25px;
    font-size: 0.95rem;
    font-family: inherit;
    box-sizing: border-box;
  }

  form select {
    padding-right: 2.5rem;
  }

  form input:focus,
  form select:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.25);
    background: rgba(255, 255, 255, 0.08);
  }

  .form-actions {
    display: flex;
    gap: 1rem;
    margin-top: 1.5rem;
  }

  .form-actions button {
    flex: 1;
  }

  .form-actions button[type='button'] {
    background: transparent;
    color: rgba(255, 255, 255, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.15);
  }

  .form-actions button[type='button']:hover {
    background: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.7);
  }
</style>
