import AsyncStorage from '@react-native-async-storage/async-storage';
import RNBlobUtil from 'react-native-blob-util';
import NetInfo from '@react-native-community/netinfo';
import { getPreference } from './storage';
import { currentSessionGeneration } from './api/http';

export type OfflineFile = {
  resourceId: string;
  title: string;
  kind: 'pdf' | 'notes';
  mimeType: string;
  bytes: number;
  expiresAt: string;
  savedAt?: string;
  encryptionAlgorithm?: string;
  packagingFormat?: string;
};
export type PlaybackAuthorization = {
  type: string;
  url?: string | null;
  expiresInSeconds?: number | null;
  status?: string;
};

export type DownloadAuthorization = {
  resourceId: string;
  /** Short-lived file session. Never use this as a video stream. */
  url: string;
  expiresAt: string;
  offlineUntil?: string;
  sha256?: string;
  mimeType: string;
  kind?: 'pdf' | 'video' | 'audio' | 'notes' | 'other';
  encryptionAlgorithm?: string;
  packagingFormat?: string;
  openInsideAppOnly: boolean;
  exportForbidden: boolean;
  publicStorageForbidden: boolean;
  offlineGrant?: {
    grantId: string;
    validFrom: string;
    validUntil: string;
    kid: string;
    signature: string;
    payload: Record<string, unknown>;
  };
  playback?: PlaybackAuthorization | null;
  drmStatus?: string;
  drmMessage?: string;
};

export type PrivateDelivery =
  | {kind: 'metadata'; note: string}
  | {kind: 'encrypted'; note: string}
  | {kind: 'pdf'; path: string};
const root = () => `${RNBlobUtil.fs.dirs.DocumentDir}/redi-offline`;
const folder = (owner: string) => `${root()}/user-${encodeURIComponent(owner)}`;
const pathFor = (owner: string, id: string) =>
  `${folder(owner)}/resource-${encodeURIComponent(id)}.enc`;
const manifestKey = (owner: string) =>
  `redi.offline.${encodeURIComponent(owner)}`;
const running = new Map<
  string,
  { owner: string; cancel: () => void; done: Promise<void> }
>();
let writes = Promise.resolve();

async function entries(owner: string): Promise<OfflineFile[]> {
  const raw = await AsyncStorage.getItem(manifestKey(owner));
  if (!raw) return [];
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(
    (item): item is OfflineFile =>
      typeof item?.resourceId === 'string' &&
      typeof item?.title === 'string' &&
      Number.isFinite(item?.bytes) &&
      Number.isFinite(Date.parse(item?.expiresAt)),
  );
}
function update(
  owner: string,
  change: (files: OfflineFile[]) => OfflineFile[],
) {
  const next = writes
    .catch(() => {})
    .then(async () => {
      await AsyncStorage.setItem(
        manifestKey(owner),
        JSON.stringify(change(await entries(owner))),
      );
    });
  writes = next;
  return next;
}

export function downloadExpiry(
  auth: DownloadAuthorization,
  now = Date.now(),
): string {
  const linkExpiry = Date.parse(auth.expiresAt);
  const expiry = auth.offlineUntil ?? auth.expiresAt;
  if (
    !(
      /^https:\/\/[^/\s@]+(?:\/|$)/i.test(auth.url) ||
      (__DEV__ && /^http:\/\/(?:localhost|127\.0\.0\.1|10\.0\.2\.2|10\.0\.3\.2)(?::\d+)?(?:\/|$)/i.test(auth.url))
    ) ||
    !Number.isFinite(linkExpiry) ||
    linkExpiry <= now ||
    !Number.isFinite(Date.parse(expiry)) ||
    Date.parse(expiry) <= now
  ) {
    throw new Error(
      'Download access has expired. Please refresh and try again.',
    );
  }
  if (auth.sha256 && !/^[a-f0-9]{64}$/i.test(auth.sha256))
    throw new Error('This download could not be verified.');
  if (!auth.openInsideAppOnly || !auth.exportForbidden || !auth.publicStorageForbidden) {
    throw new Error('This resource does not include the required protected-content policy.');
  }
  if (auth.mimeType === 'application/pdf' && auth.packagingFormat !== 'encrypted_pdf') {
    throw new Error('This PDF is not packaged for protected offline storage.');
  }
  return expiry;
}

