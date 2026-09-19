<!-- src/components/BarcodeView.svelte -->
<script lang="ts">
  import JsBarcode from "jsbarcode";
  import QRCode from "qrcode";
  import type { BarcodeFormat } from "../types";

  let {
    value,
    format,
    redrawTrigger = 0,
  } = $props<{
    value: string;
    format: BarcodeFormat;
    redrawTrigger?: number;
  }>();

  let formatError = $state("");
  let svgElement = $state<SVGSVGElement | null>(null);
  let canvasElement = $state<HTMLCanvasElement | null>(null);

  $effect(() => {
    // Read dependencies to track reactivity
    const _ = redrawTrigger;
    const currentVal = value;
    const currentFormat = format;

    formatError = "";

    if (currentFormat === "QR") {
      if (!canvasElement) return;
      QRCode.toCanvas(canvasElement, currentVal, {
        width: 280,
        margin: 1,
        errorCorrectionLevel: "H",
        color: { light: "#ffffff" },
      }).catch(() => {
        formatError = "QR Generation failed.";
      });
    } else {
      if (!svgElement) return;
      try {
        JsBarcode(svgElement, currentVal, {
          format: currentFormat,
          width: 3,
          height: 120,
          displayValue: true,
          margin: 0,
          background: "#ffffff",
        });
      } catch (e) {
        formatError = `Format Error: Not valid for ${currentFormat}.`;
        svgElement.innerHTML = "";
      }
    }
  });
</script>

{#if formatError}
  <div class="barcode-error">{formatError}</div>
{/if}

<div class="barcode-wrapper">
  {#if format === "QR"}
    <canvas bind:this={canvasElement} class="barcode-canvas"></canvas>
  {:else}
    <svg bind:this={svgElement} class="barcode-svg"></svg>
  {/if}
</div>

<style>
  .barcode-error {
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
    will-change: transform;
  }

  .barcode-svg {
    width: 100%;
    height: auto;
  }

  .barcode-canvas {
    max-width: 100%;
    height: auto;
  }
</style>
