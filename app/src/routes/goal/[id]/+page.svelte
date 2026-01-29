<script lang="ts">
  import type { PageData } from './$types';

  export let data: PageData;

  let showActionForm = false;
  let showTargetForm = false;
  let showMethodForm = false;

  // Action form
  let actionDate = new Date().toISOString().split('T')[0];
  let actionValue = '';
  let actionUnit = '';
  let actionNotes = '';
  let actionCompleted = true;
  let selectedTargetId = '';

  // Target form
  let targetName = '';
  let targetUnit = '';
  let targetValue = '';
  let targetDeadline = '';

  // Method form
  let methodName = '';
  let methodDescription = '';

  async function logAction() {
    const res = await fetch('/api/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        goalId: data.goal.id,
        targetId: selectedTargetId || undefined,
        date: actionDate,
        value: actionValue ? parseFloat(actionValue) : undefined,
        unit: actionUnit || undefined,
        notes: actionNotes || undefined,
        completed: actionCompleted
      })
    });

    if (res.ok) {
      window.location.reload();
    }
  }

  async function createTarget() {
    const res = await fetch('/api/targets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        goalId: data.goal.id,
        name: targetName,
        measurementUnit: targetUnit,
        targetValue: targetValue ? parseFloat(targetValue) : undefined,
        deadline: targetDeadline || undefined
      })
    });

    if (res.ok) {
      window.location.reload();
    }
  }

  async function createMethod() {
    const res = await fetch('/api/methods', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        goalId: data.goal.id,
        name: methodName,
        description: methodDescription
      })
    });

    if (res.ok) {
      window.location.reload();
    }
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }
</script>

