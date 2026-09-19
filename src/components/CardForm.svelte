<!-- src/components/CardForm.svelte -->
<script lang="ts">
  import { X, ChevronDown } from "@lucide/svelte";
  import { regionStore } from "../store";
  import { REGIONS, QUICK_PALETTE, getDeterministicColor } from "../presets";
  import { SUPPORTED_FORMATS, type BarcodeFormat } from "../types";

  let {
    storeName = $bindable(""),
    cardName = $bindable(""),
    barcodeNumber = $bindable(""),
    customerNumber = $bindable(""),
    format = $bindable<BarcodeFormat>("CODE128"),
    color = $bindable(""),
  } = $props<{
    storeName: string;
    cardName: string;
    barcodeNumber: string;
    customerNumber: string;
    format: BarcodeFormat;
    color: string;
  }>();

  let showPresets = $state(false);

  let currentBrands = $derived(
    REGIONS[regionStore.current]?.brands ?? REGIONS["NZ"].brands,
  );

  let filteredBrands = $derived(
    storeName.trim() === ""
      ? currentBrands
      : currentBrands.filter((b) =>
          b.name.toLowerCase().includes(storeName.trim().toLowerCase()),
        ),
  );

  function selectBrand(brand: {
    name: string;
    color: string;
    format: BarcodeFormat;
  }) {
    storeName = brand.name;
    color = brand.color;
    format = brand.format;
    showPresets = false;
  }

  function handleInput(val: string) {
    storeName = val;
    const match = currentBrands.find(
      (b) => b.name.toLowerCase() === val.trim().toLowerCase(),
    );
    if (match) {
      color = match.color;
      format = match.format;
    } else if (!color) {
      color = getDeterministicColor(val);
    }
  }

  function clearStoreName() {
    storeName = "";
    color = "";
    showPresets = true;
  }
</script>

<div class="card-form">
  <!-- Brand / Store Type Picker -->
  <div class="combobox-wrapper">
    <div class="input-with-actions">
      <input
        type="text"
        placeholder="Card Type (e.g. Club+, Everyday Rewards)"
        value={storeName}
        onfocus={() => (showPresets = true)}
        oninput={(e) => handleInput((e.target as HTMLInputElement).value)}
      />
      <div class="input-trailing-icons">
        {#if storeName}
          <button
            type="button"
            class="icon-btn-subtle"
            onclick={clearStoreName}
            aria-label="Clear"
          >
            <X size={16} />
          </button>
        {/if}
        <button
          type="button"
          class="icon-btn-subtle"
          onclick={() => (showPresets = !showPresets)}
          aria-label="Toggle brand options"
        >
          <ChevronDown size={18} />
        </button>
      </div>
    </div>

    {#if showPresets}
      <div class="presets-menu">
        {#each filteredBrands as brand}
          <button
            type="button"
            class="preset-item"
            onclick={() => selectBrand(brand)}
          >
            <span
              class="preset-color-badge"
              style="background-color: {brand.color};"
            ></span>
            <span>{brand.name}</span>
          </button>
        {/each}
        {#if filteredBrands.length === 0}
          <div class="preset-empty">Custom Card: "{storeName}"</div>
        {/if}
      </div>
    {/if}
  </div>

  <!-- Optional Custom Card Name / Nickname -->
  <input
    type="text"
    bind:value={cardName}
    placeholder="Card Name (optional, e.g. Mum's Card, Work)"
  />

  <input type="text" bind:value={barcodeNumber} placeholder="Barcode Number" />
  <input
    type="text"
    bind:value={customerNumber}
    placeholder="Customer / Member ID (optional)"
  />

  <div class="meta-row">
    <select bind:value={format} class="format-dropdown">
      {#each SUPPORTED_FORMATS as fmt}
        <option value={fmt.value}>{fmt.label}</option>
      {/each}
    </select>

    <label
      class="color-swatch-btn"
      style="background-color: {color || '#4f46e5'};"
    >
      <input
        type="color"
        bind:value={color}
        class="hidden-color-input"
        title="Choose custom color"
      />
    </label>
  </div>

  <div class="palette-strip">
    {#each QUICK_PALETTE as c}
      <button
        type="button"
        class="palette-bubble"
        class:selected={color.toLowerCase() === c.toLowerCase()}
        style="background-color: {c};"
        onclick={() => (color = c)}
        aria-label="Pick color {c}"
      ></button>
    {/each}
  </div>
</div>

<style>
  .card-form {
    display: flex;
    flex-direction: column;
    width: 100%;
    margin-top: 10px;
  }

  .combobox-wrapper {
    position: relative;
    width: 100%;
  }

  .input-with-actions {
    position: relative;
    display: flex;
    align-items: center;
  }

  .input-trailing-icons {
    position: absolute;
    right: 10px;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .icon-btn-subtle {
    background: transparent;
    border: none;
    color: var(--text-secondary);
    padding: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
  }

  .icon-btn-subtle:hover {
    color: var(--text-primary);
    background: rgba(0, 0, 0, 0.05);
  }

  .presets-menu {
    position: absolute;
    top: calc(100% - 4px);
    left: 0;
    right: 0;
    background: var(--bg-surface);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    box-shadow: var(--shadow-md);
    max-height: 180px;
    overflow-y: auto;
    z-index: 200;
    padding: 4px;
  }

  .preset-item {
    width: 100%;
    padding: 10px 12px;
    background: transparent;
    border: none;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 0.95rem;
    color: var(--text-primary);
    text-align: left;
    cursor: pointer;
    border-radius: 8px;
  }

  .preset-item:hover {
    background: var(--bg-body);
  }

  .preset-color-badge {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .preset-empty {
    padding: 12px;
    font-size: 0.85rem;
    color: var(--text-secondary);
    text-align: center;
  }

  .meta-row {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-top: 4px;
  }

  .format-dropdown {
    flex: 1;
    padding: 12px 14px;
    border-radius: 10px;
    border: 1px solid var(--border-color);
    background: var(--bg-body);
    color: var(--text-primary);
    font-size: 0.9rem;
    font-weight: 500;
    outline: none;
  }

  .color-swatch-btn {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    border: 2px solid var(--border-color);
    cursor: pointer;
    position: relative;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .hidden-color-input {
    position: absolute;
    opacity: 0;
    width: 100%;
    height: 100%;
    left: 0;
    top: 0;
    cursor: pointer;
  }

  .palette-strip {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 10px;
    padding: 4px 2px;
  }

  .palette-bubble {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    border: 2px solid transparent;
    cursor: pointer;
    padding: 0;
    transition: transform 0.15s ease;
  }

  .palette-bubble:hover {
    transform: scale(1.15);
  }

  .palette-bubble.selected {
    border-color: var(--text-primary);
    transform: scale(1.15);
  }
</style>
