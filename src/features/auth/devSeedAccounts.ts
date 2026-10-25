import {appConfig} from '../../core/config';

export type DevSeedAccount = {
  name: string;
  email: string;
  password: string;
  description: string;
};

/**
 * No passwords live in source. Debug seed accounts come only from the gitignored
 * project-root .env after a native rebuild. Release bundles drop this branch.
 */
const handoverSeedAccounts: DevSeedAccount[] = [];

/** Debug-only accounts injected from the gitignored .env. Empty when that file is absent. */
export const DEV_SEED_ACCOUNTS: DevSeedAccount[] = __DEV__
  ? appConfig.seedAccounts.length
    ? appConfig.seedAccounts
    : handoverSeedAccounts
  : [];
