import React from 'react';
import {AppState} from 'react-native';
import {useSessionStore} from '../../core/session';
import {msUntilNextLocalMidnight} from './dayStreak';
import {useStreakStore} from './streakStore';

/** Records one active day per signed-in local day, including the next midnight while the app stays open. */
export function DayStreakRuntime() {
  const status = useSessionStore(state => state.status);
  const accountId = useSessionStore(state => state.tokens?.accountId ?? null);

  React.useEffect(() => {
    if (status !== 'authenticated' || !accountId) {
      useStreakStore.getState().reset();
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const record = () => {
      void useStreakStore.getState().recordToday(accountId);
      timer = setTimeout(() => {
        if (!cancelled) record();
      }, msUntilNextLocalMidnight());
    };

    record();
    const subscription = AppState.addEventListener('change', next => {
      if (next === 'active') void useStreakStore.getState().recordToday(accountId);
    });

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      subscription.remove();
    };
  }, [status, accountId]);

  return null;
}
