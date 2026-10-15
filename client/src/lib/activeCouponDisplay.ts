export type ActiveCouponDisplay = {
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  discountAmount: number;
};

const STORAGE_KEY = "bmaa_active_coupon_display";
const CHANGE_EVENT = "bmaa-active-coupon-display-change";

export function readActiveCouponDisplay(): ActiveCouponDisplay | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ActiveCouponDisplay;
    if (!parsed.code || (parsed.discountType !== "percentage" && parsed.discountType !== "fixed")) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeActiveCouponDisplay(value: ActiveCouponDisplay | null): void {
  if (typeof window === "undefined") return;
  if (value) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  else window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribeActiveCouponDisplay(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(CHANGE_EVENT, onChange);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}
