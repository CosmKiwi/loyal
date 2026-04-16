<script lang="ts">
    import Sortable from "sortablejs";
    import { createEventDispatcher } from "svelte";
    import { cardsStore } from "../store";
    import type { Card } from "../types";

    // This allows us to tell the parent App.svelte when a card is clicked
    const dispatch = createEventDispatcher<{
        openCard: { card: Card; index: number };
    }>();

    // 1. The Svelte Action for SortableJS
    function sortableList(node: HTMLElement) {
        const sortable = Sortable.create(node, {
            handle: ".grab-handle",
            animation: 150,
            ghostClass: "sortable-ghost",
            dragClass: "sortable-drag",
            onEnd: (evt) => {
                if (evt.oldIndex === undefined || evt.newIndex === undefined)
                    return;

                // Update the Svelte store. The DOM will automatically update to match.
                cardsStore.update((cards) => {
                    const newCards = [...cards];
                    const [movedCard] = newCards.splice(
                        evt.oldIndex as number,
                        1,
                    );
                    newCards.splice(evt.newIndex as number, 0, movedCard);
                    return newCards;
                });
            },
        });

        return {
            destroy() {
                sortable.destroy(); // Prevents memory leaks when component unmounts
            },
        };
    }

    // 2. Delete functionality
    function deleteCard(index: number) {
        if (confirm("Delete this card?")) {
            cardsStore.update((cards) => {
                const newCards = [...cards];
                newCards.splice(index, 1);
                return newCards;
            });
        }
    }
</script>

{#if $cardsStore.length === 0}
    <p style="color:#888">No cards saved yet.</p>
{:else}
    <div id="cardList" use:sortableList>
        {#each $cardsStore as card, i (card.barcode_number + i)}
            <div class="card">
                <div class="grab-handle">
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    >
                        <circle cx="9" cy="5" r="1"></circle><circle
                            cx="9"
                            cy="12"
                            r="1"
                        ></circle><circle cx="9" cy="19" r="1"></circle>
                        <circle cx="15" cy="5" r="1"></circle><circle
                            cx="15"
                            cy="12"
                            r="1"
                        ></circle><circle cx="15" cy="19" r="1"></circle>
                    </svg>
                </div>

                <div
                    class="card-content"
                    role="button"
                    tabindex="0"
                    on:click={() => dispatch("openCard", { card, index: i })}
                    on:keydown={(e) =>
                        e.key === "Enter" &&
                        dispatch("openCard", { card, index: i })}
                >
                    <strong>{card.store_name}</strong>
                    <span class="barcode-text">{card.barcode_number}</span>
                </div>

                <button class="delete-btn" on:click={() => deleteCard(i)}
                    >Delete</button
                >
            </div>
        {/each}
    </div>
{/if}
