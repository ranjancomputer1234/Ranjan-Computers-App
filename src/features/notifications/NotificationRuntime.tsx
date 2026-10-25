import React from 'react';
import {AppState} from 'react-native';
import {useQueryClient} from '@tanstack/react-query';
import {useRepositories} from '../../core/di';
import {useSessionStore} from '../../core/session';
import {usePreferencesStore} from '../settings/preferencesStore';
import {
  getInitialNotification,
  openedNotificationTarget,
  subscribeToNotificationEvents,
  syncPushDevice,
  type OpenedNotification,
} from './pushNotifications';

export function NotificationRuntime() {
  const repos = useRepositories();
  const queryClient = useQueryClient();
  const status = useSessionStore(state => state.status);
  const hydrated = usePreferencesStore(state => state.hydrated);
  const classes = usePreferencesStore(state => state.notifClasses);
  const tests = usePreferencesStore(state => state.notifTests);
  const news = usePreferencesStore(state => state.notifNews);
  const offers = usePreferencesStore(state => state.notifOffers);
  const language = usePreferencesStore(state => state.language);
  const pendingReadId = React.useRef<string | null>(null);

  const openNotification = React.useCallback((payload: OpenedNotification) => {
    if (useSessionStore.getState().status === 'authenticated') {
      void repos.account.markRead(payload.notificationId)
        .then(() => queryClient.invalidateQueries({queryKey: ['learner']}))
        .catch(() => {});
    } else {
      pendingReadId.current = payload.notificationId;
    }
    const target = openedNotificationTarget(payload);
    if (target) useSessionStore.getState().setPendingDestination(target);
  }, [queryClient, repos.account]);

  React.useEffect(() => {
    if (status !== 'authenticated' || !pendingReadId.current) return;
    const id = pendingReadId.current;
    pendingReadId.current = null;
    void repos.account.markRead(id)
      .then(() => Promise.all([
        queryClient.invalidateQueries({queryKey: ['learner']}),
        queryClient.invalidateQueries({queryKey: ['home']}),
      ]))
      .catch(() => {});
  }, [queryClient, repos.account, status]);

  React.useEffect(() => {
    let disposed = false;
    void getInitialNotification().then(payload => {
      if (!disposed && payload) openNotification(payload);
    });
    const unsubscribe = subscribeToNotificationEvents(openNotification, token => {
      if (useSessionStore.getState().status === 'authenticated') {
        void syncPushDevice(repos.account, token).catch(() => {});
      }
    });
    return () => {
      disposed = true;
      unsubscribe();
    };
  }, [openNotification, repos.account]);

  React.useEffect(() => {
    if (!hydrated || status !== 'authenticated') return;
    void syncPushDevice(repos.account).catch(() => {});
  }, [classes, hydrated, language, news, offers, repos.account, status, tests]);

  React.useEffect(() => {
    const subscription = AppState.addEventListener('change', next => {
      const session = useSessionStore.getState();
      if (next === 'active' && session.status === 'authenticated' && session.tokens?.accountId) {
        void queryClient.invalidateQueries({queryKey: ['learner', session.tokens.accountId, 'notifications']});
      }
    });
    return () => subscription.remove();
  }, [queryClient]);

  return null;
}
