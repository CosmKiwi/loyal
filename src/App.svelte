<script lang="ts">
    import CardList from "./components/CardList.svelte";
    import AddCard from "./components/AddCard.svelte";
    import CardDetail from "./components/CardDetail.svelte";
    import Settings from "./components/Settings.svelte";
    import type { Card } from "./types";
    import { cardsStore } from "./store";

    import heroImage from "./assets/loyal_hero.png";

    let activeCardIndex: number | null = null;

    function handleOpenCard(event: CustomEvent<{ card: Card; index: number }>) {
        activeCardIndex = event.detail.index;
    }

    function handleCloseCard() {
        activeCardIndex = null;
    }
</script>

<header class="brand-header">
    <img src={heroImage} alt="Loyal" class="hero-image" />
</header>

<main class="container">
    <h2>My Cards</h2>
    <CardList on:openCard={handleOpenCard} />

    <hr />

    <h3>Add New Card</h3>
    <AddCard />

    <Settings />

    {#if activeCardIndex !== null && $cardsStore[activeCardIndex]}
        <CardDetail
            card={$cardsStore[activeCardIndex]}
            index={activeCardIndex}
            on:close={handleCloseCard}
        />
    {/if}
</main>