export function assertOfflineGrant(auth: DownloadAuthorization, now = Date.now()): void {
  const grant = auth.offlineGrant;
  if (!grant?.grantId || !grant.signature || !grant.kid) {
    throw new Error('This file has no offline authorization. Reconnect and open it again.');
  }
  const validFrom = Date.parse(grant.validFrom);
  const validUntil = Date.parse(grant.validUntil);
  if (!Number.isFinite(validFrom) || !Number.isFinite(validUntil) || validFrom > now || validUntil <= now) {
    throw new Error('Offline authorization is no longer valid. Reconnect and open the file again.');
  }
  const payloadResource = grant.payload.resourceId;
  if (typeof payloadResource === 'string' && payloadResource !== auth.resourceId) {
    throw new Error('Offline authorization does not match this file.');
  }
}

export const offlineFiles = {
  async list(owner: string) {
    const files = await entries(owner);
    return Promise.all(
      files.map(async file => ({
        ...file,
        available:
          Date.parse(file.expiresAt) > Date.now() &&
          (await RNBlobUtil.fs.exists(pathFor(owner, file.resourceId))),
      })),
    );
  },
  async save(
    owner: string,
    file: Pick<OfflineFile, 'resourceId' | 'title' | 'kind' | 'mimeType'>,
    auth: DownloadAuthorization,
  ): Promise<void> {
    if (!owner || owner === 'guest')
      throw new Error('Sign in to save resources.');
    if (auth.resourceId !== file.resourceId)
      throw new Error('The download grant does not match this resource.');
    assertOfflineGrant(auth);
    if (auth.kind === 'video' || auth.playback)
      throw new Error('Video plays from the playback URL inside the app. It is not saved from the delivery link.');
    // Generic video downloads are deliberately excluded: DRM requires a provider license.
    if (file.mimeType !== 'application/pdf')
      throw new Error('Only PDF resources can be saved on this build.');
    const expiresAt = downloadExpiry(auth);
    const generation = currentSessionGeneration();
    const key = owner + ':' + file.resourceId;
    if (running.has(key))
      throw new Error('This resource is already downloading.');
    const network = await NetInfo.fetch();
    if (!network.isConnected)
      throw new Error('Connect to the internet to save this resource.');
    if ((await getPreference('wifiOnly', true)) && network.type !== 'wifi')
      throw new Error(
        'Connect to Wi-Fi or update your download preference in Settings.',
      );
    if (!(await RNBlobUtil.fs.exists(folder(owner))))
      await RNBlobUtil.fs.mkdir(folder(owner));
    if (generation !== currentSessionGeneration())
      throw new Error('Your account changed. Please reopen the resource.');
    if (running.has(key))
      throw new Error('This resource is already downloading.');
    const partial = pathFor(owner, file.resourceId) + '.part';
    const task = RNBlobUtil.config({
      path: partial,
      timeout: 120000,
      overwrite: true,
    }).fetch('GET', auth.url);
    let finish!: () => void;
    const done = new Promise<void>(resolve => {
      finish = resolve;
    });
    running.set(key, { owner, cancel: () => task.cancel(() => {}), done });
    try {
      const result = await task;
      if (generation !== currentSessionGeneration())
        throw new Error('Your account changed. The download was cancelled.');
      if (result.info().status !== 200)
        throw new Error('The resource could not be downloaded. Please retry.');
      const headers = result.info().headers ?? {};
      const contentType = Object.entries(headers).find(
        ([name]) => name.toLowerCase() === 'content-type',
      )?.[1];
      if (String(contentType ?? '').toLowerCase().includes('application/json')) {
        throw new Error(
          'Protected file storage is not connected yet. The server returned metadata instead of file bytes.',
        );
      }
      const stat = await RNBlobUtil.fs.stat(partial);
      if (Number(stat.size) <= 0)
        throw new Error('The downloaded file is empty.');
      if (
        auth.sha256 &&
        (await RNBlobUtil.fs.hash(partial, 'sha256')).toLowerCase() !==
          auth.sha256.toLowerCase()
      )
        throw new Error(
          'The file did not pass its integrity check. Please retry.',
        );
      if (Date.parse(expiresAt) <= Date.now())
        throw new Error(
          'Access expired during download. Please refresh and retry.',
        );
      if (generation !== currentSessionGeneration())
        throw new Error('Your account changed.');
      const destination = pathFor(owner, file.resourceId);
      if (await RNBlobUtil.fs.exists(destination))
        await RNBlobUtil.fs.unlink(destination);
      await RNBlobUtil.fs.mv(partial, destination);
      await update(owner, files => [
        ...files.filter(item => item.resourceId !== file.resourceId),
        {
          ...file,
          bytes: Number(stat.size),
          expiresAt,
          savedAt: new Date().toISOString(),
          encryptionAlgorithm: auth.encryptionAlgorithm,
          packagingFormat: auth.packagingFormat,
        },
      ]);
    } finally {
      try {
        if (await RNBlobUtil.fs.exists(partial))
          await RNBlobUtil.fs.unlink(partial);
      } finally {
        running.delete(key);
        finish();
      }
    }
  },
  async open() {
    throw new Error('Open this file in the app so access can be checked again.');
  },
  /**
   * Downloads the short-lived delivery URL into app-private cache.
   * The URL itself is not stored. Video streams must use playback.url instead.
   */
  async fetchPrivateCopy(auth: DownloadAuthorization): Promise<PrivateDelivery> {
    assertOfflineGrant(auth);
    downloadExpiry(auth);
    if (auth.kind === 'video' || auth.playback?.url) {
      throw new Error('Play this video from its playback URL. The delivery link is not a video stream.');
    }
    const directory = `${RNBlobUtil.fs.dirs.CacheDir}/redi-session`;
    if (!(await RNBlobUtil.fs.exists(directory))) await RNBlobUtil.fs.mkdir(directory);
    const target = `${directory}/resource-${encodeURIComponent(auth.resourceId)}`;
    const result = await RNBlobUtil.config({path: target, timeout: 120000, overwrite: true}).fetch('GET', auth.url);
    if (result.info().status !== 200) {
      throw new Error('The resource could not be opened. Please retry.');
    }
    const headers = result.info().headers ?? {};
    const contentType = String(
      Object.entries(headers).find(([name]) => name.toLowerCase() === 'content-type')?.[1] ?? '',
    ).toLowerCase();
    const stat = await RNBlobUtil.fs.stat(target);
    const size = Number(stat.size);
    if (contentType.includes('json') || size < 8192) {
      const body = await RNBlobUtil.fs.readFile(target, 'utf8');
      const trimmed = body.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        let note = 'Protected file storage is not connected yet.';
        try {
          const parsed = JSON.parse(trimmed) as {note?: string; status?: string};
          note = parsed.note || parsed.status || note;
        } catch {
          // The body was not JSON. Keep the generic note when the type said JSON.
          if (!contentType.includes('json')) throw new Error('The downloaded file could not be read inside the app.');
        }
        await RNBlobUtil.fs.unlink(target).catch(() => undefined);
        return {kind: 'metadata', note};
      }
    }
    const probe = `${target}.probe`;
    await RNBlobUtil.fs.slice(target, probe, 0, 8);
    const head = await RNBlobUtil.fs.readFile(probe, 'utf8');
    await RNBlobUtil.fs.unlink(probe).catch(() => undefined);
    if (auth.packagingFormat === 'encrypted_pdf' || auth.encryptionAlgorithm) {
      return {
        kind: 'encrypted',
        note: 'This file is stored only inside the app. The API did not provide a decryption key, so the pages cannot be shown.',
      };
    }
    if (!head.startsWith('%PDF')) {
      await RNBlobUtil.fs.unlink(target).catch(() => undefined);
      throw new Error('The downloaded file is not a PDF that can be shown inside the app.');
    }
    return {kind: 'pdf', path: target};
  },
  async remove(owner: string, resourceId: string) {
    const path = pathFor(owner, resourceId);
    if (await RNBlobUtil.fs.exists(path)) await RNBlobUtil.fs.unlink(path);
    await update(owner, files =>
      files.filter(item => item.resourceId !== resourceId),
    );
  },
  async clear(owner: string) {
    const tasks = [...running.values()].filter(task => task.owner === owner);
    for (const task of tasks) task.cancel();
    await Promise.allSettled(tasks.map(task => task.done));
    await writes.catch(() => {});
    const directory = folder(owner);
    // The directory is always a generated child of app-private redi-offline.
    if (await RNBlobUtil.fs.exists(directory))
      await RNBlobUtil.fs.unlink(directory);
    await AsyncStorage.removeItem(manifestKey(owner));
  },
};
