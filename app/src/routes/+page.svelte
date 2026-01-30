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
      showNewGoalForm = false;
      newGoalName = '';
      window.location.reload();
    }
  }
</script>

<div class="gradient-bg">
  <div class="gradient-blob blob-1"></div>
  <div class="gradient-blob blob-2"></div>
  <div class="gradient-blob blob-3"></div>
  <div class="gradient-blob blob-4"></div>
</div>

<div class="container">
  <header>
    <div class="header-content">
      <div class="logo-section">
        <img src="/logo.png" alt="APEX" class="logo" />
      </div>
      {#if username}
        <div class="user-section">
          <span class="username">@{username}</span>
          <button class="btn btn-secondary logout-btn" on:click={logout}>Logout</button>
        </div>
      {/if}
    </div>
  </header>

  <main>
    {#if loading}
      <div class="loading">Loading...</div>
    {:else if goals.length === 0}
      <div class="empty-state card">
        <h2>No goals yet</h2>
        <p>Start tracking your progress with data-driven goals.</p>
        <button class="btn btn-primary" on:click={() => (showNewGoalForm = true)}>
          Create Your First Goal
        </button>
      </div>
    {:else}
      <div class="goals-header">
        <h2>Your Goals</h2>
        <button class="btn btn-primary" on:click={() => (showNewGoalForm = true)}>
          + New Goal
        </button>
      </div>

      <div class="goals-grid">
        {#each goals as goal}
          <a href="/goal/{goal.id}" class="goal-card card">
            <div class="card-top">
              <span class="module-badge">{goal.moduleType}</span>
            </div>
            <h3>{goal.name}</h3>
            {#if goal.description}
              <p class="goal-description">{goal.description}</p>
            {/if}
            <div class="card-footer">
              <span class="view-link">View details →</span>
            </div>
          </a>
        {/each}
      </div>
    {/if}
  </main>
</div>

{#if showNewGoalForm}
  <div class="modal" on:click={() => (showNewGoalForm = false)}>
    <div class="modal-content card" on:click|stopPropagation>
      <h2>Create New Goal</h2>
      <form on:submit|preventDefault={createGoal}>
        <div class="input-group">
          <label for="goalName">Goal Name</label>
          <input
            id="goalName"
            type="text"
            bind:value={newGoalName}
            required
            placeholder="e.g., Build Strength"
          />
        </div>

        <div class="input-group">
          <label for="module">Module Type</label>
          <select id="module" bind:value={newGoalModule}>
            <option value="fitness">Fitness & Strength</option>
            <option value="recovery">Recovery & Sleep</option>
            <option value="discipline">Discipline & Routines</option>
            <option value="knowledge">Knowledge & Learning</option>
            <option value="work">Strategy & Work</option>
          </select>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" on:click={() => (showNewGoalForm = false)}>
            Cancel
          </button>
          <button type="submit" class="btn btn-primary">Create Goal</button>
        </div>
      </form>
    </div>
  </div>
{/if}

<style>
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
    position: relative;
    z-index: 1;
    min-height: 100vh;
  }

  header {
    padding-bottom: 2rem;
    margin-bottom: 3rem;
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .logo-section .logo {
    height: 32px;
    width: auto;
  }

  .user-section {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .username {
    color: var(--text-secondary);
    font-size: 0.95rem;
    font-weight: 500;
  }

  .logout-btn {
    padding: 0.65rem 1.25rem;
    font-size: 0.85rem;
  }

  .loading {
    text-align: center;
    padding: 4rem 2rem;
    color: var(--text-secondary);
    font-size: 1rem;
  }

  .empty-state {
    text-align: center;
    padding: 4rem 3rem;
    max-width: 500px;
    margin: 4rem auto;
  }

  .empty-state h2 {
    margin: 0 0 1rem 0;
    font-size: 2rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .empty-state p {
    color: var(--text-secondary);
    margin: 0 0 2rem 0;
    font-size: 1.05rem;
    line-height: 1.6;
  }

  .goals-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }

  .goals-header h2 {
    margin: 0;
    font-size: 2rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .goals-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1.5rem;
  }

  .goal-card {
    text-decoration: none;
    color: inherit;
    display: flex;
    flex-direction: column;
    min-height: 180px;
  }

  .card-top {
    margin-bottom: 1rem;
  }

  .module-badge {
    display: inline-block;
    padding: 0.4rem 0.85rem;
    background: var(--bg-primary);
    border-radius: 50px;
    font-size: 0.75rem;
    color: var(--text-secondary);
    text-transform: capitalize;
    font-weight: 500;
  }

  .goal-card h3 {
    margin: 0 0 0.75rem 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-primary);
    line-height: 1.3;
  }

  .goal-description {
    margin: 0;
    color: var(--text-secondary);
    font-size: 0.95rem;
    line-height: 1.5;
    flex: 1;
  }

  .card-footer {
    margin-top: 1.25rem;
    padding-top: 1rem;
    border-top: 1px solid #f0f0f0;
  }

  .view-link {
    color: var(--text-primary);
    font-size: 0.9rem;
    font-weight: 500;
  }

  .modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal-content {
    max-width: 500px;
    width: 90%;
    padding: 2.5rem;
    animation: slideUp 0.3s ease;
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .modal-content h2 {
    margin: 0 0 2rem 0;
    font-size: 1.75rem;
    font-weight: 600;
    color: var(--text-primary);
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

  input,
  select {
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

  input:focus,
  select:focus {
    outline: none;
    border-color: var(--text-primary);
    background: #fafafa;
  }

  select {
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%236e6e73' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 1rem center;
    padding-right: 3rem;
  }

  .form-actions {
    display: flex;
    gap: 1rem;
    margin-top: 0.5rem;
  }

  .form-actions button {
    flex: 1;
    padding: 1rem;
  }
</style>
