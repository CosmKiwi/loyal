// src/types.ts
export type BarcodeFormat = "CODE128" | "EAN13" | "UPC" | "QR";

export interface Card {
  id: string;
  store_name: string;
  card_name?: string;
  barcode_number: string;
  customer_number?: string;
  format: BarcodeFormat;
  color: string;
}

export const SUPPORTED_FORMATS: { value: BarcodeFormat; label: string }[] = [
  { value: "CODE128", label: "Code 128 (Standard)" },
  { value: "EAN13", label: "EAN-13 (Supermarkets)" },
  { value: "UPC", label: "UPC (12 digits)" },
  { value: "QR", label: "QR Code" },
];
