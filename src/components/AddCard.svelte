<!-- src/components/AddCard.svelte -->
<script lang="ts">
  import { Camera, X, AlertCircle } from "@lucide/svelte";
  import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";
  import CardForm from "./CardForm.svelte";
  import { cardsStore } from "../store";
  import { getDeterministicColor } from "../presets";
  import type { BarcodeFormat } from "../types";

  let { onclose } = $props<{ onclose: () => void }>();

  let storeName = $state("");
  let cardName = $state("");
  let barcodeNumber = $state("");
  let customerNumber = $state("");
  let format = $state<BarcodeFormat>("CODE128");
  let color = $state("");

  let isScanning = $state(false);
  let scanError = $state("");
  let scannerRef = $state<HTMLElement | null>(null);

  $effect(() => {
    if (!isScanning || !scannerRef) return;

    const scanner = new Html5Qrcode(scannerRef.id);
    let isRunning = false;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        (decodedText) => {
          barcodeNumber = decodedText;
          scanError = "";
          isScanning = false;
        },
        undefined,
      )
      .then(() => {
        isRunning = true;
      })
      .catch((err) => {
        isRunning = false;
        isScanning = false;
        scanError = "Camera not available. Please enter details manually.";
      });

    return () => {
      if (
        isRunning ||
        scanner.getState() === Html5QrcodeScannerState.SCANNING
      ) {
        scanner
          .stop()
          .then(() => scanner.clear())
          .catch(() => {});
      } else {
        try {
          scanner.clear();
        } catch {}
      }
    };
  });

  function saveCard() {
    if (!storeName.trim() || !barcodeNumber.trim()) {
      alert("Enter Card Type and Barcode");
      return;
    }

    cardsStore.update((cards) => [
      ...cards,
      {
        store_name: storeName.trim(),
        card_name: cardName.trim() || undefined,
        barcode_number: barcodeNumber.trim(),
        customer_number: customerNumber.trim() || undefined,
        format,
        color: color || getDeterministicColor(storeName.trim()),
      },
    ]);

    onclose();
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="sheet-backdrop"
  onclick={(e) => e.target === e.currentTarget && onclose()}
>
  <div class="sheet-panel">
    <div class="sheet-header">
      <h3>Add New Card</h3>
      <button class="close-btn" onclick={onclose} aria-label="Close">
        <X size={20} />
      </button>
    </div>

    {#if scanError}
      <div class="scan-error-badge">
        <AlertCircle size={16} />
        <span>{scanError}</span>
      </div>
    {/if}

    {#if !isScanning}
      <button
        class="btn btn-dark"
        onclick={() => {
          scanError = "";
          isScanning = true;
        }}
      >
        <Camera size={18} />
        Scan Card
      </button>
    {/if}

    {#if isScanning}
      <div id="scanner-container" style="margin: 12px 0;">
        <div
          id="reader"
          bind:this={scannerRef}
          style="border-radius: 8px; overflow: hidden;"
        ></div>
        <button
          class="btn btn-danger"
          style="margin-top: 10px;"
          onclick={() => (isScanning = false)}
        >
          Stop Scanning
        </button>
      </div>
    {/if}

    <CardForm
      bind:storeName
      bind:cardName
      bind:barcodeNumber
      bind:customerNumber
      bind:format
      bind:color
    />

    <button class="btn" style="margin-top: 16px;" onclick={saveCard}>
      Save Card
    </button>
  </div>
</div>
