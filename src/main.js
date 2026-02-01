// src/main.js
import './vendor/surreal.js';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';

let cards = JSON.parse(localStorage.getItem('cards') || '[]');
let currentCardIndex = null;

// Modernized renderCode using async/await for the qrcode library
async function renderCode(number, format) {
    const barcodeEl = me("#barcode");
    const qrcodeEl = me("#qrcode");

    // Hide both initially
    barcodeEl.classAdd("hidden");
    qrcodeEl.classAdd("hidden");

    if (format === "QR") {
        qrcodeEl.classRemove("hidden");
        try {
            // Render to the canvas added in index.html
            await QRCode.toCanvas(qrcodeEl, number, {
                width: 250,
                margin: 2,
                errorCorrectionLevel: 'H'
            });
        } catch (err) {
            console.error("QR Error:", err);
        }
    } else {
        barcodeEl.classRemove("hidden");
        try {
            JsBarcode("#barcode", number, { 
                format: format, 
                width: 2, 
                height: 100, 
                displayValue: true 
            });
        } catch (e) { 
            console.error("Barcode rendering failed", e); 
        }
    }
}

function renderList() {
    const list = me("#cardList");
    if (!list) return;

    if (cards.length === 0) {
        list.innerHTML = "<p style='color:#888'>No cards saved yet.</p>";
        return;
    }
    
    list.innerHTML = cards.map((c, i) => `
        <div class="card">
            <div class="card-content" data-index="${i}">
                <strong>${c.store_name}</strong>
                <span class="barcode-text">${c.barcode_number}</span>
            </div>
            <button class="delete-btn" data-index="${i}">Delete</button>
        </div>
    `).join('');

    any(".card-content").on("click", e => showCard(me(e).attribute("data-index")));
    any(".delete-btn").on("click", e => deleteCard(me(e).attribute("data-index")));
}

function showCard(index) {
    currentCardIndex = index;
    const card = cards[index];
    me("#detailName").innerText = card.store_name;
    me("#detailView").classAdd("flex");
    me("#formatSelector").value = card.format || "CODE128";
    renderCode(card.barcode_number, me("#formatSelector").value);
}

function deleteCard(i) {
    if (confirm("Delete this card?")) {
        cards.splice(i, 1);
        localStorage.setItem('cards', JSON.stringify(cards));
        renderList();
    }
}

// Main Initialization
export function initLoyal() {
    // Safety check for Surreal library
    if (typeof me === 'undefined') return setTimeout(initLoyal, 10);

    const versionDisplay = document.querySelector("#version-display");
    if (versionDisplay) {
        const isTest = import.meta.env.BASE_URL.includes('/test/');
        const envLabel = isTest ? "(Test)" : "(Prod)";
        // Use the variable we defined in vite.config.js
        versionDisplay.innerText = `v${__APP_VERSION__} ${envLabel}`;
    }

    // Event: Dropdown Change
    me("#formatSelector").on("change", (e) => {
        const newFormat = e.target.value;
        const card = cards[currentCardIndex];
        if (card) {
            card.format = newFormat;
            localStorage.setItem('cards', JSON.stringify(cards));
            renderCode(card.barcode_number, newFormat);
        }
    });

    // Event: Save Card
    me("#saveBtn").on("click", () => {
        const sn = me("#store_name").value;
        const bn = me("#barcode_number").value;
        const cn = me("#customer_number").value;
        
        if(!sn || !bn) return alert("Enter Store Name and Barcode");
        
        cards.push({ 
            store_name: sn, 
            barcode_number: bn, 
            customer_number: cn, 
            format: "CODE128" 
        });
        
        localStorage.setItem('cards', JSON.stringify(cards));
        
        // Clear inputs
        me("#store_name").value = "";
        me("#barcode_number").value = "";
        me("#customer_number").value = "";
        
        renderList();
    });

    // Event: UI Controls
    me("#closeBtn").on("click", () => me("#detailView").classRemove("flex"));
    
    me("#backupBtn").on("click", () => {
        const date = new Date().toISOString().split('T')[0];
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cards));
        const dl = document.createElement('a');
        dl.setAttribute("href", dataStr);
        dl.setAttribute("download", `loyal_backup_${date}.json`);
        dl.click();
    });

    me("#restoreBtn").on("click", () => document.querySelector("#restoreFile").click());
    
    me("#restoreFile").on("change", (e) => {
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

    renderList();
}

// Kick it off when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLoyal);
} else {
    initLoyal();
}