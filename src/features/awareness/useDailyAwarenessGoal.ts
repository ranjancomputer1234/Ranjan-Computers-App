import React from 'react';
import {accountKey} from '../../core/session';
import {getPreference, setPreference} from '../../core/storage';

const DAILY_GOAL = 3;

function localDayKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function useDailyAwarenessGoal() {
  const storageKey = React.useMemo(
    () => `awareness.daily.${accountKey()}.${localDayKey()}`,
    [],
  );
  const [studiedIds, setStudiedIds] = React.useState<string[]>([]);
  const studiedRef = React.useRef<string[]>([]);

  React.useEffect(() => {
    let active = true;
    getPreference<string[]>(storageKey, []).then(saved => {
      if (!active) return;
      const valid = Array.isArray(saved)
        ? saved.filter(id => typeof id === 'string')
        : [];
      studiedRef.current = [...new Set(valid)];
      setStudiedIds(studiedRef.current);
    });
    return () => {
      active = false;
    };
  }, [storageKey]);

  const markStudied = React.useCallback(
    (topicId: string) => {
      if (studiedRef.current.includes(topicId)) return;
      const next = [...studiedRef.current, topicId];
      studiedRef.current = next;
      setStudiedIds(next);
      setPreference(storageKey, next);
    },
    [storageKey],
  );

  return {
    goal: DAILY_GOAL,
    studiedIds,
    studiedCount: studiedIds.length,
    goalPercent: Math.min(100, Math.round((studiedIds.length / DAILY_GOAL) * 100)),
    markStudied,
  };
}
