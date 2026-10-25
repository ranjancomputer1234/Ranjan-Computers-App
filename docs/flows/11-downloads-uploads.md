# 11. Downloads and uploads

## Downloads

1. `POST /resources/{id}/download-authorization` (short-lived URL).
2. Queue states: queued, downloading, paused, failed, expired.
3. Measured bytes, not a fake 100%.
4. Wi-Fi-only preference from Settings (`wifiOnly`).
5. DRM / Widevine offline is **not claimed**.

Logout does not treat leftover files as still entitled; UI lists are account-scoped.

## Uploads

Avatar / project file: validate type/size, show progress, then API complete.

A successful byte upload is not institute acceptance of a semester project.