<div class="container">
  <nav>
    <a href="/">&larr; Back</a>
  </nav>

  <header>
    <h1>{data.goal.name}</h1>
    <span class="module-badge">{data.goal.moduleType}</span>
    {#if data.goal.description}
      <p class="description">{data.goal.description}</p>
    {/if}
  </header>

  <div class="adherence-card">
    <div class="adherence-label">Adherence (Last 7 Days)</div>
    <div class="adherence-value">{data.adherence}%</div>
    <div class="adherence-status">
      {#if data.adherence >= 80}
        On track
      {:else if data.adherence >= 60}
        Needs adjustment
      {:else}
        Below threshold
      {/if}
    </div>
  </div>

  <section class="section">
    <div class="section-header">
      <h2>Targets</h2>
      <button on:click={() => (showTargetForm = true)}>+ Target</button>
    </div>

    {#if data.targets.length === 0}
      <p class="empty">No targets defined. Define measurable outcomes.</p>
    {:else}
      <div class="targets-list">
        {#each data.targets as target}
          <div class="target-item">
            <h3>{target.name}</h3>
            {#if target.targetValue}
              <div class="target-metric">
                Goal: {target.targetValue} {target.measurementUnit}
              </div>
            {/if}
            {#if target.deadline}
              <div class="target-deadline">By: {formatDate(target.deadline)}</div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </section>

  <section class="section">
    <div class="section-header">
      <h2>Method</h2>
      <button on:click={() => (showMethodForm = true)}>+ Method</button>
    </div>

    {#if data.methods.length === 0}
      <p class="empty">No method defined. Choose your approach.</p>
    {:else}
      {#each data.methods as method}
        <div class="method-card">
          <h3>{method.name}</h3>
          <p>{method.description}</p>
        </div>
      {/each}
    {/if}
  </section>

  <section class="section">
    <div class="section-header">
      <h2>Actions</h2>
      <button on:click={() => (showActionForm = true)}>+ Log Action</button>
    </div>

    {#if data.actions.length === 0}
      <p class="empty">No actions logged. Start tracking.</p>
    {:else}
      <div class="actions-list">
        {#each data.actions as action}
          <div class="action-item" class:missed={!action.completed}>
            <div class="action-date">{formatDate(action.date)}</div>
            <div class="action-details">
              {#if action.value}
                <span class="action-value">{action.value} {action.unit || ''}</span>
              {/if}
              {#if action.notes}
                <span class="action-notes">{action.notes}</span>
              {/if}
            </div>
            <div class="action-status">
              {action.completed ? '✓' : '✗'}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </section>

  {#if showActionForm}
    <div class="modal" on:click={() => (showActionForm = false)}>
      <div class="modal-content" on:click|stopPropagation>
        <h2>Log Action</h2>
        <form on:submit|preventDefault={logAction}>
          <label>
            Date
            <input type="date" bind:value={actionDate} required />
          </label>

          {#if data.targets.length > 0}
            <label>
              Target (Optional)
              <select bind:value={selectedTargetId}>
                <option value="">None</option>
                {#each data.targets as target}
                  <option value={target.id}>{target.name}</option>
                {/each}
              </select>
            </label>
          {/if}

          <label>
            Value
            <input type="number" step="any" bind:value={actionValue} />
          </label>

          <label>
            Unit
            <input type="text" bind:value={actionUnit} placeholder="lbs, mins, reps, etc." />
          </label>

          <label>
            Notes
            <textarea bind:value={actionNotes} rows="3"></textarea>
          </label>

          <label class="checkbox-label">
            <input type="checkbox" bind:checked={actionCompleted} />
            Completed
          </label>

          <div class="form-actions">
            <button type="button" on:click={() => (showActionForm = false)}>Cancel</button>
            <button type="submit">Log</button>
          </div>
        </form>
      </div>
    </div>
  {/if}

  {#if showTargetForm}
    <div class="modal" on:click={() => (showTargetForm = false)}>
      <div class="modal-content" on:click|stopPropagation>
        <h2>New Target</h2>
        <form on:submit|preventDefault={createTarget}>
          <label>
            Target Name
            <input type="text" bind:value={targetName} required placeholder="e.g., Squat 405 lbs" />
          </label>

          <label>
            Measurement Unit
            <input
              type="text"
              bind:value={targetUnit}
              required
              placeholder="lbs, kg, mins, etc."
            />
          </label>

          <label>
            Target Value
            <input type="number" step="any" bind:value={targetValue} placeholder="Optional" />
          </label>

          <label>
            Deadline
            <input type="date" bind:value={targetDeadline} placeholder="Optional" />
          </label>

          <div class="form-actions">
            <button type="button" on:click={() => (showTargetForm = false)}>Cancel</button>
            <button type="submit">Create</button>
          </div>
        </form>
      </div>
    </div>
  {/if}

  {#if showMethodForm}
    <div class="modal" on:click={() => (showMethodForm = false)}>
      <div class="modal-content" on:click|stopPropagation>
        <h2>Define Method</h2>
        <form on:submit|preventDefault={createMethod}>
          <label>
            Method Name
            <input type="text" bind:value={methodName} required placeholder="e.g., 5/3/1" />
          </label>

          <label>
            Description
            <textarea
              bind:value={methodDescription}
              required
              rows="4"
              placeholder="Describe your approach..."
            ></textarea>
          </label>

          <div class="form-actions">
            <button type="button" on:click={() => (showMethodForm = false)}>Cancel</button>
            <button type="submit">Define</button>
          </div>
        </form>
      </div>
    </div>
  {/if}
</div>

<style>
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  nav {
    margin-bottom: 2rem;
  }

  nav a {
    color: #888;
    text-decoration: none;
  }

  nav a:hover {
    color: #ccc;
  }

  header {
    border-bottom: 2px solid #333;
    padding-bottom: 1.5rem;
    margin-bottom: 2rem;
  }

  h1 {
    margin: 0 0 0.5rem 0;
    font-size: 2rem;
    color: #fff;
  }

  .description {
    margin: 1rem 0 0 0;
    color: #888;
  }

  .module-badge {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    background: #222;
    border: 1px solid #444;
    border-radius: 2px;
    font-size: 0.75rem;
    color: #aaa;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .adherence-card {
    background: #1a1a1a;
    border: 1px solid #333;
    padding: 1.5rem;
    margin-bottom: 2rem;
    text-align: center;
  }

  .adherence-label {
    color: #888;
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .adherence-value {
    font-size: 3rem;
    font-weight: 700;
    color: #fff;
    margin: 0.5rem 0;
  }

  .adherence-status {
    color: #888;
    font-size: 0.9rem;
  }

  .section {
    margin-bottom: 3rem;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .section-header h2 {
    margin: 0;
    font-size: 1.25rem;
    color: #fff;
  }

  button {
    background: #fff;
    color: #000;
    border: none;
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    border-radius: 2px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  button:hover {
    background: #e0e0e0;
  }

  .empty {
    color: #666;
    font-style: italic;
  }

  .targets-list {
    display: grid;
    gap: 1rem;
  }

  .target-item {
    background: #1a1a1a;
    border: 1px solid #333;
    padding: 1rem;
    border-radius: 2px;
  }

  .target-item h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    color: #fff;
  }

  .target-metric,
  .target-deadline {
    font-size: 0.85rem;
    color: #888;
    margin-top: 0.25rem;
  }

  .method-card {
    background: #1a1a1a;
    border: 1px solid #333;
    padding: 1rem;
    border-radius: 2px;
  }

  .method-card h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    color: #fff;
  }

  .method-card p {
    margin: 0;
    color: #888;
    font-size: 0.9rem;
  }

  .actions-list {
    display: grid;
    gap: 0.5rem;
  }

  .action-item {
    display: grid;
    grid-template-columns: 80px 1fr 40px;
    gap: 1rem;
    align-items: center;
    background: #1a1a1a;
    border: 1px solid #333;
    padding: 0.75rem 1rem;
    border-radius: 2px;
  }

  .action-item.missed {
    border-color: #441111;
    background: #1a0a0a;
  }

  .action-date {
    color: #888;
    font-size: 0.85rem;
  }

  .action-details {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  .action-value {
    color: #fff;
    font-weight: 600;
  }

  .action-notes {
    color: #888;
    font-size: 0.9rem;
  }

  .action-status {
    text-align: center;
    font-size: 1.25rem;
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
    border-radius: 4px;
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
  form select,
  form textarea {
    display: block;
    width: 100%;
    padding: 0.75rem;
    margin-top: 0.5rem;
    background: #0a0a0a;
    border: 1px solid #333;
    color: #e0e0e0;
    border-radius: 2px;
    font-size: 1rem;
    font-family: inherit;
  }

  form input:focus,
  form select:focus,
  form textarea:focus {
    outline: none;
    border-color: #666;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .checkbox-label input[type='checkbox'] {
    width: auto;
    margin: 0;
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
