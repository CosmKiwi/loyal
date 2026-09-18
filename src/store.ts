// src/store.ts
import { writable } from "svelte/store";
import type { Card } from "./types";
import { REGIONS, getDeterministicColor } from "./presets";

export type Theme = "system" | "light" | "dark";

export const themeStore = writable<Theme>(
  (localStorage.getItem("loyal_theme") as Theme) || "system",
);

themeStore.subscribe((val) => {
  if (typeof window === "undefined") return;
  localStorage.setItem("loyal_theme", val);

  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = val === "dark" || (val === "system" && prefersDark);

  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.classList.toggle("light", val === "light");
});

if (typeof window !== "undefined") {
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", (e) => {
      let currentTheme: Theme = "system";
      themeStore.subscribe((v) => (currentTheme = v))();

      if (currentTheme === "system") {
        document.documentElement.classList.toggle("dark", e.matches);
      }
    });
}

/**
 * Normalizes legacy card formats, fills missing colors,
 * and maps legacy brand names to their modern equivalents.
 */
export function migrateCards(rawCards: any[]): Card[] {
  if (!Array.isArray(rawCards)) return [];

  const allPresets = Object.values(REGIONS).flatMap((r) => r.brands);

  return rawCards.map((item) => {
    let storeName: string = (item.store_name || item.name || "Unknown").trim();

    const lower = storeName.toLowerCase();
    if (lower === "countdown" || lower.includes("countdown")) {
      storeName = "Everyday Rewards";
    } else if (
      lower.includes("new world") ||
      lower.includes("pak'nsave") ||
      lower.includes("paknsave") ||
      lower.includes("four square")
    ) {
      storeName = "Club+";
    }

    const preset = allPresets.find(
      (b) => b.name.toLowerCase() === storeName.toLowerCase(),
    );

    const color =
      item.color || preset?.color || getDeterministicColor(storeName);

    const format = item.format || preset?.format || "CODE128";

    return {
      store_name: storeName,
      card_name: item.card_name || undefined,
      barcode_number: String(item.barcode_number || ""),
      customer_number: item.customer_number
        ? String(item.customer_number)
        : undefined,
      format,
      color,
    };
  });
}

// --- Store Initialization ---
const storedCards =
  typeof window !== "undefined" ? localStorage.getItem("cards") : null;
let initialCards: Card[] = [];

if (storedCards) {
  try {
    initialCards = migrateCards(JSON.parse(storedCards));
  } catch (err) {
    console.error("Failed to parse stored cards", err);
  }
}

export const cardsStore = writable<Card[]>(initialCards);

cardsStore.subscribe((value) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("cards", JSON.stringify(value));
  }
});

// Detect region from browser locale (e.g. "en-NZ" -> "NZ"), fallback to NZ
const detectedRegion = (
  (typeof navigator !== "undefined" && navigator.language?.split("-")[1]) ||
  "NZ"
).toUpperCase();

const initialRegion =
  (typeof window !== "undefined" && localStorage.getItem("loyal_region")) ||
  (detectedRegion === "AU" ? "AU" : "NZ");

export const regionStore = writable<string>(initialRegion);

regionStore.subscribe((val) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("loyal_region", val);
  }
});
