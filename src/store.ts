// src/store.ts
import { writable } from 'svelte/store';
import type { Card } from './types';

const stored = localStorage.getItem('cards');
const initialCards: Card[] = stored ? JSON.parse(stored) : [];

export const cardsStore = writable<Card[]>(initialCards);

// Automatically save to localStorage whenever cards change
cardsStore.subscribe(val => {
    localStorage.setItem('cards', JSON.stringify(val));
});