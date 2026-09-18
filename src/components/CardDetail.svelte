<!-- src/components/CardDetail.svelte -->
<script lang="ts">
  import { Sun } from "@lucide/svelte";
  import JsBarcode from "jsbarcode";
  import QRCode from "qrcode";
  import type { Card, BarcodeFormat } from "../types";
  import { cardsStore } from "../store";

  let { card, index, onclose } = $props<{
    card: Card;
    index: number;
    onclose: () => void;
  }>();

  let isEditing = $state(false);
  let editStoreName = $state("");
  let editBarcodeNumber = $state("");
  let editCustomerNumber = $state("");
  let formatError = $state("");

  $effect(() => {
    editStoreName = card.store_name;
    editBarcodeNumber = card.barcode_number;
    editCustomerNumber = card.customer_number || "";
  });

  let renderTrigger = $state(0);

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
        formatError = `Format Error: This number is not valid for ${f}.`;
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
        width: 300,
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
    if (!editStoreName || !editBarcodeNumber) {
      alert("Store Name and Barcode are required.");
      return;
    }

    cardsStore.update((cards) => {
      const newCards = [...cards];
      newCards[index] = {
        ...card,
        store_name: editStoreName,
        barcode_number: editBarcodeNumber,
        customer_number: editCustomerNumber,
      };
      return newCards;
    });
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
      <h2 style="margin-top: 0;">Edit Card</h2>
      <input type="text" bind:value={editStoreName} placeholder="Store Name" />
      <input
        type="text"
        bind:value={editBarcodeNumber}
        placeholder="Barcode Number"
      />
      <input
        type="text"
        bind:value={editCustomerNumber}
        placeholder="Customer Number"
      />
      <div
        style="margin-top: 20px; display: flex; justify-content: center; gap: 10px;"
      >
        <button class="btn" onclick={saveEdit}>Save</button>
        <button class="btn" onclick={() => (isEditing = false)}>Cancel</button>
      </div>
    </div>
  {:else}
    <div class="barcode-card">
      <h1 id="detailName" style="margin-top: 0;">{card.store_name}</h1>
      <p
        id="detailCustomerNumber"
        style="font-size: 1.1em; color: #555; margin: -10px 0 15px 0;"
      >
        {card.customer_number || ""}
      </p>

      <select
        id="formatSelector"
        style="padding: 10px; border-radius: 8px; margin-bottom: 20px; width: 100%; box-sizing: border-box;"
        value={card.format}
        onchange={changeFormat}
      >
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
        <Sun size={18} />
        <span>Scanner not reading? Turn up brightness.</span>
      </div>
    </div>

    <div style="margin-top: 25px; display: flex; gap: 10px;">
      <button class="btn" onclick={() => (isEditing = true)}>Edit</button>
      <button class="btn" onclick={onclose}>Back</button>
    </div>
  {/if}
</div>

<style>
  .dark-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(4px);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    padding: 20px;
    box-sizing: border-box;
  }

  .barcode-card {
    background: #ffffff;
    padding: 25px 20px;
    border-radius: 16px;
    width: 100%;
    max-width: 400px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .barcode-wrapper {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background: white;
    padding: 10px 0;
  }

  #barcode {
    width: 100%;
    max-width: 100%;
    height: auto;
  }

  #qrcode {
    max-width: 100%;
    height: auto;
  }

  .brightness-nudge {
    margin-top: 25px;
    color: #64748b;
    font-size: 0.85em;
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 500;
  }
</style>
