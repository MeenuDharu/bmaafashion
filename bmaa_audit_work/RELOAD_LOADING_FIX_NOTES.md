# BMAA Fashion — reload/loading fix

## What changed

1. `client/src/pages/VerifyEmail.tsx`
   - Adds a 15-second timeout to the email verification request.
   - Stops stale requests when the page is unmounted or React re-runs the effect.
   - Displays an actionable error instead of spinning forever if the API does not respond.
   - Handles non-JSON server responses without leaving the page in loading state.
   - Keeps already-verified responses as success when the API returns HTTP success.

2. `client/src/context/AuthContext.tsx`
   - Reads the saved auth token on the first render rather than waiting for a mount effect. This avoids a refresh-time race in which protected routes can briefly see a logged-out state.
   - Adds a 15-second timeout to the `/api/auth/user` request so a stalled API cannot leave protected pages loading forever.

## Validation status

`npm run check` was attempted but cannot complete in this environment because the installed dependencies are incomplete: TypeScript reports missing type definitions for `node` and `vite/client`. Install dependencies with `npm ci`, then run `npm run check` and `npm run build` before deployment.

If the page displays the timeout message, inspect the browser Network tab for `/api/auth/verify-email/<token>` or `/api/auth/user`; the request/backend is not returning in time. Do not share verification tokens or auth tokens in screenshots/logs.
