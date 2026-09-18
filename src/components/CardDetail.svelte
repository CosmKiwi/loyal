<!-- src/components/CardDetail.svelte -->
<script lang="ts">
  import { Sun, Trash2, Edit3, Check, X, ArrowLeft } from "@lucide/svelte";
  import JsBarcode from "jsbarcode";
  import QRCode from "qrcode";
  import CardForm from "./CardForm.svelte";
  import { getDeterministicColor } from "../presets";
  import type { Card, BarcodeFormat } from "../types";
  import { cardsStore } from "../store";

  let { card, index, onclose, ondelete } = $props<{
    card: Card;
    index: number;
    onclose: () => void;
    ondelete: () => void;
  }>();

  let isEditing = $state(false);
  let confirmDelete = $state(false);

  let editStoreName = $state("");
  let editCardName = $state("");
  let editBarcodeNumber = $state("");
  let editCustomerNumber = $state("");
  let editFormat = $state<BarcodeFormat>("CODE128");
  let editColor = $state("");

  let formatError = $state("");
  let renderTrigger = $state(0);

  $effect(() => {
    editStoreName = card.store_name;
    editCardName = card.card_name || "";
    editBarcodeNumber = card.barcode_number;
    editCustomerNumber = card.customer_number || "";
    editFormat = card.format;
    editColor = card.color || getDeterministicColor(card.store_name);
  });

  $effect(() => {
    let wakeLock: WakeLockSentinel | null = null;

    async function requestWakeLock() {
      try {
        if ("wakeLock" in navigator && document.visibilityState === "visible") {
          wakeLock = await navigator.wakeLock.request("screen");
        }
      } catch (err: any) {
        console.warn(`WakeLock failed: ${err.name}, ${err.message}`);
      }
    }

    async function releaseWakeLock() {
      if (wakeLock !== null) {
        try {
          await wakeLock.release();
          wakeLock = null;
        } catch (err) {
          console.warn(err);
        }
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible" && !isEditing) {
        setTimeout(requestWakeLock, 50);
        renderTrigger += 1;
      }
    }

    requestWakeLock();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      releaseWakeLock();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  });

  function renderBarcode(
    node: SVGElement,
    params: { number: string; format: string },
  ) {
    function draw(n: string, f: string) {
      formatError = "";
      try {
        JsBarcode(node, n, {
          format: f,
          width: 3,
          height: 120,
          displayValue: true,
          margin: 0,
          background: "#ffffff",
        });
      } catch (e) {
        formatError = `Format Error: Not valid for ${f}.`;
        node.innerHTML = "";
      }
    }
    draw(params.number, params.format);

    return {
      update(newParams: { number: string; format: string }) {
        draw(newParams.number, newParams.format);
      },
    };
  }

  function renderQR(node: HTMLCanvasElement, number: string) {
    function draw(n: string) {
      formatError = "";
      QRCode.toCanvas(node, n, {
        width: 280,
        margin: 1,
        errorCorrectionLevel: "H",
        color: { light: "#ffffff" },
      }).catch(() => (formatError = "QR Generation failed."));
    }
    draw(number);

    return {
      update(newNumber: string) {
        draw(newNumber);
      },
    };
  }

  function saveEdit() {
    if (!editStoreName.trim() || !editBarcodeNumber.trim()) {
      alert("Store Name and Barcode are required.");
      return;
    }

    cardsStore.update((cards) => {
      const newCards = [...cards];
      newCards[index] = {
        ...card,
        store_name: editStoreName.trim(),
        card_name: editCardName.trim() || undefined,
        barcode_number: editBarcodeNumber.trim(),
        customer_number: editCustomerNumber.trim() || undefined,
        format: editFormat,
        color: editColor,
      };
      return newCards;
    });
    isEditing = false;
  }

  function cancelEdit() {
    editStoreName = card.store_name;
    editCardName = card.card_name || "";
    editBarcodeNumber = card.barcode_number;
    editCustomerNumber = card.customer_number || "";
    editFormat = card.format;
    editColor = card.color || getDeterministicColor(card.store_name);
    isEditing = false;
  }

  function changeFormat(e: Event) {
    const newFormat = (e.target as HTMLSelectElement).value as BarcodeFormat;
    cardsStore.update((cards) => {
      const newCards = [...cards];
      newCards[index] = { ...card, format: newFormat };
      return newCards;
    });
  }
</script>

<div class="dark-overlay">
  {#if isEditing}
    <div class="barcode-card">
      <h2 style="margin: 0 0 8px 0;">Edit Card</h2>

      <CardForm
        bind:storeName={editStoreName}
        bind:cardName={editCardName}
        bind:barcodeNumber={editBarcodeNumber}
        bind:customerNumber={editCustomerNumber}
        bind:format={editFormat}
        bind:color={editColor}
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
      style="border-top: 6px solid {card.color ||
        getDeterministicColor(card.store_name)};"
    >
      <h1 class="store-heading">{card.card_name || card.store_name}</h1>
      {#if card.card_name}
        <p class="brand-subheading">{card.store_name}</p>
      {/if}
      {#if card.customer_number}
        <p class="customer-subtext">ID: {card.customer_number}</p>
      {/if}

      <select id="formatSelector" value={card.format} onchange={changeFormat}>
        <option value="CODE128">Code 128 (Standard)</option>
        <option value="EAN13">EAN-13 (Supermarkets)</option>
        <option value="UPC">UPC (12 digits)</option>
        <option value="QR">QR Code</option>
      </select>

      {#if formatError}
        <div id="barcodeError">{formatError}</div>
      {/if}

      {#key renderTrigger}
        <div class="barcode-wrapper">
          {#if card.format === "QR"}
            <canvas id="qrcode" use:renderQR={card.barcode_number}></canvas>
          {:else}
            <svg
              id="barcode"
              use:renderBarcode={{
                number: card.barcode_number,
                format: card.format,
              }}
            ></svg>
          {/if}
        </div>
      {/key}

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
          <button class="subtle-btn" onclick={() => (isEditing = true)}>
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
    inset: 0;
    width: 100%;
    height: 100%;
    background: rgba(15, 23, 42, 0.85);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    padding: 20px;
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

  #barcodeError {
    color: #ef4444;
    font-size: 0.85rem;
    font-weight: 600;
    margin-bottom: 10px;
    text-align: center;
  }

  .barcode-wrapper {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background: #ffffff;
    padding: 8px 0;
    min-height: 140px;
    transform: translateZ(0);
  }

  #barcode {
    width: 100%;
    height: auto;
  }

  #qrcode {
    max-width: 100%;
    height: auto;
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
  }

  .btn-back:hover {
    background: rgba(255, 255, 255, 0.25);
  }
</style>
