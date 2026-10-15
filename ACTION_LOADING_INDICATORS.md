# BMAA Fashion global loading indicators

This update adds loading feedback without changing commerce, coupon, shipping, stock, or order calculations.

- A static boot loader appears immediately in `client/index.html`, avoiding a blank screen while React starts.
- A slim progress bar appears for in-flight `/api/*` requests, including page data loads.
- A centered `Please wait…` overlay appears for API mutations (`POST`, `PUT`, `PATCH`, `DELETE`) so save, create, update, remove, checkout, and other server-backed actions show progress.
- The fetch wrapper passes the same input and init to the original browser `fetch`, returns its response unchanged, and uses `finally` only to clear loading state.
- The loading indicator supports concurrent API requests and delays its appearance briefly to avoid flashing for fast requests.
- Images and third-party font/script requests are not tracked by the API loader.

Files changed:
- `client/index.html`
- `client/src/main.tsx`
- `client/src/App.tsx`
- `client/src/index.css`
- `client/src/lib/globalLoading.ts` (new)
- `client/src/components/GlobalLoadingIndicator.tsx` (new)

Run `npm run check` and `npm run build` locally before deploying. The environment used to prepare this ZIP did not have project dependencies installed, so those commands could not be verified here.
