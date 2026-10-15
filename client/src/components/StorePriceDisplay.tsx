import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useEffect, useState } from "react";
import { readActiveCouponDisplay, subscribeActiveCouponDisplay, type ActiveCouponDisplay } from "@/lib/activeCouponDisplay";

interface StorePriceDisplayProps {
  price: string | number | null | undefined;
  className?: string;
  originalClassName?: string;
  discountClassName?: string;
  codeClassName?: string;
  showCodeInManualMode?: boolean;
}

/** Flipkart-style presentation for the configured global storewide discount. */
export default function StorePriceDisplay({
  price,
  className = "text-2xl sm:text-3xl font-bold text-primary",
  originalClassName = "text-sm text-muted-foreground line-through",
  discountClassName = "text-xs font-semibold text-green-600",
  codeClassName = "text-xs text-muted-foreground",
  showCodeInManualMode = true,
}: StorePriceDisplayProps) {
  const { orderSettings } = useSiteSettings();
  const [activeCoupon, setActiveCoupon] = useState<ActiveCouponDisplay | null>(() => readActiveCouponDisplay());
  useEffect(() => subscribeActiveCouponDisplay(() => setActiveCoupon(readActiveCouponDisplay())), []);
  const original = Math.max(0, Number(price ?? 0));
  const globalPercent = Math.min(100, Math.max(0, Number(orderSettings?.globalDiscountPercent ?? 30)));
  const percent = activeCoupon?.discountType === "percentage"
    ? Math.min(100, Math.max(0, Number(activeCoupon.discountValue)))
    : activeCoupon ? 0 : globalPercent;
  const mode = activeCoupon ? "automatic" : (orderSettings?.globalDiscountMode ?? "automatic");
  const code = activeCoupon?.code || String(orderSettings?.globalDiscountCode || "STORE30").trim().toUpperCase();
  const hasDiscount = percent > 0 && (!activeCoupon || activeCoupon.discountType === "percentage");
  const offer = Math.max(0, Number((original * (1 - percent / 100)).toFixed(2)));
  const format = (value: number) => value.toLocaleString("en-IN", { maximumFractionDigits: 2 });

  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <span className={className}>₹{format(hasDiscount ? offer : original)}</span>
      {hasDiscount && <>
        <span className={originalClassName}>₹{format(original)}</span>
        <span className={discountClassName}>{percent}% off</span>
        {mode === "manual" && showCodeInManualMode && <span className={codeClassName}>with code {code}</span>}
      </>}
    </div>
  );
}
