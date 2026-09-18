// src/presets.ts
import type { BarcodeFormat } from "./types";

export interface BrandPreset {
  name: string;
  color: string;
  format: BarcodeFormat;
  placeholder?: string;
}

export interface RegionConfig {
  regionCode: string;
  regionName: string;
  brands: BrandPreset[];
}

export const REGIONS: Record<string, RegionConfig> = {
  NZ: {
    regionCode: "NZ",
    regionName: "New Zealand",
    brands: [
      { name: "Airpoints", color: "#000000", format: "CODE128" },
      { name: "BPme", color: "#007837", format: "CODE128" },
      { name: "Bunnings PowerPass", color: "#0d5257", format: "CODE128" },
      { name: "Club+", color: "#5853bf", format: "EAN13" },
      { name: "Everyday Rewards", color: "#f05123", format: "CODE128" },
      { name: "Farmers Club", color: "#1c2b4c", format: "CODE128" },
      { name: "Mitre 10 Club", color: "#ea5b0c", format: "CODE128" },
      { name: "My Challenge", color: "#d82c15", format: "QR" },
      { name: "The Warehouse", color: "#df1b24", format: "CODE128" },
    ],
  },
  AU: {
    regionCode: "AU",
    regionName: "Australia",
    brands: [
      { name: "Coles Flybuys", color: "#e01a22", format: "EAN13" },
      { name: "Everyday Rewards", color: "#f05123", format: "EAN13" },
      { name: "Myer One", color: "#000000", format: "CODE128" },
      { name: "Qantas Frequent Flyer", color: "#e40000", format: "CODE128" },
    ],
  },
};

export function getDeterministicColor(str: string): string {
  const palette = [
    "#4f46e5",
    "#0891b2",
    "#059669",
    "#d97706",
    "#dc2626",
    "#7c3aed",
    "#db2777",
    "#2563eb",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length];
}
