# Data source

`src/core/config.ts` reads `REDI_DATA_SOURCE`.

| Value | When | Implementation |
| --- | --- | --- |
| `mock` | Default in debug when not forced to `api` | `src/mocks/` (fixtures, repositories, scenarios) |
| `api` | Release, or debug with `REDI_DATA_SOURCE=api` | `src/core/api/httpRepositories.ts` |

`src/core/di.ts` picks one `Repositories` object for the whole app.

Release builds must set `REDI_DATA_SOURCE=api` and must not ship a developer switch that re-enables mocks.

HTTP paths are **proposed**. They are not verified against a live REDI OpenAPI contract. See `docs/api-integration.md` and `docs/backend-handoff.md`.

`https://api.redi.invalid/v1` is an intentional placeholder host.

## Development dataset

See [development-data.md](../development-data.md) for dummy coverage (including payments), demo accounts, ownership manifest, and `npm run devdata:remove`.
