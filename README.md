<p align="center">
  <img src="public/loyal_hero.png" width="600" alt="Loyal Hero Image">
</p>

# 🏷️ Loyal
**Elegant, Private, Local Loyalty Card Storage**

A ultra-minimalist, privacy-first Progressive Web App (PWA) designed to replace bloated loyalty apps. No tracking, no accounts, no cloud—just your barcodes stored securely and locally on your device.

## 🚀 Getting Started
1. Open the [Live Link](https://cosmkiwi.github.io/loyal/) in your mobile browser.
2. Add your store cards (Name, Barcode, and Customer Number).
3. Tap **"Install App"** or **"Add to Home Screen"** in your browser menu.

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