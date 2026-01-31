<script lang="ts">
  import type { PageData } from './$types';
  import { goto } from '$app/navigation';

  export let data: PageData;

  type Tab = 'overview' | 'targets' | 'methods' | 'actions' | 'reviews';
  let activeTab: Tab = 'overview';

  // Goal form state
  let showGoalForm = false;
  let editGoalName = data.goal.name;
  let editGoalDescription = data.goal.description || '';
  let editGoalDeadline = data.goal.deadline || '';

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

  // Session form state
  let showSessionForm = false;
  let selectedMethodId = '';
  let sessionTitle = '';
  let sessionDate = new Date().toISOString().split('T')[0];
  let sessionNotes = '';
  let sessionMetrics = '';
  let sessions: any[] = [];
  let selectedMethodForSessions: any = null;

  // Review form state
  let showReviewForm = false;
  let reviewPeriodStart = '';
  let reviewPeriodEnd = '';
  let reviewSummary = '';
  let reviews: any[] = [];

  // Metrics data
  let metricsData: any = null;

  // Timeline calculations
  $: daysRemaining = data.goal.deadline
    ? Math.ceil((new Date(data.goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
  $: timelineStatus =
    daysRemaining === null
      ? 'No deadline'
      : daysRemaining < 0
        ? 'Overdue'
        : daysRemaining < 7
          ? 'Urgent'
          : daysRemaining < 30
            ? 'Soon'
            : 'On track';

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  function formatDeadline(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }

  async function saveGoal() {
    const res = await fetch(`/api/goals/${data.goal.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        name: editGoalName,
        description: editGoalDescription || undefined,
        deadline: editGoalDeadline || undefined
      })
    });

    if (res.ok) {
      showGoalForm = false;
      window.location.reload();
    }
  }

  async function deleteGoal() {
    if (!confirm(`Delete "${data.goal.name}"? This will delete all targets, methods, and actions.`))
      return;

    const res = await fetch(`/api/goals/${data.goal.id}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    if (res.ok) {
      goto('/');
    }
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

  async function loadSessionsForMethod(methodId: string) {
    selectedMethodId = methodId;
    const method = data.methods.find((m) => m.id === methodId);
    selectedMethodForSessions = method;

    const res = await fetch(`/api/method-sessions?methodId=${methodId}`, {
      credentials: 'include'
    });

    if (res.ok) {
      const result = await res.json();
      sessions = result.sessions || [];
    }
  }

  async function logSession() {
    let metrics = null;
    if (sessionMetrics.trim()) {
      try {
        metrics = JSON.parse(sessionMetrics);
      } catch (e) {
        alert('Invalid JSON format for metrics. Use format: {"weight": 185, "reps": 5}');
        return;
      }
    }

    const res = await fetch('/api/method-sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        methodId: selectedMethodId,
        date: sessionDate,
        title: sessionTitle,
        notes: sessionNotes || undefined,
        metrics: metrics
      })
    });

    if (res.ok) {
      showSessionForm = false;
      sessionTitle = '';
      sessionDate = new Date().toISOString().split('T')[0];
      sessionNotes = '';
      sessionMetrics = '';
      await loadSessionsForMethod(selectedMethodId);
    }
  }

  async function loadReviews() {
    const res = await fetch(`/api/reviews?goalId=${data.goal.id}`, {
      credentials: 'include'
    });

    if (res.ok) {
      const result = await res.json();
      reviews = result.reviews || [];
    }
  }

  async function createReview() {
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        goalId: data.goal.id,
        periodStart: reviewPeriodStart,
        periodEnd: reviewPeriodEnd,
        summary: reviewSummary || undefined
      })
    });

    if (res.ok) {
      showReviewForm = false;
      reviewPeriodStart = '';
      reviewPeriodEnd = '';
      reviewSummary = '';
      await loadReviews();
    }
  }

  async function loadMetrics() {
    const res = await fetch(`/api/metrics?goalId=${data.goal.id}&type=actions`, {
      credentials: 'include'
    });

    if (res.ok) {
      metricsData = await res.json();
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
    <div class="header-main">
      <div class="header-left">
        <h1>{data.goal.name}</h1>
        <span class="module-badge">{data.goal.moduleType}</span>
      </div>
      <div class="header-actions">
        <button class="icon-btn" on:click={() => (showGoalForm = true)} title="Edit goal">
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
      </div>
    </div>
    {#if data.goal.description}
      <p class="description">{data.goal.description}</p>
    {/if}

    {#if data.goal.deadline}
      <div class="timeline-banner {timelineStatus.toLowerCase().replace(' ', '-')}">
        <div class="timeline-content">
          <div class="timeline-label">Target Deadline</div>
          <div class="timeline-date">{formatDeadline(data.goal.deadline)}</div>
          <div class="timeline-status">
            {#if daysRemaining !== null}
              {#if daysRemaining < 0}
                {Math.abs(daysRemaining)} days overdue
              {:else if daysRemaining === 0}
                Due today
              {:else if daysRemaining === 1}
                1 day remaining
              {:else}
                {daysRemaining} days remaining
              {/if}
            {/if}
          </div>
        </div>
      </div>
    {/if}
  </header>

  <div class="tabs">
    <button class="tab-btn" class:active={activeTab === 'overview'} on:click={() => (activeTab = 'overview')}>
      Overview
    </button>
    <button class="tab-btn" class:active={activeTab === 'targets'} on:click={() => (activeTab = 'targets')}>
      Targets
    </button>
    <button class="tab-btn" class:active={activeTab === 'methods'} on:click={() => (activeTab = 'methods')}>
      Methods
    </button>
    <button class="tab-btn" class:active={activeTab === 'actions'} on:click={() => (activeTab = 'actions')}>
      Actions
    </button>
    <button class="tab-btn" class:active={activeTab === 'reviews'} on:click={() => (activeTab = 'reviews')}>
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

        <div class="card quick-actions-card">
          <h3 class="card-title">Quick Add</h3>
          <div class="quick-actions">
            <button class="quick-action-btn" on:click={() => (showTargetForm = true)}>
              Add Target
            </button>
            <button class="quick-action-btn" on:click={() => (showMethodForm = true)}>
              Add Method
            </button>
            <button class="quick-action-btn" on:click={() => (showActionForm = true)}>
              Log Action
            </button>
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
                  {#if action.actualValue}
                    <span class="action-value">{action.actualValue} {action.actualUnit || ''}</span>
                  {/if}
                  <span class="action-status" class:completed={action.disciplineVerdict === 'complete'}>
                    {action.disciplineVerdict === 'complete' ? '✓' : '✗'}
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

              <div class="method-actions">
                <button
                  class="btn btn-secondary"
                  on:click={() => {
                    loadSessionsForMethod(method.id);
                    showSessionForm = true;
                  }}
                >
                  + Log Session
                </button>
                <button
                  class="btn btn-secondary"
                  on:click={() => loadSessionsForMethod(method.id)}
                >
                  View Sessions ({sessions.filter(s => s.methodId === method.id).length || '...'})
                </button>
              </div>
            </div>
          {/each}
        </div>

        {#if selectedMethodForSessions && sessions.length > 0}
          <div class="sessions-section">
            <h3 class="sessions-title">Sessions for {selectedMethodForSessions.name}</h3>
            <div class="sessions-list">
              {#each sessions as session}
                <div class="card session-card">
                  <div class="session-header">
                    <h4>{session.title}</h4>
                    <span class="session-date">{formatDate(session.date)}</span>
                  </div>
                  {#if session.notes}
                    <p class="session-notes">{session.notes}</p>
                  {/if}
                  {#if session.metrics}
                    <div class="session-metrics">
                      <strong>Metrics:</strong>
                      {#each Object.entries(session.metrics) as [key, value]}
                        <span class="metric-badge">{key}: {value}</span>
                      {/each}
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        {/if}
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
                <span class="action-status" class:completed={action.disciplineVerdict === 'complete'}>
                  {action.disciplineVerdict === 'complete' ? '✓ Complete' : '✗ Incomplete'}
                </span>
              </div>
              {#if action.actualValue}
                <div class="action-value-display">
                  {action.actualValue} {action.actualUnit || ''}
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
        <button class="btn btn-primary" on:click={() => {showReviewForm = true; loadReviews();}}>
          + Create Review
        </button>
      </div>

      {#if reviews.length === 0}
        <div class="empty-state card">
          <p>No reviews yet. Create periodic reviews to track progress and reflect on failures.</p>
          <button class="btn btn-primary" on:click={() => {showReviewForm = true; loadReviews();}}>
            Create First Review
          </button>
        </div>
      {:else}
        <div class="reviews-list">
          {#each reviews as review}
            <div class="card review-card">
              <div class="review-header">
                <span class="review-period">
                  {formatDate(review.periodStart)} - {formatDate(review.periodEnd)}
                </span>
              </div>
              <div class="review-metrics">
                {#if review.disciplineCompletionRate !== null}
                  <div class="review-metric">
                    <span class="metric-label">Completion Rate:</span>
                    <span class="metric-value">{review.disciplineCompletionRate.toFixed(1)}%</span>
                  </div>
                {/if}
                {#if review.averageExecutionMagnitude !== null}
                  <div class="review-metric">
                    <span class="metric-label">Avg Magnitude:</span>
                    <span class="metric-value">{review.averageExecutionMagnitude.toFixed(1)}%</span>
                  </div>
                {/if}
              </div>
              {#if review.summary}
                <p class="review-summary">{review.summary}</p>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    {/if}
  </div>
</div>

<!-- Goal Edit Modal -->
{#if showGoalForm}
  <div class="modal" on:click={() => (showGoalForm = false)}>
    <div class="modal-content card" on:click|stopPropagation>
      <h2>Edit Goal</h2>
      <form on:submit|preventDefault={saveGoal}>
        <div class="input-group">
          <label for="goalName">Goal Name</label>
          <input id="goalName" type="text" bind:value={editGoalName} required />
        </div>

        <div class="input-group">
          <label for="goalDesc">Description (Optional)</label>
          <textarea id="goalDesc" bind:value={editGoalDescription} rows="3"></textarea>
        </div>

        <div class="input-group">
          <label for="goalDeadline">Deadline (Optional)</label>
          <input id="goalDeadline" type="date" bind:value={editGoalDeadline} />
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-danger" on:click={deleteGoal}>Delete Goal</button>
          <button type="button" class="btn btn-secondary" on:click={() => (showGoalForm = false)}>
            Cancel
          </button>
          <button type="submit" class="btn btn-primary">Save</button>
        </div>
      </form>
    </div>
  </div>
{/if}

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

        <div class="form-row-responsive">
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

        <div class="form-row-responsive">
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

<!-- Session Form Modal -->
{#if showSessionForm}
  <div class="modal" on:click={() => (showSessionForm = false)}>
    <div class="modal-content card" on:click|stopPropagation>
      <h2>Log Training Session</h2>
      {#if selectedMethodForSessions}
        <p class="modal-subtitle">Method: {selectedMethodForSessions.name}</p>
      {/if}
      <form on:submit|preventDefault={logSession}>
        <div class="input-group">
          <label for="sessionTitle">Session Title</label>
          <input
            id="sessionTitle"
            type="text"
            bind:value={sessionTitle}
            required
            placeholder="e.g., Squat Day - Week 4"
          />
        </div>

        <div class="input-group">
          <label for="sessionDate">Date</label>
          <input id="sessionDate" type="date" bind:value={sessionDate} required />
        </div>

        <div class="input-group">
          <label for="sessionNotes">Notes</label>
          <textarea
            id="sessionNotes"
            bind:value={sessionNotes}
            rows="3"
            placeholder="How did the session go? Any observations?"
          ></textarea>
        </div>

        <div class="input-group">
          <label for="sessionMetrics">Metrics (JSON format)</label>
          <textarea
            id="sessionMetrics"
            bind:value={sessionMetrics}
            rows="2"
            placeholder={'{"weight": 185, "reps": 5, "sets": 3}'}
          ></textarea>
          <small class="input-hint">Optional: Enter metrics as JSON, e.g. {"weight": 185, "reps": 5}</small>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" on:click={() => (showSessionForm = false)}>
            Cancel
          </button>
          <button type="submit" class="btn btn-primary">Log Session</button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Review Form Modal -->
{#if showReviewForm}
  <div class="modal" on:click={() => (showReviewForm = false)}>
    <div class="modal-content card" on:click|stopPropagation>
      <h2>Create Review</h2>
      <form on:submit|preventDefault={createReview}>
        <div class="form-row-responsive">
          <div class="input-group">
            <label for="reviewStart">Period Start</label>
            <input id="reviewStart" type="date" bind:value={reviewPeriodStart} required />
          </div>

          <div class="input-group">
            <label for="reviewEnd">Period End</label>
            <input id="reviewEnd" type="date" bind:value={reviewPeriodEnd} required />
          </div>
        </div>

        <div class="input-group">
          <label for="reviewSummary">Summary (Optional)</label>
          <textarea
            id="reviewSummary"
            bind:value={reviewSummary}
            rows="4"
            placeholder="Reflect on this period. What went well? What needs adjustment?"
          ></textarea>
        </div>

        <p class="modal-hint">
          Metrics (completion rate, execution magnitude) will be automatically calculated from your action attempts in this period.
        </p>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" on:click={() => (showReviewForm = false)}>
            Cancel
          </button>
          <button type="submit" class="btn btn-primary">Create Review</button>
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
    margin-bottom: 2rem;
  }

  .header-main {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }

  h1 {
    margin: 0;
    font-size: 2.5rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .description {
    margin: 0.75rem 0 1rem 0;
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

  .header-actions {
    display: flex;
    gap: 0.5rem;
  }

  .icon-btn {
    background: var(--bg-primary);
    border: 1px solid #e5e5e7;
    color: var(--text-secondary);
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .icon-btn:hover {
    background: #e8e8ed;
    color: var(--text-primary);
    border-color: #d0d0d5;
  }

  .timeline-banner {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 16px;
    padding: 1.5rem;
    margin-top: 1.5rem;
    color: white;
  }

  .timeline-banner.urgent {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  }

  .timeline-banner.overdue {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  }

  .timeline-content {
    text-align: center;
  }

  .timeline-label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    opacity: 0.9;
    margin-bottom: 0.5rem;
  }

  .timeline-date {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 0.25rem;
  }

  .timeline-status {
    font-size: 0.95rem;
    opacity: 0.95;
  }

  .tabs {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 2rem;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 0.5rem;
  }

  .tab-btn {
    background: var(--card-bg);
    border: 1px solid #e5e5e7;
    padding: 0.85rem 1.5rem;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    color: var(--text-secondary);
    font-weight: 500;
    font-size: 0.95rem;
  }

  .tab-btn:hover {
    background: var(--bg-primary);
    border-color: #d0d0d5;
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  }

  .tab-btn.active {
    background: var(--text-primary);
    color: white;
    border-color: var(--text-primary);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
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
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
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

  .quick-actions {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .quick-action-btn {
    background: var(--bg-primary);
    border: 1px solid #e5e5e7;
    padding: 1rem;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: center;
    color: var(--text-primary);
    font-weight: 500;
    font-size: 0.95rem;
  }

  .quick-action-btn:hover {
    background: #e8e8ed;
    border-color: #d0d0d5;
    transform: translateX(4px);
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

  .form-row-responsive {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  @media (max-width: 640px) {
    .form-row-responsive {
      grid-template-columns: 1fr;
    }

    h1 {
      font-size: 1.75rem;
    }

    .overview-grid {
      grid-template-columns: 1fr;
    }

    .tabs {
      gap: 0.5rem;
    }

    .tab-btn {
      padding: 0.75rem 1rem;
      font-size: 0.85rem;
    }
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
    flex-wrap: wrap;
  }

  .form-actions button {
    flex: 1;
    min-width: 120px;
    padding: 1rem;
  }

  .btn-danger {
    background: #ef4444;
    color: #ffffff;
    border: none;
  }

  .btn-danger:hover {
    background: #dc2626;
  }

  /* Method Sessions */
  .method-actions {
    display: flex;
    gap: 0.75rem;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #f0f0f0;
  }

  .method-actions .btn {
    flex: 1;
    font-size: 0.85rem;
    padding: 0.65rem 1rem;
  }

  .sessions-section {
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 2px solid #e5e5e7;
  }

  .sessions-title {
    margin: 0 0 1.5rem 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .sessions-list {
    display: grid;
    gap: 1rem;
  }

  .session-card {
    border-left: 3px solid var(--text-primary);
  }

  .session-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0.75rem;
  }

  .session-header h4 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .session-date {
    color: var(--text-secondary);
    font-size: 0.85rem;
  }

  .session-notes {
    margin: 0 0 0.75rem 0;
    color: var(--text-secondary);
    font-size: 0.95rem;
    line-height: 1.5;
  }

  .session-metrics {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
  }

  .session-metrics strong {
    color: var(--text-primary);
    font-size: 0.9rem;
    margin-right: 0.5rem;
  }

  .metric-badge {
    display: inline-block;
    padding: 0.35rem 0.75rem;
    background: var(--bg-primary);
    border: 1px solid #e5e5e7;
    border-radius: 8px;
    font-size: 0.85rem;
    color: var(--text-primary);
    font-weight: 500;
  }

  /* Reviews */
  .reviews-list {
    display: grid;
    gap: 1rem;
  }

  .review-card {
    border-left: 3px solid #667eea;
  }

  .review-header {
    margin-bottom: 1rem;
  }

  .review-period {
    color: var(--text-secondary);
    font-size: 0.9rem;
    font-weight: 500;
  }

  .review-metrics {
    display: flex;
    gap: 2rem;
    margin-bottom: 1rem;
    padding: 1rem;
    background: var(--bg-primary);
    border-radius: 8px;
  }

  .review-metric {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .metric-label {
    color: var(--text-secondary);
    font-size: 0.85rem;
  }

  .metric-value {
    color: var(--text-primary);
    font-size: 1.5rem;
    font-weight: 600;
  }

  .review-summary {
    margin: 0;
    color: var(--text-secondary);
    font-size: 0.95rem;
    line-height: 1.6;
  }

  /* Modal enhancements */
  .modal-subtitle {
    margin: -1rem 0 1.5rem 0;
    color: var(--text-secondary);
    font-size: 0.95rem;
  }

  .modal-hint {
    margin: 0;
    padding: 1rem;
    background: var(--bg-primary);
    border-radius: 8px;
    color: var(--text-secondary);
    font-size: 0.9rem;
    line-height: 1.5;
  }

  .input-hint {
    color: var(--text-tertiary);
    font-size: 0.85rem;
    margin-top: 0.25rem;
  }
</style>
