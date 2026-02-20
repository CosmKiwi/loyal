import u from 'umbrellajs';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import { Html5Qrcode } from "html5-qrcode";

let cards = JSON.parse(localStorage.getItem('cards') || '[]');
let currentCardIndex = null;
let html5QrCode = null;

function escapeHtml(text) {
    if (!text) return "";
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

async function renderCode(number, format) {
    const barcodeEl = u("#barcode");
    const qrcodeEl = u("#qrcode");
    const errorEl = u("#barcodeError"); // Add this to your HTML

    barcodeEl.addClass("hidden");
    qrcodeEl.addClass("hidden");
    errorEl.addClass("hidden").text(""); // Clear previous errors

    if (format === "QR") {
        qrcodeEl.removeClass("hidden");
        try {
            const canvas = qrcodeEl.first();
            const context = canvas.getContext('2d');
            context.clearRect(0, 0, canvas.width, canvas.height);
            await QRCode.toCanvas(canvas, number, {
                width: 250,
                margin: 2,
                errorCorrectionLevel: 'H'
            });
        } catch (err) {
            errorEl.removeClass("hidden").text("QR Generation failed.");
        }
    } else {
        try {
            JsBarcode("#barcode", number, {
                format: format,
                width: 2,
                height: 100,
                displayValue: true
            });
            barcodeEl.removeClass("hidden");
        } catch (e) {
            // Handle the specific error you saw in the console
            barcodeEl.addClass("hidden");
            errorEl.removeClass("hidden").html(
                `<strong>Format Error:</strong><br>` +
                `This number is not valid for ${format}.<br>` +
                `<small>Try switching to Code 128.</small>`
            );
        }
    }
}

function renderList() {
    const list = u("#cardList");
    list.html(""); // Clear list efficiently

    if (cards.length === 0) {
        list.html("<p style='color:#888'>No cards saved yet.</p>");
        return;
    }

    cards.forEach((c, i) => {
        const cardHtml = `
            <div class="card" draggable="true" data-index="${i}">
                <div class="grab-handle">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="19" r="1"></circle>
                        <circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="19" r="1"></circle>
                    </svg>
                </div>
                <div class="card-content" data-index="${i}">
                    <strong>${escapeHtml(c.store_name)}</strong>
                    <span class="barcode-text">${escapeHtml(c.barcode_number)}</span>
                </div>
                <button class="delete-btn" data-index="${i}">Delete</button>
            </div>
        `;
        list.append(cardHtml);
    });
}

function handleDragStart(e) {
    e.currentTarget.classList.add('dragging');
    e.dataTransfer.setData('text/plain', e.currentTarget.getAttribute('data-index'));
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const card = u(e.currentTarget);
    if (!card.hasClass('dragging')) {
        card.addClass('drag-over');
    }
}

function handleDragLeave(e) {
    u(e.currentTarget).removeClass('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
    const toIndex = parseInt(e.currentTarget.getAttribute('data-index'));

    u(e.currentTarget).removeClass('drag-over');

    if (fromIndex !== toIndex) {
        const movedCard = cards.splice(fromIndex, 1)[0];
        cards.splice(toIndex, 0, movedCard);
        localStorage.setItem('cards', JSON.stringify(cards));
        renderList();
    }
}

let wakeLock = null;
document.addEventListener('visibilitychange', async () => {
    const isBarcodeVisible = u("#detailView").hasClass("flex");

    if (document.visibilityState === 'visible' && isBarcodeVisible) {
        await requestWakeLock();
    }
});

const requestWakeLock = async () => {
    try {
        if ('wakeLock' in navigator) {
            wakeLock = await navigator.wakeLock.request('screen');
        }
    } catch (err) {
        console.log(`${err.name}, ${err.message}`);
    }
};

const releaseWakeLock = async () => {
    if (wakeLock !== null) {
        await wakeLock.release();
        wakeLock = null;
    }
};

const stopScanner = async () => {
    if (html5QrCode) {
        try {
            await html5QrCode.stop();
            u("#scanner-container").addClass("hidden");
        } catch (err) {
            console.warn("Scanner stop error:", err);
        }
    }
};

const onScanSuccess = (decodedText, decodedResult) => {
    u("#barcode_number").first().value = decodedText;

    // Map library formats to our selector values
    const formatMap = {
        'EAN_13': 'EAN13',
        'CODE_128': 'CODE128',
        'UPC_A': 'UPC',
        'UPC_E': 'UPC',
        'QR_CODE': 'QR'
    };

    const mappedFormat = formatMap[decodedResult.result.format.formatName] || "CODE128";
    const formatSelector = u("#formatSelector").first();
    // Only update if adding new card (selector is visible or we are in add mode)
    // Actually, scanning is for adding new cards, so we can just update the main inputs.

    stopScanner();
};

function showCard(index) {
    currentCardIndex = index;
    const card = cards[index];
    u("#detailName").text(card.store_name);
    u("#detailCustomerNumber").text(card.customer_number || "");
    u("#detailView").addClass("flex");
    u("#formatSelector").first().value = card.format || "CODE128";
    renderCode(card.barcode_number, u("#formatSelector").first().value);

    // Reset Edit Mode
    u("#editForm, #saveEditBtn, #cancelEditBtn").addClass("hidden");
    u("#detailName, #detailCustomerNumber, #formatSelector, #editBtn, #closeBtn").removeClass("hidden");

    requestWakeLock();
}

function deleteCard(i) {
    if (confirm("Delete this card?")) {
        cards.splice(i, 1);
        localStorage.setItem('cards', JSON.stringify(cards));
        renderList();
    }
}

export function initLoyal() {
    // Event Delegation for List Items
    const cardList = u("#cardList");

    cardList.on("click", ".card-content", e => {
        const index = u(e.currentTarget).attr("data-index");
        showCard(index);
    });

    cardList.on("click", ".delete-btn", e => {
        const index = u(e.target).attr("data-index");
        deleteCard(index);
    });

    // Drag and Drop Events
    cardList.on("dragstart", ".card", handleDragStart);
    cardList.on("dragend", ".card", e => u(e.currentTarget).removeClass('dragging'));
    cardList.on("dragover", ".card", handleDragOver);
    cardList.on("dragleave", ".card", handleDragLeave);
    cardList.on("drop", ".card", handleDrop);

    u("#scanBtn").on("click", async () => {
        u("#scanner-container").removeClass("hidden");
        html5QrCode = new Html5Qrcode("reader");
        const config = { fps: 10, qrbox: { width: 250, height: 150 } };

        try {
            await html5QrCode.start(
                { facingMode: "environment" },
                config,
                onScanSuccess
            );
        } catch (err) {
            alert("Camera access failed or not available.");
            u("#scanner-container").addClass("hidden");
        }
    });

    u("#stopScanBtn").on("click", stopScanner);

    u("#formatSelector").on("change", (e) => {
        const newFormat = e.target.value;
        const card = cards[currentCardIndex];
        if (card) {
            card.format = newFormat;
            localStorage.setItem('cards', JSON.stringify(cards));
            renderCode(card.barcode_number, newFormat);
        }
    });

    u("#saveBtn").on("click", () => {
        const sn = u("#store_name").first().value;
        const bn = u("#barcode_number").first().value;
        const cn = u("#customer_number").first().value;

        if (!sn || !bn) return alert("Enter Store Name and Barcode");

        cards.push({
            store_name: sn,
            barcode_number: bn,
            customer_number: cn,
            format: "CODE128"
        });

        localStorage.setItem('cards', JSON.stringify(cards));
        u("#store_name, #barcode_number, #customer_number").each(el => el.value = "");
        renderList();
    });

    u("#closeBtn").on("click", async () => {
        u("#detailView").removeClass("flex");
        await releaseWakeLock();
    });

    // Edit Mode Logic
    u("#editBtn").on("click", () => {
        const card = cards[currentCardIndex];
        u("#editStoreName").first().value = card.store_name;
        u("#editBarcodeNumber").first().value = card.barcode_number;
        u("#editCustomerNumber").first().value = card.customer_number || "";

        u("#detailName, #detailCustomerNumber, #barcode, #qrcode, #formatSelector, #editBtn, #closeBtn").addClass("hidden");
        u("#editForm, #saveEditBtn, #cancelEditBtn").removeClass("hidden");
    });

    u("#cancelEditBtn").on("click", () => {
        showCard(currentCardIndex);
    });

    u("#saveEditBtn").on("click", () => {
        const sn = u("#editStoreName").first().value;
        const bn = u("#editBarcodeNumber").first().value;
        const cn = u("#editCustomerNumber").first().value;

        if (!sn || !bn) return alert("Store Name and Barcode are required.");

        cards[currentCardIndex].store_name = sn;
        cards[currentCardIndex].barcode_number = bn;
        cards[currentCardIndex].customer_number = cn;

        localStorage.setItem('cards', JSON.stringify(cards));
        showCard(currentCardIndex);
    });

    u("#backupBtn").on("click", () => {
        const date = new Date().toISOString().split('T')[0];
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cards));
        const dl = document.createElement('a');
        dl.setAttribute("href", dataStr);
        dl.setAttribute("download", `loyal_backup_${date}.json`);
        dl.click();
    });

    u("#restoreBtn").on("click", () => u("#restoreFile").first().click());

    u("#restoreFile").on("change", (e) => {
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                cards = JSON.parse(evt.target.result);
                localStorage.setItem('cards', JSON.stringify(cards));
                renderList();
            } catch (err) {
                alert("Invalid backup file.");
            }
        };
        if (e.target.files.length > 0) {
            reader.readAsText(e.target.files[0]);
        }
    });

    // Version Display
    const versionDisplay = u("#version-display");
    if (versionDisplay.length) {
        const isTest = import.meta.env.BASE_URL.includes('/test/');
        const envLabel = isTest ? "(Test)" : "(Prod)";
        versionDisplay.text(`v${__APP_VERSION__} ${envLabel}`);
    }

    renderList();
}

document.addEventListener('DOMContentLoaded', initLoyal);