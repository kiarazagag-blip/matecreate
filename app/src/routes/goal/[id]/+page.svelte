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
    <div class="progress-container">
      <svg class="progress-ring" width="180" height="180" viewBox="0 0 180 180">
        <circle
          class="progress-ring-bg"
          cx="90"
          cy="90"
          r="82"
          fill="none"
          stroke="#1a1a1a"
          stroke-width="10"
        />
        <circle
          class="progress-ring-fill"
          cx="90"
          cy="90"
          r="82"
          fill="none"
          stroke="#f4e5a8"
          stroke-width="10"
          stroke-linecap="round"
          stroke-dasharray="515.22"
          stroke-dashoffset={515.22 - (515.22 * data.adherence) / 100}
          transform="rotate(-90 90 90)"
        />
      </svg>
      <div class="progress-center">
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
  :global(body) {
    font-family: 'Nebulica', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  nav {
    margin-bottom: 2rem;
  }

  nav a {
    color: rgba(255, 255, 255, 0.5);
    text-decoration: none;
    font-size: 0.9rem;
  }

  nav a:hover {
    color: rgba(255, 255, 255, 0.8);
  }

  header {
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding-bottom: 1.5rem;
    margin-bottom: 2rem;
  }

  h1 {
    margin: 0 0 0.5rem 0;
    font-size: 2rem;
    color: #e8e8e8;
    font-weight: 500;
  }

  .description {
    margin: 1rem 0 0 0;
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.9rem;
    font-weight: 300;
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

  .adherence-card {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    padding: 2rem 1.5rem;
    margin-bottom: 2rem;
    border-radius: 25px;
    backdrop-filter: blur(10px);
  }

  .adherence-label {
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.75rem;
    margin-bottom: 1.5rem;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    font-weight: 400;
    text-align: center;
  }

  .progress-container {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .progress-ring {
    display: block;
  }

  .progress-ring-bg {
    opacity: 0.15;
    stroke: rgba(255, 255, 255, 0.1);
  }

  .progress-ring-fill {
    transition: stroke-dashoffset 0.5s ease;
  }

  .progress-center {
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .adherence-value {
    font-size: 2.8rem;
    font-weight: 400;
    color: rgba(255, 255, 255, 0.9);
    margin: 0;
    line-height: 1;
  }

  .adherence-status {
    color: rgba(255, 255, 255, 0.4);
    font-size: 0.7rem;
    margin-top: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-weight: 300;
  }

  .section {
    margin-bottom: 3rem;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 1rem;
  }

  .section-header h2 {
    margin: 0;
    font-size: 1.1rem;
    color: rgba(255, 255, 255, 0.85);
    line-height: 1.4;
    font-weight: 500;
  }

  button {
    background: rgba(255, 255, 255, 0.12);
    color: rgba(255, 255, 255, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.15);
    padding: 0.5rem 1rem;
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

  .empty {
    color: rgba(255, 255, 255, 0.4);
    font-size: 0.85rem;
  }

  .targets-list {
    display: grid;
    gap: 1rem;
  }

  .target-item {
    background: linear-gradient(135deg, #c4b5fd 0%, #a78bfa 100%);
    border: none;
    padding: 1.25rem;
    border-radius: 25px;
    box-shadow: 0 2px 8px rgba(167, 139, 250, 0.15);
  }

  .target-item h3 {
    margin: 0 0 0.5rem 0;
    font-size: 0.95rem;
    color: #1a1a1c;
    font-weight: 500;
  }

  .target-metric,
  .target-deadline {
    font-size: 0.75rem;
    color: rgba(0, 0, 0, 0.65);
    margin-top: 0.25rem;
    font-weight: 400;
  }

  .method-card {
    background: linear-gradient(135deg, #fca5a5 0%, #fb923c 100%);
    border: none;
    padding: 1.25rem;
    border-radius: 25px;
    box-shadow: 0 2px 8px rgba(251, 146, 60, 0.15);
  }

  .method-card h3 {
    margin: 0 0 0.5rem 0;
    font-size: 0.95rem;
    color: #1a1a1c;
    font-weight: 500;
  }

  .method-card p {
    margin: 0;
    color: rgba(0, 0, 0, 0.7);
    font-size: 0.8rem;
    font-weight: 400;
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
    background: linear-gradient(135deg, #fde68a 0%, #fcd34d 100%);
    border: none;
    padding: 1rem 1.25rem;
    border-radius: 25px;
    box-shadow: 0 2px 8px rgba(252, 211, 77, 0.15);
  }

  .action-item.missed {
    background: linear-gradient(135deg, #fca5a5 0%, #ef4444 100%);
    box-shadow: 0 2px 8px rgba(239, 68, 68, 0.2);
  }

  .action-date {
    color: rgba(0, 0, 0, 0.65);
    font-size: 0.8rem;
    font-weight: 400;
  }

  .action-details {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  .action-value {
    color: #1a1a1c;
    font-weight: 500;
  }

  .action-notes {
    color: rgba(0, 0, 0, 0.65);
    font-size: 0.8rem;
    font-weight: 400;
  }

  .action-status {
    text-align: center;
    font-size: 1.25rem;
    color: #1a1a1c;
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
  form select,
  form textarea {
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
  form select:focus,
  form textarea:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.25);
    background: rgba(255, 255, 255, 0.08);
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
    color: rgba(255, 255, 255, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.15);
  }

  .form-actions button[type='button']:hover {
    background: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.7);
  }
</style>
