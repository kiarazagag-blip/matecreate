<script lang="ts">
  import type { PageData } from './$types';
  import { goto } from '$app/navigation';

  export let data: PageData;

  type Tab = 'overview' | 'targets' | 'methods' | 'actions' | 'reviews';
  let activeTab: Tab = 'overview';

  // Target form state
  let showTargetForm = false;
  let editingTargetId: string | null = null;
  let targetName = '';
  let targetDescription = '';
  let targetUnit = '';
  let targetValue = '';
  let targetDeadline = '';

  // Method form state
  let showMethodForm = false;
  let editingMethodId: string | null = null;
  let methodName = '';
  let methodDescription = '';

  // Action form state
  let showActionForm = false;
  let actionDate = new Date().toISOString().split('T')[0];
  let actionValue = '';
  let actionUnit = '';
  let actionNotes = '';
  let selectedTargetId = '';

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  function openEditTarget(target: any) {
    editingTargetId = target.id;
    targetName = target.name;
    targetDescription = target.description || '';
    targetUnit = target.measurementUnit || '';
    targetValue = target.targetValue?.toString() || '';
    targetDeadline = target.deadline || '';
    showTargetForm = true;
  }

  function resetTargetForm() {
    editingTargetId = null;
    targetName = '';
    targetDescription = '';
    targetUnit = '';
    targetValue = '';
    targetDeadline = '';
    showTargetForm = false;
  }

  function openEditMethod(method: any) {
    editingMethodId = method.id;
    methodName = method.name;
    methodDescription = method.description || '';
    showMethodForm = true;
  }

  function resetMethodForm() {
    editingMethodId = null;
    methodName = '';
    methodDescription = '';
    showMethodForm = false;
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
        description: targetDescription || undefined,
        measurementUnit: targetUnit || undefined,
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
    if (res.ok) window.location.reload();
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
    if (res.ok) window.location.reload();
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
        completed: true
      })
    });

    if (res.ok) {
      showActionForm = false;
      actionDate = new Date().toISOString().split('T')[0];
      actionValue = '';
      actionUnit = '';
      actionNotes = '';
      selectedTargetId = '';
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
  <nav class="breadcrumb">
    <a href="/">← Back to Goals</a>
  </nav>

  <header>
    <div class="header-top">
      <h1>{data.goal.name}</h1>
      <span class="module-badge">{data.goal.moduleType}</span>
    </div>
    {#if data.goal.description}
      <p class="description">{data.goal.description}</p>
    {/if}
  </header>

  <div class="tabs">
    <button
      class="tab"
      class:active={activeTab === 'overview'}
      on:click={() => (activeTab = 'overview')}
    >
      Overview
    </button>
    <button
      class="tab"
      class:active={activeTab === 'targets'}
      on:click={() => (activeTab = 'targets')}
    >
      Targets
    </button>
    <button class="tab" class:active={activeTab === 'methods'} on:click={() => (activeTab = 'methods')}>
      Methods
    </button>
    <button class="tab" class:active={activeTab === 'actions'} on:click={() => (activeTab = 'actions')}>
      Actions
    </button>
    <button class="tab" class:active={activeTab === 'reviews'} on:click={() => (activeTab = 'reviews')}>
      Reviews
    </button>
  </div>

  <div class="tab-content">
    {#if activeTab === 'overview'}
      <div class="overview-grid">
        <div class="card adherence-card">
          <h3 class="card-title">Adherence (Last 7 Days)</h3>
          <div class="adherence-display">
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

        <div class="card stats-card">
          <h3 class="card-title">Quick Stats</h3>
          <div class="stats-list">
            <div class="stat-item">
              <span class="stat-label">Targets</span>
              <span class="stat-value">{data.targets.length}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Methods</span>
              <span class="stat-value">{data.methods.length}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Actions Logged</span>
              <span class="stat-value">{data.actions.length}</span>
            </div>
          </div>
        </div>

        {#if data.methods.length > 0}
          <div class="card">
            <h3 class="card-title">Active Method</h3>
            <div class="method-preview">
              <h4>{data.methods[0].name}</h4>
              <p>{data.methods[0].description}</p>
            </div>
          </div>
        {/if}

        {#if data.actions.length > 0}
          <div class="card">
            <h3 class="card-title">Recent Actions</h3>
            <div class="recent-actions">
              {#each data.actions.slice(0, 5) as action}
                <div class="action-preview">
                  <span class="action-date">{formatDate(action.date)}</span>
                  {#if action.value}
                    <span class="action-value">{action.value} {action.unit || ''}</span>
                  {/if}
                  <span class="action-status" class:completed={action.completed}>
                    {action.completed ? '✓' : '✗'}
                  </span>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    {/if}

    {#if activeTab === 'targets'}
      <div class="section-header">
        <h2>Targets</h2>
        <button class="btn btn-primary" on:click={() => (showTargetForm = true)}>+ New Target</button>
      </div>

      {#if data.targets.length === 0}
        <div class="empty-state card">
          <p>No targets defined yet. Create measurable outcomes to track your progress.</p>
          <button class="btn btn-primary" on:click={() => (showTargetForm = true)}>
            Create First Target
          </button>
        </div>
      {:else}
        <div class="targets-grid">
          {#each data.targets as target}
            <div class="card target-card">
              <div class="card-header">
                <h3>{target.name}</h3>
                <button class="icon-btn" on:click={() => openEditTarget(target)}>⋯</button>
              </div>
              {#if target.description}
                <p class="target-description">{target.description}</p>
              {/if}
              <div class="target-meta">
                {#if target.targetValue}
                  <div class="meta-item">
                    <span class="meta-label">Target:</span>
                    <span class="meta-value">{target.targetValue} {target.measurementUnit || ''}</span>
                  </div>
                {/if}
                {#if target.deadline}
                  <div class="meta-item">
                    <span class="meta-label">Deadline:</span>
                    <span class="meta-value">{formatDate(target.deadline)}</span>
                  </div>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {/if}
    {/if}

    {#if activeTab === 'methods'}
      <div class="section-header">
        <h2>Methods</h2>
        <button class="btn btn-primary" on:click={() => (showMethodForm = true)}>+ New Method</button>
      </div>

      {#if data.methods.length === 0}
        <div class="empty-state card">
          <p>No methods defined yet. Define your approach and strategy.</p>
          <button class="btn btn-primary" on:click={() => (showMethodForm = true)}>
            Define First Method
          </button>
        </div>
      {:else}
        <div class="methods-grid">
          {#each data.methods as method}
            <div class="card method-card">
              <div class="card-header">
                <h3>{method.name}</h3>
                <button class="icon-btn" on:click={() => openEditMethod(method)}>⋯</button>
              </div>
              <p class="method-description">{method.description}</p>
            </div>
          {/each}
        </div>
      {/if}
    {/if}

    {#if activeTab === 'actions'}
      <div class="section-header">
        <h2>Action History</h2>
        <button class="btn btn-primary" on:click={() => (showActionForm = true)}>+ Log Action</button>
      </div>

      {#if data.actions.length === 0}
        <div class="empty-state card">
          <p>No actions logged yet. Start tracking your progress.</p>
          <button class="btn btn-primary" on:click={() => (showActionForm = true)}>
            Log First Action
          </button>
        </div>
      {:else}
        <div class="actions-list">
          {#each data.actions as action}
            <div class="card action-item">
              <div class="action-header">
                <span class="action-date">{formatDate(action.date)}</span>
                <span class="action-status" class:completed={action.completed}>
                  {action.completed ? '✓ Complete' : '✗ Incomplete'}
                </span>
              </div>
              {#if action.value}
                <div class="action-value-display">
                  {action.value} {action.unit || ''}
                </div>
              {/if}
              {#if action.notes}
                <p class="action-notes">{action.notes}</p>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    {/if}

    {#if activeTab === 'reviews'}
      <div class="section-header">
        <h2>Reviews</h2>
      </div>

      <div class="empty-state card">
        <p>Review system coming soon. Track failures and structured reflections.</p>
      </div>
    {/if}
  </div>
</div>

<!-- Target Form Modal -->
{#if showTargetForm}
  <div class="modal" on:click={resetTargetForm}>
    <div class="modal-content card" on:click|stopPropagation>
      <h2>{editingTargetId ? 'Edit Target' : 'New Target'}</h2>
      <form on:submit|preventDefault={saveTarget}>
        <div class="input-group">
          <label for="targetName">Target Name</label>
          <input
            id="targetName"
            type="text"
            bind:value={targetName}
            required
            placeholder="e.g., Squat 405 lbs"
          />
        </div>

        <div class="input-group">
          <label for="targetDesc">Description (Optional)</label>
          <textarea
            id="targetDesc"
            bind:value={targetDescription}
            rows="2"
            placeholder="Describe this target..."
          ></textarea>
        </div>

        <div class="form-row">
          <div class="input-group">
            <label for="targetUnit">Unit</label>
            <input id="targetUnit" type="text" bind:value={targetUnit} placeholder="lbs, kg, mins" />
          </div>

          <div class="input-group">
            <label for="targetValue">Target Value</label>
            <input id="targetValue" type="number" step="any" bind:value={targetValue} placeholder="405" />
          </div>
        </div>

        <div class="input-group">
          <label for="targetDeadline">Deadline (Optional)</label>
          <input id="targetDeadline" type="date" bind:value={targetDeadline} />
        </div>

        <div class="form-actions">
          {#if editingTargetId}
            <button type="button" class="btn btn-danger" on:click={() => deleteTarget(editingTargetId)}>
              Delete
            </button>
          {/if}
          <button type="button" class="btn btn-secondary" on:click={resetTargetForm}>Cancel</button>
          <button type="submit" class="btn btn-primary">{editingTargetId ? 'Save' : 'Create'}</button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Method Form Modal -->
{#if showMethodForm}
  <div class="modal" on:click={resetMethodForm}>
    <div class="modal-content card" on:click|stopPropagation>
      <h2>{editingMethodId ? 'Edit Method' : 'New Method'}</h2>
      <form on:submit|preventDefault={saveMethod}>
        <div class="input-group">
          <label for="methodName">Method Name</label>
          <input
            id="methodName"
            type="text"
            bind:value={methodName}
            required
            placeholder="e.g., 5/3/1 Program"
          />
        </div>

        <div class="input-group">
          <label for="methodDesc">Description</label>
          <textarea
            id="methodDesc"
            bind:value={methodDescription}
            required
            rows="4"
            placeholder="Describe your approach..."
          ></textarea>
        </div>

        <div class="form-actions">
          {#if editingMethodId}
            <button type="button" class="btn btn-danger" on:click={() => deleteMethod(editingMethodId)}>
              Delete
            </button>
          {/if}
          <button type="button" class="btn btn-secondary" on:click={resetMethodForm}>Cancel</button>
          <button type="submit" class="btn btn-primary">{editingMethodId ? 'Save' : 'Create'}</button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Action Form Modal -->
{#if showActionForm}
  <div class="modal" on:click={() => (showActionForm = false)}>
    <div class="modal-content card" on:click|stopPropagation>
      <h2>Log Action</h2>
      <form on:submit|preventDefault={logAction}>
        <div class="input-group">
          <label for="actionDate">Date</label>
          <input id="actionDate" type="date" bind:value={actionDate} required />
        </div>

        {#if data.targets.length > 0}
          <div class="input-group">
            <label for="actionTarget">Target (Optional)</label>
            <select id="actionTarget" bind:value={selectedTargetId}>
              <option value="">None</option>
              {#each data.targets as target}
                <option value={target.id}>{target.name}</option>
              {/each}
            </select>
          </div>
        {/if}

        <div class="form-row">
          <div class="input-group">
            <label for="actionValue">Value</label>
            <input id="actionValue" type="number" step="any" bind:value={actionValue} placeholder="Optional" />
          </div>

          <div class="input-group">
            <label for="actionUnit">Unit</label>
            <input id="actionUnit" type="text" bind:value={actionUnit} placeholder="lbs, mins, reps" />
          </div>
        </div>

        <div class="input-group">
          <label for="actionNotes">Notes (Optional)</label>
          <textarea id="actionNotes" bind:value={actionNotes} rows="3" placeholder="How did it go?"></textarea>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" on:click={() => (showActionForm = false)}>
            Cancel
          </button>
          <button type="submit" class="btn btn-primary">Log Action</button>
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
  }

  .breadcrumb {
    margin-bottom: 2rem;
  }

  .breadcrumb a {
    color: var(--text-secondary);
    text-decoration: none;
    font-size: 0.9rem;
    transition: color 0.2s ease;
  }

  .breadcrumb a:hover {
    color: var(--text-primary);
  }

  header {
    border-bottom: 1px solid #e5e5e7;
    padding-bottom: 1.5rem;
    margin-bottom: 2rem;
  }

  .header-top {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 0.5rem;
  }

  h1 {
    margin: 0;
    font-size: 2.5rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .description {
    margin: 0.75rem 0 0 0;
    color: var(--text-secondary);
    font-size: 1.05rem;
    line-height: 1.6;
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

  .tabs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 2rem;
    border-bottom: 1px solid #e5e5e7;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .tab {
    background: none;
    border: none;
    padding: 1rem 1.5rem;
    font-size: 0.95rem;
    font-weight: 500;
    color: var(--text-secondary);
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: all 0.2s ease;
    white-space: nowrap;
  }

  .tab:hover {
    color: var(--text-primary);
  }

  .tab.active {
    color: var(--text-primary);
    border-bottom-color: var(--text-primary);
  }

  .tab-content {
    animation: fadeIn 0.3s ease;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .section-header h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .overview-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
  }

  .card {
    background: var(--card-bg);
    border-radius: var(--card-radius);
    box-shadow: var(--card-shadow);
    padding: var(--spacing-lg);
  }

  .card-title {
    margin: 0 0 1rem 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .adherence-card {
    text-align: center;
  }

  .adherence-display {
    padding: 2rem 0;
  }

  .adherence-value {
    font-size: 4rem;
    font-weight: 600;
    color: var(--text-primary);
    line-height: 1;
    margin-bottom: 0.5rem;
  }

  .adherence-status {
    color: var(--text-secondary);
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .stats-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .stat-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 0;
    border-bottom: 1px solid #f0f0f0;
  }

  .stat-item:last-child {
    border-bottom: none;
  }

  .stat-label {
    color: var(--text-secondary);
    font-size: 0.95rem;
  }

  .stat-value {
    color: var(--text-primary);
    font-size: 1.25rem;
    font-weight: 600;
  }

  .method-preview h4 {
    margin: 0 0 0.5rem 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .method-preview p {
    margin: 0;
    color: var(--text-secondary);
    font-size: 0.95rem;
    line-height: 1.5;
  }

  .recent-actions {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .action-preview {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem;
    background: var(--bg-primary);
    border-radius: 12px;
  }

  .action-date {
    color: var(--text-secondary);
    font-size: 0.85rem;
    min-width: 80px;
  }

  .action-value {
    flex: 1;
    color: var(--text-primary);
    font-size: 0.95rem;
    font-weight: 500;
  }

  .action-status {
    font-size: 1.1rem;
  }

  .action-status.completed {
    color: #10b981;
  }

  .empty-state {
    text-align: center;
    padding: 3rem 2rem;
  }

  .empty-state p {
    color: var(--text-secondary);
    font-size: 1.05rem;
    margin: 0 0 1.5rem 0;
  }

  .targets-grid,
  .methods-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
  }

  .target-card,
  .method-card {
    position: relative;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0.75rem;
  }

  .card-header h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-primary);
    flex: 1;
  }

  .icon-btn {
    background: var(--bg-primary);
    border: none;
    color: var(--text-secondary);
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 1.2rem;
    transition: all 0.2s ease;
  }

  .icon-btn:hover {
    background: #e8e8ed;
    color: var(--text-primary);
  }

  .target-description,
  .method-description {
    margin: 0 0 1rem 0;
    color: var(--text-secondary);
    font-size: 0.95rem;
    line-height: 1.5;
  }

  .target-meta {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #f0f0f0;
  }

  .meta-item {
    display: flex;
    gap: 0.5rem;
    font-size: 0.9rem;
  }

  .meta-label {
    color: var(--text-secondary);
  }

  .meta-value {
    color: var(--text-primary);
    font-weight: 500;
  }

  .actions-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .action-item {
    border-left: 3px solid var(--bg-primary);
  }

  .action-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }

  .action-value-display {
    color: var(--text-primary);
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }

  .action-notes {
    margin: 0;
    color: var(--text-secondary);
    font-size: 0.9rem;
    line-height: 1.5;
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
    max-height: 90vh;
    overflow-y: auto;
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

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
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
  select,
  textarea {
    padding: 1rem 1.25rem;
    background: var(--bg-primary);
    border: 1px solid #e5e5e7;
    border-radius: 12px;
    color: var(--text-primary);
    font-size: 1rem;
    font-family: inherit;
    transition: all 0.2s ease;
  }

  input::placeholder,
  textarea::placeholder {
    color: var(--text-tertiary);
  }

  input:focus,
  select:focus,
  textarea:focus {
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

  textarea {
    resize: vertical;
    min-height: 80px;
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

  .btn-danger {
    background: #ef4444;
    color: #ffffff;
  }

  .btn-danger:hover {
    background: #dc2626;
  }
</style>
