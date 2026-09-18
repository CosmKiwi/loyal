<!-- src/App.svelte -->
<script lang="ts">
  import CardList from "./components/CardList.svelte";
  import AddCard from "./components/AddCard.svelte";
  import CardDetail from "./components/CardDetail.svelte";
  import Settings from "./components/Settings.svelte";
  import { cardsStore } from "./store";
  import type { Card } from "./types";
  import { Plus, Settings as SettingsIcon } from "@lucide/svelte";
  import heroImage from "./assets/loyal_hero.png";

  let activeCardIndex = $state<number | null>(null);
  let showAddCard = $state(false);
  let showSettings = $state(false);

  function handleOpenCard(detail: { card: Card; index: number }) {
    activeCardIndex = detail.index;
  }

  function handleCloseCard() {
    activeCardIndex = null;
  }

  function handleDeleteCard() {
    if (activeCardIndex !== null) {
      cardsStore.update((cards) =>
        cards.filter((_, i) => i !== activeCardIndex),
      );
      activeCardIndex = null;
    }
  }
</script>

<div class="app-shell">
  <header class="brand-header">
    <button
      class="icon-btn-header"
      aria-label="Settings"
      onclick={() => (showSettings = true)}
    >
      <SettingsIcon size={22} />
    </button>
    <img src={heroImage} alt="Loyal" class="hero-image" />
  </header>

  <main class="container">
    <h2>My Cards</h2>
    <CardList onopenCard={handleOpenCard} />
  </main>

  <button
    class="fab"
    aria-label="Add new card"
    onclick={() => (showAddCard = true)}
  >
    <Plus size={30} />
  </button>

  {#if showAddCard}
    <AddCard onclose={() => (showAddCard = false)} />
  {/if}

  {#if showSettings}
    <Settings onclose={() => (showSettings = false)} />
  {/if}

  {#if activeCardIndex !== null && $cardsStore[activeCardIndex]}
    <CardDetail
      card={$cardsStore[activeCardIndex]}
      index={activeCardIndex}
      onclose={handleCloseCard}
      ondelete={handleDeleteCard}
    />
  {/if}
</div>
