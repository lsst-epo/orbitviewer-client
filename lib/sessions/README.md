# Preview sessions

Craft preview tokens are handed over on the `/api/preview` round trip and then
replayed on every subsequent GraphQL request for the duration of the
draft-mode session.

**Every method is async.** `cookies()` and `draftMode()` both return Promises
as of Next.js 15, so there is no synchronous way to read the token.

A request carrying a token is never cached — see `lib/api/client.ts`.
