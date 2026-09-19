<!-- src/components/CardList.svelte -->
<script lang="ts">
  import { GripVertical, Search, X } from "@lucide/svelte";
  import Sortable from "sortablejs";
  import { cardStore } from "../store";

  let { onopenCard } = $props<{
    onopenCard: (cardId: string) => void;
  }>();

  let query = $state("");
  let listElement = $state<HTMLElement | null>(null);

  let isSearching = $derived(query.trim().length > 0);

  let filtered = $derived(
    cardStore.items.filter((card) => {
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return (
        card.store_name.toLowerCase().includes(q) ||
        (card.card_name && card.card_name.toLowerCase().includes(q)) ||
        card.barcode_number.includes(q)
      );
    }),
  );

  // Disable drag reordering while actively searching to prevent index bugs
  $effect(() => {
    if (!listElement) return;

    const sortable = Sortable.create(listElement, {
      handle: ".grab-handle",
      animation: 150,
      ghostClass: "sortable-ghost",
      disabled: isSearching,
      onEnd: (evt) => {
        if (isSearching) return;
        if (evt.oldIndex === undefined || evt.newIndex === undefined) return;
        cardStore.reorder(evt.oldIndex, evt.newIndex);
      },
    });

    return () => sortable.destroy();
  });
</script>

{#if cardStore.items.length > 0}
  <div class="search-bar">
    <Search size={18} class="search-icon" />
    <input
      type="search"
      placeholder="Search cards..."
      bind:value={query}
      class="search-input"
    />
    {#if query}
      <button
        type="button"
        class="search-clear-btn"
        onclick={() => (query = "")}
        aria-label="Clear search"
      >
        <X size={16} />
      </button>
    {/if}
  </div>
{/if}

{#if cardStore.items.length === 0}
  <p class="empty-state">No cards saved yet.</p>
{:else if filtered.length === 0}
  <p class="empty-state">No cards match "{query}".</p>
{:else}
  <div id="cardList" bind:this={listElement}>
    {#each filtered as card (card.id)}
      <div class="card" data-id={card.id} style="border-left: 6px solid {card.color};">
        {#if !isSearching}
          <div class="grab-handle" aria-label="Reorder card">
            <GripVertical size={20} />
          </div>
        {/if}

        <div
          class="card-content"
          role="button"
          tabindex="0"
          onclick={() => onopenCard(card.id)}
          onkeydown={(e) => e.key === "Enter" && onopenCard(card.id)}
        >
          {#if card.card_name}
            <div class="title-with-badge">
              <strong>{card.card_name}</strong>
              <span class="brand-pill">{card.store_name}</span>
            </div>
          {:else}
            <strong>{card.store_name}</strong>
          {/if}
          <span class="barcode-text">{card.barcode_number}</span>
        </div>
      </div>
    {/each}
  </div>
{/if}

<style>
  .search-bar {
    position: relative;
    display: flex;
    align-items: center;
    margin-bottom: 14px;
  }

  :global(.search-icon) {
    position: absolute;
    left: 14px;
    color: var(--text-secondary);
    pointer-events: none;
  }

  .search-input {
    width: 100%;
    margin: 0;
    padding: 11px 40px 11px 40px;
    border-radius: 12px;
    font-size: 0.95rem;
  }

  .search-clear-btn {
    position: absolute;
    right: 10px;
    background: transparent;
    border: none;
    color: var(--text-secondary);
    padding: 6px;
    cursor: pointer;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .search-clear-btn:hover {
    color: var(--text-primary);
  }

  .empty-state {
    color: var(--text-secondary);
    margin: 36px 0;
    text-align: center;
    font-size: 0.95rem;
  }

  .title-with-badge {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .brand-pill {
    font-size: 0.72rem;
    font-weight: 600;
    padding: 2px 7px;
    background: var(--bg-body);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    color: var(--text-secondary);
  }
</style>
