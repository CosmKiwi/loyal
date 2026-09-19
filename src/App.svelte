<!-- src/App.svelte -->
<script lang="ts">
  import CardList from "./components/CardList.svelte";
  import AddCard from "./components/AddCard.svelte";
  import CardDetail from "./components/CardDetail.svelte";
  import Settings from "./components/Settings.svelte";
  import { cardsStore, migrateCards } from "./store";
  import type { Card } from "./types";
  import { Plus, Settings as SettingsIcon } from "@lucide/svelte";
  import heroImage from "./assets/loyal_hero.png";

  let activeCardIndex = $state<number | null>(null);
  let showAddCard = $state(false);
  let showSettings = $state(false);

  // Rehydrate state and handle cold wake-ups from Android deep sleep
  $effect(() => {
    function handleGlobalWake() {
      if (document.visibilityState === "visible") {
        const raw = localStorage.getItem("cards");
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            cardsStore.set(migrateCards(parsed));
          } catch (e) {
            console.warn("Failed to rehydrate cardsStore on wake", e);
          }
        }
      }
    }

    window.addEventListener("pageshow", handleGlobalWake);
    document.addEventListener("visibilitychange", handleGlobalWake);

    return () => {
      window.removeEventListener("pageshow", handleGlobalWake);
      document.removeEventListener("visibilitychange", handleGlobalWake);
    };
  });

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
