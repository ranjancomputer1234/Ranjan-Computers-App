# Session tokens and refresh

## Storage

| Secret | Location |
| --- | --- |
| Access + refresh tokens | Keychain (`react-native-keychain`), also copied to process memory |
| guestMode, wifiOnly, darkMode, recents, idempotency keys | AsyncStorage |

Tokens never persist in Zustand or plaintext files.

## Attach

Axios request interceptor adds `Authorization: Bearer` from memory.

## Refresh (single-flight)

On 401:

1. If a refresh is already running, wait on that promise.
2. `POST /auth/refresh` with refresh token.
3. If generation changed (logout), discard the result.
4. Retry the original request once.
5. If refresh is revoked → `onSessionRevoked` + logout.
6. If the network timed out → map to retryable offline error, **keep** tokens.

`bumpSessionGeneration()` on logout prevents account A’s late response from filling account B’s cache.
