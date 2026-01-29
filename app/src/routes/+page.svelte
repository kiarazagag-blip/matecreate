<script lang="ts">
  import type { PageData } from './$types';

  export let data: PageData;

  let showNewGoalForm = false;
  let newGoalName = '';
  let newGoalModule = 'fitness';

  async function createGoal() {
    const res = await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
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
    <h1>APEX VIRTUS</h1>
    <p class="tagline">Execution. Data. Responsibility.</p>
  </header>

  <main>
    {#if data.goals.length === 0}
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
        {#each data.goals as goal}
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
    border-bottom: 2px solid #333;
    padding-bottom: 1rem;
    margin-bottom: 2rem;
  }

  h1 {
    margin: 0;
    font-size: 2.5rem;
    font-weight: 700;
    color: #fff;
    letter-spacing: 0.05em;
  }

  .tagline {
    margin: 0.5rem 0 0 0;
    color: #888;
    font-size: 0.9rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
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
    background: #1a1a1a;
    border: 1px solid #333;
    padding: 1.5rem;
    border-radius: 25px;
    text-decoration: none;
    color: inherit;
    transition: border-color 0.2s;
  }

  .goal-card:hover {
    border-color: #666;
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
    background: #222;
    border: 1px solid #444;
    border-radius: 25px;
    font-size: 0.75rem;
    color: #aaa;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  button {
    background: #fff;
    color: #000;
    border: none;
    padding: 0.75rem 1.5rem;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    border-radius: 25px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  button:hover {
    background: #e0e0e0;
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
    background: #1a1a1a;
    border: 1px solid #333;
    padding: 2rem;
    border-radius: 25px;
    max-width: 500px;
    width: 90%;
  }

  .modal-content h2 {
    margin: 0 0 1.5rem 0;
    color: #fff;
  }

  form label {
    display: block;
    margin-bottom: 1rem;
    color: #ccc;
    font-size: 0.9rem;
    font-weight: 500;
  }

  form input,
  form select {
    display: block;
    width: 100%;
    padding: 0.75rem;
    margin-top: 0.5rem;
    background: #0a0a0a;
    border: 1px solid #333;
    color: #e0e0e0;
    border-radius: 25px;
    font-size: 1rem;
    box-sizing: border-box;
  }

  form select {
    padding-right: 2.5rem;
  }

  form input:focus,
  form select:focus {
    outline: none;
    border-color: #666;
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
    color: #888;
    border: 1px solid #333;
  }

  .form-actions button[type='button']:hover {
    background: #1a1a1a;
    color: #ccc;
  }
</style>
