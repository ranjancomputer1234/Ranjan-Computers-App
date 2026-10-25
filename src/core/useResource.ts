import {useRef} from 'react';
import {useRepositories} from './di';
import {useAsyncAction} from './useAsyncAction';
import {accountKey} from './session';
import {downloadExpiry, offlineFiles, type OfflineFile} from './offlineFiles';
import {queryClient} from './query';

export function useResource() {
  const repos = useRepositories();
  const request = useRef<{file: Pick<OfflineFile, 'resourceId' | 'title' | 'kind' | 'mimeType'>; save: boolean} | null>(null);
  const action = useAsyncAction(async () => {
    const selected = request.current;
    if (!selected) return;
    const owner = accountKey();
    if (owner === 'guest') throw new Error('Sign in to access your resources.');
    const auth = await repos.account.authorizeDownload(selected.file.resourceId);
    downloadExpiry(auth);
    if (selected.save) {
      await offlineFiles.save(owner, selected.file, auth);
      await queryClient.invalidateQueries({queryKey: ['offline-files', owner]});
    } else {
      throw new Error(
        'Protected resources can only open inside RACI. The in-app encrypted viewer is waiting for the backend storage and decryption provider.',
      );
    }
  });
  return {...action, open: (file: NonNullable<typeof request.current>['file'], save = false) => {
    if (action.busy) return;
    request.current = {file, save};
    void action.run();
  }};
}
