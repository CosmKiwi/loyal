<!-- src/App.svelte -->
<script lang="ts">
  import CardList from "./components/CardList.svelte";
  import AddCard from "./components/AddCard.svelte";
  import CardDetail from "./components/CardDetail.svelte";
  import Settings from "./components/Settings.svelte";
  import { cardStore } from "./store";
  import { Plus, Settings as SettingsIcon } from "@lucide/svelte";
  import heroImage from "./assets/loyal_hero.png";

  let activeCardId = $state<string | null>(null);
  let showAddCard = $state(false);
  let showSettings = $state(false);

  let activeCard = $derived(
    cardStore.items.find((c) => c.id === activeCardId),
  );

  // Rehydrate state and handle cold wake-ups from mobile deep sleep
  $effect(() => {
    function handleGlobalWake() {
      if (document.visibilityState === "visible") {
        cardStore.rehydrate();
      }
    }

    window.addEventListener("pageshow", handleGlobalWake);
    document.addEventListener("visibilitychange", handleGlobalWake);

    return () => {
      window.removeEventListener("pageshow", handleGlobalWake);
      document.removeEventListener("visibilitychange", handleGlobalWake);
    };
  });

  function handleOpenCard(id: string) {
    activeCardId = id;
  }

  function handleCloseCard() {
    activeCardId = null;
  }

  function handleDeleteCard() {
    if (activeCardId) {
      cardStore.remove(activeCardId);
      activeCardId = null;
    }
  }
</script>

<div class="app-shell">
  <header class="brand-header">
    <div class="header-top-bar">
      <button
        class="icon-btn-header"
        aria-label="Settings"
        onclick={() => (showSettings = true)}
      >
        <SettingsIcon size={24} />
      </button>
    </div>
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

  {#if activeCard}
    <CardDetail
      card={activeCard}
      onclose={handleCloseCard}
      ondelete={handleDeleteCard}
    />
  {/if}
</div>
