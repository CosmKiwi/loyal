// src/types.ts
export type BarcodeFormat = "CODE128" | "EAN13" | "UPC" | "QR";

export interface Card {
  store_name: string;
  card_name?: string;
  barcode_number: string;
  customer_number?: string;
  format: BarcodeFormat;
  color?: string;
}
