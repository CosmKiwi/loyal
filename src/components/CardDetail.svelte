<script lang="ts">
    import { onMount, onDestroy, createEventDispatcher } from "svelte";
    import JsBarcode from "jsbarcode";
    import QRCode from "qrcode";
    import type { Card, BarcodeFormat } from "../types";
    import { cardsStore } from "../store";

    export let card: Card;
    export let index: number;

    const dispatch = createEventDispatcher<{ close: void }>();

    let isEditing = false;
    let editStoreName = card.store_name;
    let editBarcodeNumber = card.barcode_number;
    let editCustomerNumber = card.customer_number || "";
    let formatError = "";

    // --- WakeLock API Logic (Already implemented perfectly!) ---
    let wakeLock: WakeLockSentinel | null = null;

    async function requestWakeLock() {
        try {
            if ("wakeLock" in navigator) {
                wakeLock = await navigator.wakeLock.request("screen");
            }
        } catch (err: any) {
            console.log(`${err.name}, ${err.message}`);
        }
    }

    async function releaseWakeLock() {
        if (wakeLock !== null) {
            await wakeLock.release();
            wakeLock = null;
        }
    }

    function handleVisibilityChange() {
        if (document.visibilityState === "visible" && !isEditing) {
            requestWakeLock();
        }
    }

    onMount(() => {
        requestWakeLock();
        document.addEventListener("visibilitychange", handleVisibilityChange);
    });

    onDestroy(() => {
        releaseWakeLock();
        document.removeEventListener(
            "visibilitychange",
            handleVisibilityChange,
        );
    });

    // --- Svelte Actions for Barcodes ---
    function renderBarcode(
        node: SVGElement,
        params: { number: string; format: string },
    ) {
        function draw(n: string, f: string) {
            formatError = "";
            try {
                // SIZING TRICK: Increased width (thickness), height, and removed margin to maximize safe space
                JsBarcode(node, n, {
                    format: f,
                    width: 3,
                    height: 120,
                    displayValue: true,
                    margin: 0,
                    background: "#ffffff", // Force pure white
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
            // SIZING TRICK: Make it bigger (300px) and ensure light areas are pure white
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

    // --- Handlers ---
    function saveEdit() {
        if (!editStoreName || !editBarcodeNumber)
            return alert("Store Name and Barcode are required.");

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
        const newFormat = (e.target as HTMLSelectElement)
            .value as BarcodeFormat;
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
            <input
                type="text"
                bind:value={editStoreName}
                placeholder="Store Name"
            />
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
                <button
                    class="btn"
                    style="background:#28a745"
                    on:click={saveEdit}>Save</button
                >
                <button
                    class="btn"
                    style="background:#dc3545;"
                    on:click={() => (isEditing = false)}>Cancel</button
                >
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
                on:change={changeFormat}
            >
                <option value="CODE128">Code 128 (Standard)</option>
                <option value="EAN13">EAN-13 (Supermarkets)</option>
                <option value="UPC">UPC (12 digits)</option>
                <option value="QR">QR Code</option>
            </select>

            {#if formatError}
                <div id="barcodeError">{formatError}</div>
            {/if}

            <div class="barcode-wrapper">
                {#if card.format === "QR"}
                    <canvas id="qrcode" use:renderQR={card.barcode_number}
                    ></canvas>
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

            <div class="brightness-nudge">
                <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="19.36" x2="19.78" y2="20.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
                <span>Scanner not reading? Turn up brightness.</span>
            </div>
        </div>

        <div style="margin-top: 25px; display: flex; gap: 10px;">
            <button
                class="btn"
                style="background:#28a745"
                on:click={() => (isEditing = true)}>Edit</button
            >
            <button
                class="btn"
                style="background:#666;"
                on:click={() => dispatch("close")}>Back</button
            >
        </div>
    {/if}
</div>

<style>
    /* Scoped Svelte Styles - These won't affect the rest of your app! */
    .dark-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.85); /* Black out the periphery */
        backdrop-filter: blur(4px); /* Extra polish for iOS */
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

    /* Force the SVG to dynamically scale to the width of the card */
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
