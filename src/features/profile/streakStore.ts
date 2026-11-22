import {create} from 'zustand';
import {useSessionStore} from '../../core/session';
import {getPreference, setPreference} from '../../core/storage';
import {currentStreak, localDayKey, mergeActiveDay} from './dayStreak';

type StreakState = {
  accountId: string | null;
  streakDays: number;
  recordToday: (accountId: string, now?: Date) => Promise<number>;
  reset: () => void;
};

const flights = new Map<string, Promise<number>>();

function storageKey(accountId: string): string {
  return `learning.streak.${accountId}`;
}

async function readDays(accountId: string): Promise<string[]> {
  const saved = await getPreference<unknown>(storageKey(accountId), []);
  return Array.isArray(saved) ? saved.filter((day): day is string => typeof day === 'string') : [];
}

export const useStreakStore = create<StreakState>(set => ({
  accountId: null,
  streakDays: 0,
  reset: () => set({accountId: null, streakDays: 0}),
  recordToday: (accountId, now = new Date()) => {
    const today = localDayKey(now);
    const flightKey = `${accountId}:${today}`;
    const existing = flights.get(flightKey);
    if (existing) return existing;

    const flight = (async () => {
      const saved = await readDays(accountId);
      const days = mergeActiveDay(saved, today);
      const unchanged = saved.length === days.length && days.every(day => saved.includes(day));
      if (!unchanged) await setPreference(storageKey(accountId), days);
      const streakDays = currentStreak(days, today);
      const session = useSessionStore.getState();
      if (session.status === 'authenticated' && session.tokens?.accountId === accountId) {
        set({accountId, streakDays});
      }
      return streakDays;
    })().finally(() => {
      flights.delete(flightKey);
    });

    flights.set(flightKey, flight);
    return flight;
  },
}));

export function useDayStreak(accountId: string | null): number | undefined {
  return useStreakStore(state => (accountId && state.accountId === accountId ? state.streakDays : undefined));
}
