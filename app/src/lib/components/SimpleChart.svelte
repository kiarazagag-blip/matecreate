<script lang="ts">
  export let data: Array<{ date: string; value: number }> = [];
  export let title: string = '';
  export let color: string = '#667eea';
  export let height: number = 200;

  $: maxValue = Math.max(...data.map((d) => d.value), 1);
  $: minValue = Math.min(...data.map((d) => d.value), 0);
  $: range = maxValue - minValue || 1;

  function getY(value: number): number {
    return height - ((value - minValue) / range) * (height - 40) - 20;
  }

  function getX(index: number): number {
    const width = 100;
    return (index / (data.length - 1 || 1)) * width;
  }

  $: pathData =
    data.length > 0
      ? data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.value)}`).join(' ')
      : '';
</script>

<div class="chart-container">
  {#if title}
    <h4 class="chart-title">{title}</h4>
  {/if}

  {#if data.length === 0}
    <div class="empty-chart">No data yet</div>
  {:else}
    <svg viewBox="0 0 100 {height}" preserveAspectRatio="none" class="chart-svg">
      <!-- Grid lines -->
      <line x1="0" y1="20" x2="100" y2="20" class="grid-line" />
      <line x1="0" y1="{height / 2}" x2="100" y2="{height / 2}" class="grid-line" />
      <line x1="0" y1="{height - 20}" x2="100" y2="{height - 20}" class="grid-line" />

      <!-- Line path -->
      <path d={pathData} fill="none" stroke={color} stroke-width="2" class="chart-line" />

      <!-- Points -->
      {#each data as point, i}
        <circle cx={getX(i)} cy={getY(point.value)} r="3" fill={color} class="chart-point" />
      {/each}
    </svg>

    <div class="chart-labels">
      <span class="label-min">{Math.round(minValue)}</span>
      <span class="label-max">{Math.round(maxValue)}</span>
    </div>
  {/if}
</div>

<style>
  .chart-container {
    position: relative;
  }

  .chart-title {
    margin: 0 0 0.75rem 0;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .chart-svg {
    width: 100%;
    height: auto;
  }

  .grid-line {
    stroke: #e5e5e7;
    stroke-width: 0.5;
  }

  .chart-line {
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .chart-point {
    transition: r 0.2s ease;
  }

  .chart-point:hover {
    r: 5;
  }

  .empty-chart {
    text-align: center;
    padding: 2rem;
    color: var(--text-tertiary);
    font-size: 0.9rem;
  }

  .chart-labels {
    display: flex;
    justify-content: space-between;
    margin-top: 0.5rem;
    font-size: 0.75rem;
    color: var(--text-secondary);
  }
</style>
