import {purgeMockNamespaces} from './purgeMockNamespaces';

let ran = false;

/**
 * Run retained cleanup migrations before session/query hydration.
 * Safe to call multiple times; work is idempotent.
 */
export async function runStartupMigrations(): Promise<void> {
  if (ran) return;
  ran = true;
  await purgeMockNamespaces();
}
