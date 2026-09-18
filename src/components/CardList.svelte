<!-- src/components/CardList.svelte -->
<script lang="ts">
  import { GripVertical } from "@lucide/svelte";
  import Sortable from "sortablejs";
  import { cardsStore } from "../store";
  import type { Card } from "../types";

  let { onopenCard } = $props<{
    onopenCard: (detail: { card: Card; index: number }) => void;
  }>();

  let listElement = $state<HTMLElement | null>(null);

  // Manage SortableJS lifecycle cleanly with Svelte 5 $effect
  $effect(() => {
    if (!listElement) return;

    const sortable = Sortable.create(listElement, {
      handle: ".grab-handle",
      animation: 150,
      ghostClass: "sortable-ghost",
      dragClass: "sortable-drag",
      onEnd: (evt) => {
        if (evt.oldIndex === undefined || evt.newIndex === undefined) return;

        cardsStore.update((cards) => {
          const newCards = [...cards];
          const [movedCard] = newCards.splice(evt.oldIndex as number, 1);
          newCards.splice(evt.newIndex as number, 0, movedCard);
          return newCards;
        });
      },
    });

    return () => {
      sortable.destroy();
    };
  });
</script>

{#if $cardsStore.length === 0}
  <p style="color: var(--text-secondary, #888); margin: 30px 0;">
    No cards saved yet.
  </p>
{:else}
  <div id="cardList" bind:this={listElement}>
    {#each $cardsStore as card, i (card.barcode_number + i)}
      <div class="card">
        <div class="grab-handle" aria-label="Reorder card">
          <GripVertical size={20} />
        </div>

        <div
          class="card-content"
          role="button"
          tabindex="0"
          onclick={() => onopenCard({ card, index: i })}
          onkeydown={(e) => e.key === "Enter" && onopenCard({ card, index: i })}
        >
          <strong>{card.store_name}</strong>
          <span class="barcode-text">{card.barcode_number}</span>
        </div>
      </div>
    {/each}
  </div>
{/if}
