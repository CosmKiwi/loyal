# 🏷️ loyal
**Local Loyalty Card Storage**

A ultra-minimalist, privacy-first Progressive Web App (PWA) to replace bloated loyalty apps. No tracking, no accounts, no cloud—just your barcodes stored locally on your device.

## ✨ Features
- **Zero Bloat:** Modernized with Vite and Umbrella JS for lightning-fast performance.
- **Privacy First:** Data stays in your browser's `localStorage`. Nothing is ever uploaded.
- **Offline Ready:** Built with `vite-plugin-pwa` for 100% reliability with zero signal.
- **PWA Powered:** Installable on Android and iOS home screens.

## 🛠️ Tech Stack
- **Vite + Bun:** Modern build toolchain for optimized asset delivery.
- **Umbrella JS:** A tiny, powerful library for DOM manipulation and events.
- **JsBarcode & node-qrcode:** Lightweight libraries for barcode and QR code generation.
- **Service Workers:** Automated via Workbox for advanced caching.

## 🚀 Development
If you want to run this locally:

1. **Install Dependencies:**
   ```bash
   bun install
   ```

2. **Start Dev Server:**
    ```bash
    bun dev
    ```
    
3. **Build for Production:**
    ```bash
    bun run build
    ```

## 📜 License
MIT © Cosm Kiwi