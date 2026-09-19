<!-- src/components/CardDetail.svelte -->
<script lang="ts">
  import { Sun, Trash2, Edit3, Check, X, ArrowLeft } from "@lucide/svelte";
  import CardForm from "./CardForm.svelte";
  import BarcodeView from "./BarcodeView.svelte";
  import { cardStore } from "../store";
  import { SUPPORTED_FORMATS, type Card, type BarcodeFormat } from "../types";

  let {
    card,
    onclose,
    ondelete,
  } = $props<{
    card: Card;
    onclose: () => void;
    ondelete: () => void;
  }>();

  let isEditing = $state(false);
  let confirmDelete = $state(false);

  let draftStoreName = $state("");
  let draftCardName = $state("");
  let draftBarcodeNumber = $state("");
  let draftCustomerNumber = $state("");
  let draftFormat = $state<BarcodeFormat>("CODE128");
  let draftColor = $state("");

  let renderKey = $state(0);

  function resetDraft() {
    draftStoreName = card.store_name;
    draftCardName = card.card_name || "";
    draftBarcodeNumber = card.barcode_number;
    draftCustomerNumber = card.customer_number || "";
    draftFormat = card.format;
    draftColor = card.color;
  }

  $effect(() => {
    resetDraft();
  });

  // Lock background page scroll while detail overlay is mounted
  $effect(() => {
    document.body.classList.add("no-scroll");
    return () => {
      document.body.classList.remove("no-scroll");
    };
  });

  // WakeLock & mobile wake-up management
  $effect(() => {
    let wakeLock: WakeLockSentinel | null = null;

    async function requestWakeLock() {
      try {
        if ("wakeLock" in navigator && document.visibilityState === "visible") {
          wakeLock = null;
          wakeLock = await navigator.wakeLock.request("screen");
          wakeLock.addEventListener("release", () => {
            wakeLock = null;
          });
        }
      } catch (err: any) {
        console.warn(`WakeLock failed: ${err?.name}`);
      }
    }

    async function releaseWakeLock() {
      if (wakeLock !== null) {
        try {
          await wakeLock.release();
        } catch (err) {
          console.warn(err);
        }
        wakeLock = null;
      }
    }

    function handleResume() {
      if (document.visibilityState === "visible") {
        if (!isEditing) {
          renderKey += 1;
        }
        setTimeout(requestWakeLock, 150);
      } else {
        releaseWakeLock();
      }
    }

    requestWakeLock();
    document.addEventListener("visibilitychange", handleResume);
    window.addEventListener("pageshow", handleResume);

    return () => {
      releaseWakeLock();
      document.removeEventListener("visibilitychange", handleResume);
      window.removeEventListener("pageshow", handleResume);
    };
  });

  function startEdit() {
    resetDraft();
    isEditing = true;
  }

  function cancelEdit() {
    resetDraft();
    isEditing = false;
  }

  function saveEdit() {
    if (!draftStoreName.trim() || !draftBarcodeNumber.trim()) {
      alert("Store Name and Barcode are required.");
      return;
    }

    cardStore.update(card.id, {
      store_name: draftStoreName.trim(),
      card_name: draftCardName.trim() || undefined,
      barcode_number: draftBarcodeNumber.trim(),
      customer_number: draftCustomerNumber.trim() || undefined,
      format: draftFormat,
      color: draftColor,
    });
    isEditing = false;
  }

  function changeFormat(e: Event) {
    const newFormat = (e.target as HTMLSelectElement).value as BarcodeFormat;
    cardStore.update(card.id, { format: newFormat });
  }
</script>

