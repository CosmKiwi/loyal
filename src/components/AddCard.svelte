<!-- src/components/AddCard.svelte -->
<script lang="ts">
  import { Camera, X, AlertCircle } from "@lucide/svelte";
  import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";
  import { cardsStore } from "../store";

  let { onclose } = $props<{
    onclose: () => void;
  }>();

  let storeName = $state("");
  let barcodeNumber = $state("");
  let customerNumber = $state("");
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
        scanError =
          "Camera not available or permission denied. Please enter details manually.";
        console.warn("Scanner start error:", err);
      });

    return () => {
      // Only call stop if the scanner actually reached the RUNNING/PAUSED state
      if (
        isRunning ||
        scanner.getState() === Html5QrcodeScannerState.SCANNING
      ) {
        scanner
          .stop()
          .then(() => scanner.clear())
          .catch((err) => console.warn("Scanner teardown warning:", err));
      } else {
        try {
          scanner.clear();
        } catch {
          // ignore clear errors if element already removed
        }
      }
    };
  });

  function saveCard() {
    if (!storeName.trim() || !barcodeNumber.trim()) {
      alert("Enter Store Name and Barcode");
      return;
    }

    cardsStore.update((cards) => [
      ...cards,
      {
        store_name: storeName.trim(),
        barcode_number: barcodeNumber.trim(),
        customer_number: customerNumber.trim() || undefined,
        format: "CODE128",
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

    <div style="margin-top: 10px;">
      <input type="text" bind:value={storeName} placeholder="Store Name" />
      <input
        type="text"
        bind:value={barcodeNumber}
        placeholder="Barcode Number"
      />
      <input
        type="text"
        bind:value={customerNumber}
        placeholder="Customer Number (optional)"
      />
    </div>

    <button class="btn" style="margin-top: 14px;" onclick={saveCard}>
      Save Card
    </button>
  </div>
</div>

<style>
  .scan-error-badge {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #fef2f2;
    color: #ef4444;
    border: 1px solid #fee2e2;
    padding: 10px 12px;
    border-radius: 10px;
    font-size: 0.85rem;
    margin-bottom: 12px;
    line-height: 1.3;
    text-align: left;
  }
</style>
