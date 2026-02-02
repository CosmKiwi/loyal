import u from 'umbrellajs';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';

let cards = JSON.parse(localStorage.getItem('cards') || '[]');
let currentCardIndex = null;

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
    if (cards.length === 0) {
        list.html("<p style='color:#888'>No cards saved yet.</p>");
        return;
    }

    const html = cards.map((c, i) => `
        <div class="card">
            <div class="card-content" data-index="${i}">
                <strong>${c.store_name}</strong>
                <span class="barcode-text">${c.barcode_number}</span>
            </div>
            <button class="delete-btn" data-index="${i}">Delete</button>
        </div>
    `).join('');

    list.html(html);

    u("#cardList").on("click", ".card-content", e => {
        const index = u(e.currentTarget).attr("data-index");
        showCard(index);
    });

    u(".delete-btn").on("click", e => {
        const index = u(e.currentTarget).attr("data-index");
        deleteCard(index);
    });
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

function showCard(index) {
    currentCardIndex = index;
    const card = cards[index];
    u("#detailName").text(card.store_name);
    u("#detailView").addClass("flex");
    u("#formatSelector").first().value = card.format || "CODE128";
    renderCode(card.barcode_number, u("#formatSelector").first().value);
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
        
        if(!sn || !bn) return alert("Enter Store Name and Barcode");
        
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