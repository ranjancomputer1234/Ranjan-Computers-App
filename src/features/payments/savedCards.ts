import {getAccountScoped, setAccountScoped} from '../../core/storage';
import type {SavedCard} from './paymentInstruments';

const KEY = 'savedCards';

function isSavedCard(value: unknown): value is SavedCard {
  if (!value || typeof value !== 'object') return false;
  const card = value as SavedCard;
  return Boolean(card.id && card.brand && /^\d{4}$/.test(card.last4) && /^\d{2}\/\d{2}$/.test(card.expiry) && card.name);
}

export async function readSavedCards(accountId: string): Promise<SavedCard[]> {
  const rows = await getAccountScoped<unknown>(accountId, KEY, []);
  if (!Array.isArray(rows)) return [];
  return rows.filter(isSavedCard).slice(0, 5);
}

export function mergeSavedCard(cards: SavedCard[], card: SavedCard) {
  return [card, ...cards.filter(item => item.id !== card.id)].slice(0, 5);
}

export async function storeSavedCard(accountId: string, card: SavedCard) {
  const next = mergeSavedCard(await readSavedCards(accountId), card);
  await setAccountScoped(accountId, KEY, next);
  return next;
}
