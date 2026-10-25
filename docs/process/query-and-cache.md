# Query and cache

TanStack Query owns server-shaped data. Zustand owns session status and in-memory profile.

## Rules

- Private keys include `accountKey()` (`tokens.accountId` or `guest`).
- Guest mode never enables `learner:*` queries.
- Logout removes `learner`, `attempt`, and `home` queries.
- Mutations do not retry. Queries retry twice only for retryable / 5xx errors. 4xx does not retry.
- `staleTime` 60s, `gcTime` 30 minutes.
- NetInfo drives `onlineManager`. AppState drives `focusManager` on native.

## Key examples

```
home(userId)
catalog(kind, filters)
learner/{userId}/enrollments
attempt/{userId}/{id}
search { q, type, cursor }
```

Do not put tokens or passwords in keys or logs.
