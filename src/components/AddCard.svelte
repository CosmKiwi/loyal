<script lang="ts">
    import { Camera } from "lucide-svelte";
    import { Html5Qrcode } from "html5-qrcode";
    import { cardsStore } from "../store";

    let storeName = "";
    let barcodeNumber = "";
    let customerNumber = "";
    let isScanning = false;

    // Svelte Action: Binds the scanner library to the DOM node
    function qrScanner(node: HTMLElement) {
        const scanner = new Html5Qrcode(node.id);

        scanner
            .start(
                { facingMode: "environment" },
                { fps: 10, qrbox: { width: 250, height: 150 } },
                (decodedText) => {
                    barcodeNumber = decodedText; // Automatically populates the input!
                    isScanning = false; // Triggers Svelte to unmount, firing the destroy() below
                },
                undefined, // Ignore continuous frame errors
            )
            .catch((err) => {
                alert("Camera access failed or not available.");
                isScanning = false;
            });

        return {
            destroy() {
                // Automatically stops the camera when the user closes the scanner
                scanner
                    .stop()
                    .then(() => scanner.clear())
                    .catch(console.warn);
            },
        };
    }

    function saveCard() {
        if (!storeName || !barcodeNumber) {
            alert("Enter Store Name and Barcode");
            return;
        }

        // Add the new card to the store
        cardsStore.update((cards) => [
            ...cards,
            {
                store_name: storeName,
                barcode_number: barcodeNumber,
                customer_number: customerNumber,
                format: "CODE128",
            },
        ]);

        // Clear the form
        storeName = "";
        barcodeNumber = "";
        customerNumber = "";
    }
</script>

<button class="btn btn-dark" on:click={() => (isScanning = true)}>
    <Camera size={20} />
    Scan Card
</button>

{#if isScanning}
    <div id="scanner-container">
        <div id="reader" use:qrScanner></div>
        <button class="btn btn-danger" on:click={() => (isScanning = false)}>
            Stop Scanning
        </button>
    </div>
{/if}

<input type="text" bind:value={storeName} placeholder="Store Name" />
<input type="text" bind:value={barcodeNumber} placeholder="Barcode Number" />
<input type="text" bind:value={customerNumber} placeholder="Customer Number" />

<button class="btn" on:click={saveCard}>Save Card</button>
