import React from 'react';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {useRepositories} from '../../../core/di';
import {queryKeys} from '../../../core/query';
import type {LiveClass} from '../../../core/types';
import {
  cancelLiveClassReminder,
  hasNativeReminderSupport,
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
    queryFn: () => repos.live.schedule(new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()),
  });
  const upcoming = React.useMemo(
    () => query.data?.filter(row => isUpcomingLiveClass(row)) ?? [],
    [query.data],
  );
  const allRemindersEnabled = upcoming.length > 0 && upcoming.every(row => row.reminderSet);
  React.useEffect(() => {
    query.data
      ?.filter(row => isUpcomingLiveClass(row) && row.reminderSet)
      .forEach(row => void scheduleLiveClassReminder(row));
  }, [query.data]);
  const reminder = useMutation({
    mutationFn: async ({id, enabled}: {id: string; enabled: boolean}) => {
      const item = query.data?.find(row => row.id === id);
      if (enabled) {
        if (!item || !isUpcomingLiveClass(item)) throw new Error('class_not_upcoming');
        const permission = await requestReminderPermission();
        if (!permissionAllowsReminders(permission)) throw new Error('notification_permission_denied');
        const scheduled = await scheduleLiveClassReminder(item);
        if (hasNativeReminderSupport() && !scheduled) throw new Error('local_schedule_failed');
        try {
          await repos.live.setReminder(id, true);
        } catch (error) {
          await cancelLiveClassReminder(id);
          throw error;
        }
        return;
      }
      await repos.live.setReminder(id, false);
      await cancelLiveClassReminder(id);
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
      const rows = upcoming.filter(row => !row.reminderSet);
      if (!rows.length) return {ids: [] as string[]};
      const permission = await requestReminderPermission();
      if (!permissionAllowsReminders(permission)) throw new Error('notification_permission_denied');
      const locallyScheduled: string[] = [];
      try {
        for (const row of rows) {
          const scheduled = await scheduleLiveClassReminder(row);
          if (hasNativeReminderSupport() && !scheduled) throw new Error('local_schedule_failed');
          if (scheduled) locallyScheduled.push(row.id);
        }
        await Promise.all(rows.map(row => repos.live.setReminder(row.id, true)));
      } catch (error) {
        await Promise.all(locallyScheduled.map(cancelLiveClassReminder));
        throw error;
      }
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
  return {query, reminder, enableAll, upcomingCount: upcoming.length, allRemindersEnabled};
}