<div class="dark-overlay">
  {#if isEditing}
    <div class="barcode-card edit-card">
      <h2 style="margin: 0 0 8px 0;">Edit Card</h2>

      <CardForm
        bind:storeName={draftStoreName}
        bind:cardName={draftCardName}
        bind:barcodeNumber={draftBarcodeNumber}
        bind:customerNumber={draftCustomerNumber}
        bind:format={draftFormat}
        bind:color={draftColor}
      />

      <div style="margin-top: 16px; display: flex; gap: 10px; width: 100%;">
        <button class="btn btn-outline" onclick={cancelEdit}>
          <X size={16} /> Cancel
        </button>
        <button class="btn" onclick={saveEdit}>
          <Check size={16} /> Save
        </button>
      </div>
    </div>
  {:else}
    <div
      class="barcode-card"
      style="border-top: 6px solid {card.color};"
    >
      <h1 class="store-heading">{card.card_name || card.store_name}</h1>
      {#if card.card_name}
        <p class="brand-subheading">{card.store_name}</p>
      {/if}
      {#if card.customer_number}
        <p class="customer-subtext">ID: {card.customer_number}</p>
      {/if}

      <select id="formatSelector" value={card.format} onchange={changeFormat}>
        {#each SUPPORTED_FORMATS as fmt}
          <option value={fmt.value}>{fmt.label}</option>
        {/each}
      </select>

      <BarcodeView
        value={card.barcode_number}
        format={card.format}
        redrawTrigger={renderKey}
      />

      <div class="brightness-nudge">
        <Sun size={16} />
        <span>Scanner not reading? Boost brightness.</span>
      </div>

      <hr class="card-inner-divider" />

      {#if confirmDelete}
        <div class="delete-box">
          <p>Delete this card?</p>
          <div style="display: flex; gap: 8px; width: 100%;">
            <button
              class="btn btn-outline"
              style="flex: 1;"
              onclick={() => (confirmDelete = false)}
            >
              Cancel
            </button>
            <button class="btn btn-danger" style="flex: 1;" onclick={ondelete}>
              Delete
            </button>
          </div>
        </div>
      {:else}
        <div class="card-action-row">
          <button class="subtle-btn" onclick={startEdit}>
            <Edit3 size={16} /> Edit
          </button>
          <button
            class="subtle-btn danger"
            onclick={() => (confirmDelete = true)}
          >
            <Trash2 size={16} /> Delete Card
          </button>
        </div>
      {/if}
    </div>

    <button class="btn-back" onclick={onclose}>
      <ArrowLeft size={18} />
      Back to Wallet
    </button>
  {/if}
</div>

<style>
  .dark-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100vw;
    height: 100dvh;
    background: rgba(15, 23, 42, 0.85);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    padding: 20px;
    overflow-y: auto;
    overscroll-behavior: contain;
    touch-action: pan-y;
  }

  .barcode-card {
    background: #ffffff;
    color: #0f172a;
    padding: 24px 20px;
    border-radius: 20px;
    width: 100%;
    max-width: 380px;
    box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
    align-items: center;
    flex-shrink: 0;
  }

  .edit-card {
    background: var(--bg-surface);
    color: var(--text-primary);
  }

  .store-heading {
    margin: 0;
    font-size: 1.4rem;
    font-weight: 800;
    text-align: center;
  }

  .brand-subheading {
    margin: 2px 0 6px;
    color: #64748b;
    font-size: 0.9em;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .customer-subtext {
    margin: 2px 0 12px;
    color: #64748b;
    font-size: 0.85em;
    font-weight: 500;
  }

  select {
    width: 100%;
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    background: #f8fafc;
    color: #334155;
    font-size: 0.85rem;
    margin-bottom: 12px;
  }

  .brightness-nudge {
    margin-top: 14px;
    color: #94a3b8;
    font-size: 0.78rem;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .card-inner-divider {
    border: 0;
    height: 1px;
    background: #f1f5f9;
    width: 100%;
    margin: 16px 0 12px;
  }

  .card-action-row {
    width: 100%;
    display: flex;
    justify-content: space-between;
  }

  .subtle-btn {
    background: transparent;
    border: none;
    color: #64748b;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.85rem;
    font-weight: 600;
    padding: 8px;
    cursor: pointer;
    border-radius: 6px;
  }

  .subtle-btn:hover {
    background: #f1f5f9;
    color: #0f172a;
  }

  .subtle-btn.danger {
    color: #ef4444;
  }

  .subtle-btn.danger:hover {
    background: #fef2f2;
  }

  .delete-box {
    width: 100%;
    text-align: center;
  }

  .delete-box p {
    margin: 0 0 10px;
    color: #ef4444;
    font-size: 0.85rem;
    font-weight: 600;
  }

  .btn-back {
    margin-top: 20px;
    background: rgba(255, 255, 255, 0.15);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.25);
    padding: 10px 22px;
    border-radius: 999px;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    transition: background 0.15s ease;
    flex-shrink: 0;
  }

  .btn-back:hover {
    background: rgba(255, 255, 255, 0.25);
  }
</style>
