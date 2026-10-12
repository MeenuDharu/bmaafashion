# Action-level loading indicators

The shared `client/src/components/ui/button.tsx` Button now supports:

- `loading={boolean}` for mutation/query state such as `mutation.isPending` / `mutation.isLoading`.
- `loadingText="Saving…"` to replace the label while busy.
- Automatic spinner + disabled state when an `onClick` callback returns a Promise.
- `aria-busy` and an accessible spinner label.

Examples:

```tsx
<Button loading={createCoupon.isPending} loadingText="Creating…" onClick={() => createCoupon.mutate(payload)}>
  Create Offer / Coupon
</Button>

<Button onClick={async () => { await saveSettings(); }} loadingText="Saving…">
  Save Settings
</Button>
```

Important: React Query's `mutate()` returns void. For mutation buttons, pass the mutation's pending state through `loading`. If a form uses `handleSubmit` and its callback is async, prefer `loading={form.formState.isSubmitting}`. A shared Button cannot infer the lifetime of a fire-and-forget request.
