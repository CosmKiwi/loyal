// src/store.svelte.ts
import type { Card } from "./types";
import { REGIONS, getDeterministicColor } from "./presets";

export type Theme = "system" | "light" | "dark";

function generateId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    // Fall back if crypto.randomUUID throws in unsecure contexts
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Normalizes legacy card formats, generates missing IDs, fills missing colors,
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
      id: item.id || generateId(),
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

// --- Theme Reactive State ---
function applyTheme(val: Theme) {
  if (typeof window === "undefined") return;
  localStorage.setItem("loyal_theme", val);

  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = val === "dark" || (val === "system" && prefersDark);

  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.classList.toggle("light", val === "light");
}

const savedTheme =
  typeof window !== "undefined"
    ? ((localStorage.getItem("loyal_theme") as Theme) || "system")
    : "system";

let currentTheme = $state<Theme>(savedTheme);

if (typeof window !== "undefined") {
  applyTheme(savedTheme);

  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", (e) => {
      if (currentTheme === "system") {
        document.documentElement.classList.toggle("dark", e.matches);
      }
    });
}

export const themeStore = {
  get current() {
    return currentTheme;
  },
  set current(val: Theme) {
    currentTheme = val;
    applyTheme(val);
  },
};

// --- Region Reactive State ---
const detectedRegion = (
  (typeof navigator !== "undefined" && navigator.language?.split("-")[1]) ||
  "NZ"
).toUpperCase();

const initialRegion =
  (typeof window !== "undefined" && localStorage.getItem("loyal_region")) ||
  (detectedRegion === "AU" ? "AU" : "NZ");

let currentRegion = $state<string>(initialRegion);

export const regionStore = {
  get current() {
    return currentRegion;
  },
  set current(val: string) {
    currentRegion = val;
    if (typeof window !== "undefined") {
      localStorage.setItem("loyal_region", val);
    }
  },
};

// --- Cards Reactive State ---
function loadInitialCards(): Card[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem("cards");
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored);
    const migrated = migrateCards(parsed);
    // If migration assigned new IDs or modernized brands, persist the update
    localStorage.setItem("cards", JSON.stringify(migrated));
    return migrated;
  } catch (err) {
    console.error("Failed to parse stored cards", err);
    return [];
  }
}

let cardList = $state<Card[]>(loadInitialCards());

function saveCards() {
  if (typeof window !== "undefined") {
    localStorage.setItem("cards", JSON.stringify(cardList));
  }
}

export const cardStore = {
  get items() {
    return cardList;
  },
  set items(value: Card[]) {
    cardList = value;
    saveCards();
  },
  add(card: Omit<Card, "id"> & { id?: string }): Card {
    const newCard: Card = {
      ...card,
      id: card.id || generateId(),
    };
    cardList.push(newCard);
    saveCards();
    return newCard;
  },
  update(id: string, updates: Partial<Card>) {
    const idx = cardList.findIndex((c) => c.id === id);
    if (idx !== -1) {
      cardList[idx] = { ...cardList[idx], ...updates };
      saveCards();
    }
  },
  remove(id: string) {
    cardList = cardList.filter((c) => c.id !== id);
    saveCards();
  },
  reorder(fromIndex: number, toIndex: number) {
    if (
      fromIndex < 0 ||
      fromIndex >= cardList.length ||
      toIndex < 0 ||
      toIndex >= cardList.length
    ) {
      return;
    }
    const [moved] = cardList.splice(fromIndex, 1);
    cardList.splice(toIndex, 0, moved);
    saveCards();
  },
  replace(newCards: Card[]) {
    cardList = newCards;
    saveCards();
  },
  rehydrate() {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem("cards");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        // Quick update without re-running full migration if unchanged
        cardList = parsed;
      } catch (e) {
        console.warn("Failed to rehydrate cards on wake", e);
      }
    }
  },
};
