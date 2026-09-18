<!-- src/components/AddCard.svelte -->
<script lang="ts">
  import { Camera } from "@lucide/svelte";
  import { Html5Qrcode } from "html5-qrcode";
  import { cardsStore } from "../store";

  let { onsave } = $props<{
    onsave?: () => void;
  }>();

  let storeName = $state("");
  let barcodeNumber = $state("");
  let customerNumber = $state("");
  let isScanning = $state(false);

  let scannerRef = $state<HTMLElement | null>(null);

  // Scanner lifecycle managed cleanly via Svelte 5 $effect
  $effect(() => {
    if (!isScanning || !scannerRef) return;

    const scanner = new Html5Qrcode(scannerRef.id);

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        (decodedText) => {
          barcodeNumber = decodedText;
          isScanning = false;
        },
        undefined,
      )
      .catch((err) => {
        alert("Camera access failed or not available.");
        console.warn(err);
        isScanning = false;
      });

    return () => {
      scanner
        .stop()
        .then(() => scanner.clear())
        .catch(console.warn);
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

    storeName = "";
    barcodeNumber = "";
    customerNumber = "";

    onsave?.();
  }
</script>

<button class="btn btn-dark" onclick={() => (isScanning = true)}>
  <Camera size={20} />
  Scan Card
</button>

{#if isScanning}
  <div id="scanner-container">
    <div id="reader" bind:this={scannerRef}></div>
    <button class="btn btn-danger" onclick={() => (isScanning = false)}>
      Stop Scanning
    </button>
  </div>
{/if}

<input type="text" bind:value={storeName} placeholder="Store Name" />
<input type="text" bind:value={barcodeNumber} placeholder="Barcode Number" />
<input type="text" bind:value={customerNumber} placeholder="Customer Number" />

<button class="btn" onclick={saveCard}>Save Card</button>
