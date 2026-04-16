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
- **Zero Bloat:** Rebuilt with Svelte for a declarative, lightning-fast UI and seamless state management.
- **Privacy First:** Data stays in your browser's `localStorage`. Nothing is ever uploaded.
- **Offline Ready:** Built with `vite-plugin-pwa` for 100% reliability with zero cell signal.
- **Mobile Optimized:** Gracefully handles mobile OS sleep/wake cycles with persistent local state and native Wake Lock API integration.

## 🛠️ Tech Stack
- **Svelte:** Declarative, compiler-based framework for a tiny, highly optimized footprint.
- **TypeScript:** End-to-end type safety for rock-solid data integrity.
- **Vite + Bun:** Modern build toolchain for instant dev serving and optimized asset delivery.
- **JsBarcode & node-qrcode:** Lightweight libraries for barcode and QR code generation.
- **Html5Qrcode:** Fast, robust in-browser camera scanning.
- **Service Workers:** Automated via Workbox for advanced offline caching.

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