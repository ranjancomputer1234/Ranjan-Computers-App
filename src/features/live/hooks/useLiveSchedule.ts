import React from 'react';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {useRepositories} from '../../../core/di';
import {queryKeys} from '../../../core/query';
import {isAuthenticated} from '../../../core/session';
import type {LiveClass} from '../../../core/types';
import {canRemindLiveClass} from '../visibleClasses';
import {
  cancelLiveClassReminder,
  isUpcomingLiveClass,
  permissionAllowsReminders,
  requestReminderPermission,
  scheduleLiveClassReminder,
} from '../../settings/reminders';

export function useLiveSchedule() {
  const repos = useRepositories();
  const client = useQueryClient();
  const query = useQuery({
    queryKey: queryKeys.live({}),
    queryFn: () => repos.live.schedule(new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString()),
  });
  const remindable = React.useMemo(
    () => query.data?.filter(row => canRemindLiveClass(row)) ?? [],
    [query.data],
  );
  const allRemindersEnabled = remindable.length > 0 && remindable.every(row => row.reminderSet);
  React.useEffect(() => {
    query.data
      ?.filter(row => isUpcomingLiveClass(row) && row.reminderSet)
      .forEach(row => void scheduleLiveClassReminder(row));
  }, [query.data]);
  const reminder = useMutation({
    mutationFn: async ({id, enabled}: {id: string; enabled: boolean}) => {
      if (!isAuthenticated()) throw new Error('sign_in_required');
      const item = query.data?.find(row => row.id === id);
      if (enabled) {
        if (!item || item.canSetReminder === false) throw new Error('class_not_upcoming');
        if (item.canSetReminder !== true && !isUpcomingLiveClass(item)) throw new Error('class_not_upcoming');
        const permission = await requestReminderPermission();
        if (!permissionAllowsReminders(permission)) throw new Error('notification_permission_denied');
      }
      await repos.live.setReminder(id, enabled);
      if (!enabled) {
        await cancelLiveClassReminder(id);
        return;
      }
      if (item) {
        try {
          await scheduleLiveClassReminder(item);
        } catch {
          // The server sends the 15-minute class push. The bell stays on.
        }
      }
    },
    onMutate: async ({id, enabled}) => {
      await client.cancelQueries({queryKey: ['live']});
      const snapshots = client.getQueriesData<LiveClass[]>({queryKey: ['live']});
      client.setQueriesData<LiveClass[]>({queryKey: ['live']}, rows =>
        rows?.map(row => row.id === id ? {...row, reminderSet: enabled} : row),
      );
      return {snapshots};
    },
    onError: (_error, _variables, context) => {
      context?.snapshots.forEach(([key, data]) => client.setQueryData(key, data));
    },
    onSettled: () => client.invalidateQueries({queryKey: ['live']}),
  });
  const enableAll = useMutation({
    mutationFn: async () => {
      if (!isAuthenticated()) throw new Error('sign_in_required');
      const rows = remindable.filter(row => !row.reminderSet);
      if (!rows.length) return {ids: [] as string[]};
      const permission = await requestReminderPermission();
      if (!permissionAllowsReminders(permission)) throw new Error('notification_permission_denied');
      await Promise.all(rows.map(row => repos.live.setReminder(row.id, true)));
      await Promise.all(rows.map(async row => {
        try {
          await scheduleLiveClassReminder(row);
        } catch {
          // The server reminder is already on.
        }
      }));
      return {ids: rows.map(row => row.id)};
    },
    onSuccess: result => {
      const enabled = new Set(result.ids);
      client.setQueriesData<LiveClass[]>({queryKey: ['live']}, rows =>
        rows?.map(row => enabled.has(row.id) ? {...row, reminderSet: true} : row),
      );
    },
    onSettled: () => client.invalidateQueries({queryKey: ['live']}),
  });
  return {query, reminder, enableAll, upcomingCount: remindable.length, allRemindersEnabled};
}
