<script lang="ts">
  import type { PageData } from './$types';

  export let data: PageData;

  let showActionForm = false;
  let showTargetForm = false;
  let showMethodForm = false;
  let editingTargetId: string | null = null;
  let editingMethodId: string | null = null;

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

  function openEditTarget(target: any) {
    editingTargetId = target.id;
    targetName = target.name;
    targetUnit = target.measurementUnit;
    targetValue = target.targetValue?.toString() || '';
    targetDeadline = target.deadline || '';
    showTargetForm = true;
  }

  function openEditMethod(method: any) {
    editingMethodId = method.id;
    methodName = method.name;
    methodDescription = method.description;
    showMethodForm = true;
  }

  function resetTargetForm() {
    editingTargetId = null;
    targetName = '';
    targetUnit = '';
    targetValue = '';
    targetDeadline = '';
    showTargetForm = false;
  }

  function resetMethodForm() {
    editingMethodId = null;
    methodName = '';
    methodDescription = '';
    showMethodForm = false;
  }

  async function logAction() {
    const res = await fetch('/api/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
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

  async function saveTarget() {
    const url = editingTargetId ? `/api/targets/${editingTargetId}` : '/api/targets';
    const method = editingTargetId ? 'PATCH' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        goalId: data.goal.id,
        name: targetName,
        measurementUnit: targetUnit,
        targetValue: targetValue ? parseFloat(targetValue) : undefined,
        deadline: targetDeadline || undefined
      })
    });

    if (res.ok) {
      resetTargetForm();
      window.location.reload();
    }
  }

  async function deleteTarget(targetId: string) {
    if (!confirm('Delete this target?')) return;

    const res = await fetch(`/api/targets/${targetId}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    if (res.ok) {
      window.location.reload();
    }
  }

  async function saveMethod() {
    const url = editingMethodId ? `/api/methods/${editingMethodId}` : '/api/methods';
    const method = editingMethodId ? 'PATCH' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        goalId: data.goal.id,
        name: methodName,
        description: methodDescription
      })
    });

    if (res.ok) {
      resetMethodForm();
      window.location.reload();
    }
  }

  async function deleteMethod(methodId: string) {
    if (!confirm('Delete this method?')) return;

    const res = await fetch(`/api/methods/${methodId}`, {
      method: 'DELETE',
      credentials: 'include'
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
      <svg class="progress-ring" width="240" height="240" viewBox="0 0 240 240">
        <circle
          class="progress-ring-bg"
          cx="120"
          cy="120"
          r="100"
          fill="none"
          stroke="#1a1a1a"
          stroke-width="8"
        />
        <circle
          class="progress-ring-fill"
          cx="120"
          cy="120"
          r="100"
          fill="none"
          stroke="#f4e5a8"
          stroke-width="8"
          stroke-linecap="round"
          stroke-dasharray="628.32"
          stroke-dashoffset={628.32 - (628.32 * data.adherence) / 100}
          transform="rotate(-90 120 120)"
        />
      </svg>
      <div class="progress-center">
        <div class="adherence-value">{data.adherence}<span class="percent-sign">%</span></div>
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
            <div class="card-header">
              <h3>{target.name}</h3>
              <button class="icon-button" on:click={() => openEditTarget(target)} title="Edit target">⋯</button>
            </div>
            <div class="card-details">
              {#if target.targetValue}
                <div class="detail-row">
                  <span class="detail-icon">→</span>
                  <span class="detail-label">Target</span>
                  <span class="detail-value">{target.targetValue} {target.measurementUnit}</span>
                </div>
              {/if}
              {#if target.deadline}
                <div class="detail-row">
                  <span class="detail-icon">⏱</span>
                  <span class="detail-label">Deadline</span>
                  <span class="detail-value">{formatDate(target.deadline)}</span>
                </div>
              {/if}
            </div>
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
          <div class="card-header">
            <h3>{method.name}</h3>
            <button class="icon-button" on:click={() => openEditMethod(method)} title="Edit method">⋯</button>
          </div>
          <div class="method-description">{method.description}</div>
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
            <div class="action-main">
              <div class="action-date">{formatDate(action.date)}</div>
              <div class="action-info">
                {#if action.value}
                  <div class="detail-row">
                    <span class="detail-icon">↓</span>
                    <span class="action-value">{action.value} {action.unit || ''}</span>
                  </div>
                {/if}
                {#if action.notes}
                  <div class="action-notes">{action.notes}</div>
                {/if}
              </div>
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
    <div class="modal" on:click={resetTargetForm}>
      <div class="modal-content" on:click|stopPropagation>
        <h2>{editingTargetId ? 'Edit Target' : 'New Target'}</h2>
        <form on:submit|preventDefault={saveTarget}>
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
            {#if editingTargetId}
              <button type="button" class="delete-btn" on:click={() => deleteTarget(editingTargetId)}>Delete</button>
            {/if}
            <button type="button" on:click={resetTargetForm}>Cancel</button>
            <button type="submit">{editingTargetId ? 'Save' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  {/if}

  {#if showMethodForm}
    <div class="modal" on:click={resetMethodForm}>
      <div class="modal-content" on:click|stopPropagation>
        <h2>{editingMethodId ? 'Edit Method' : 'Define Method'}</h2>
        <form on:submit|preventDefault={saveMethod}>
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
            {#if editingMethodId}
              <button type="button" class="delete-btn" on:click={() => deleteMethod(editingMethodId)}>Delete</button>
            {/if}
            <button type="button" on:click={resetMethodForm}>Cancel</button>
            <button type="submit">{editingMethodId ? 'Save' : 'Define'}</button>
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
    color: var(--text-secondary);
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
    color: var(--text-primary);
    font-weight: 500;
  }

  .description {
    margin: 1rem 0 0 0;
    color: var(--text-secondary);
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
    color: var(--text-secondary);
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
    font-size: 3.5rem;
    font-weight: 300;
    color: var(--text-primary);
    margin: 0;
    line-height: 1;
  }

  .percent-sign {
    font-size: 2rem;
    font-weight: 300;
    opacity: 0.6;
  }

  .adherence-status {
    color: var(--text-tertiary);
    font-size: 0.65rem;
    margin-top: 0.75rem;
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
    color: var(--text-primary);
    line-height: 1.4;
    font-weight: 500;
  }

  button {
    background: rgba(255, 255, 255, 0.12);
    color: var(--text-primary);
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
    color: var(--text-tertiary);
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

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0.75rem;
  }

  .card-header h3 {
    margin: 0;
    font-size: 1rem;
    color: #1a1a1c;
    font-weight: 500;
    flex: 1;
  }

  .icon-button {
    background: rgba(0, 0, 0, 0.1);
    border: none;
    color: rgba(0, 0, 0, 0.5);
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 1.2rem;
    padding: 0;
    transition: all 0.2s ease;
    line-height: 1;
  }

  .icon-button:hover {
    background: rgba(0, 0, 0, 0.15);
    color: rgba(0, 0, 0, 0.7);
  }

  .card-details {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .detail-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
  }

  .detail-icon {
    font-size: 0.9rem;
    opacity: 0.6;
    width: 16px;
    display: inline-block;
  }

  .detail-label {
    color: rgba(0, 0, 0, 0.5);
    font-weight: 400;
    min-width: 60px;
  }

  .detail-value {
    color: #1a1a1c;
    font-weight: 500;
  }

  .method-card {
    background: linear-gradient(135deg, #fca5a5 0%, #fb923c 100%);
    border: none;
    padding: 1.25rem;
    border-radius: 25px;
    box-shadow: 0 2px 8px rgba(251, 146, 60, 0.15);
  }

  .method-description {
    color: rgba(0, 0, 0, 0.7);
    font-size: 0.85rem;
    font-weight: 300;
    line-height: 1.5;
  }

  .actions-list {
    display: grid;
    gap: 0.5rem;
  }

  .action-item {
    display: flex;
    justify-content: space-between;
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

  .action-main {
    display: flex;
    gap: 1rem;
    align-items: center;
    flex: 1;
  }

  .action-date {
    color: rgba(0, 0, 0, 0.6);
    font-size: 0.75rem;
    font-weight: 400;
    min-width: 60px;
  }

  .action-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .action-value {
    color: #1a1a1c;
    font-weight: 500;
    font-size: 0.9rem;
  }

  .action-notes {
    color: rgba(0, 0, 0, 0.6);
    font-size: 0.75rem;
    font-weight: 300;
  }

  .action-status {
    text-align: center;
    font-size: 1.25rem;
    color: #1a1a1c;
    margin-left: 1rem;
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
    color: var(--text-primary);
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
    color: var(--text-primary);
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
    color: var(--text-secondary);
    border: 1px solid rgba(255, 255, 255, 0.15);
  }

  .form-actions button[type='button']:hover {
    background: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.7);
  }

  .delete-btn {
    background: rgba(239, 68, 68, 0.15) !important;
    color: rgba(239, 68, 68, 0.9) !important;
    border: 1px solid rgba(239, 68, 68, 0.3) !important;
  }

  .delete-btn:hover {
    background: rgba(239, 68, 68, 0.25) !important;
    color: rgba(239, 68, 68, 1) !important;
    border-color: rgba(239, 68, 68, 0.5) !important;
  }
</style>
