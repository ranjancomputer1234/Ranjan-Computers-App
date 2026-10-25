# Learner app architecture

Screens and feature hooks are split by category.

## Folders

| Path | Role |
| --- | --- |
| `src/app` | App shell (`AppRoot`, providers, error boundary) |
| `src/screens/<category>` | Screen UI only |
| `src/screens/<category>/index.ts` | Screen exports for navigation |
| `src/features/<category>/hooks` | Category data/session hooks |
| `src/core` | Session, DI, repositories, HTTP, query keys, storage |
| `src/navigation` | Root + tab navigators and param types |
| `src/components` | Shared UI kit and layout |
| `src/theme` | Colors, spacing, gradients |
| `src/mocks` | Dev fixtures and mock repositories |
| `android` / `ios` | Native shells (`com.rediapp.learner`) |

## Example

```
src/screens/auth/
  LoginScreen.tsx
  styles.ts
  index.ts

src/features/auth/
  hooks/useLogin.ts
  schema.ts
  index.ts
```

Navigation imports screens:

```ts
import {LoginScreen} from '../screens/auth';
```

Screens import hooks from features:

```ts
import {useLogin} from '../../features/auth/hooks/useLogin';
```

## Data flow

Screens → `features/<category>/hooks` → `useRepositories()` → mock or HTTP repositories.
