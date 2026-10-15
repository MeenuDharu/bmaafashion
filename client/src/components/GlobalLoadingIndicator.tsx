import { useEffect, useState } from "react";
import { getGlobalLoadingSnapshot, type GlobalLoadingSnapshot } from "@/lib/globalLoading";

export default function GlobalLoadingIndicator() {
  const [snapshot, setSnapshot] = useState<GlobalLoadingSnapshot>(() => getGlobalLoadingSnapshot());
  const [showMutationOverlay, setShowMutationOverlay] = useState(false);
  const [showProgress, setShowProgress] = useState(false);

  useEffect(() => {
    const handleLoading = (event: Event) => {
      const customEvent = event as CustomEvent<GlobalLoadingSnapshot>;
      setSnapshot(customEvent.detail);
    };
    window.addEventListener("bmaa:global-loading", handleLoading);
    return () => window.removeEventListener("bmaa:global-loading", handleLoading);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowMutationOverlay(snapshot.pendingMutations > 0);
      setShowProgress(snapshot.pendingRequests > 0);
    }, 160);
    if (snapshot.pendingMutations === 0) setShowMutationOverlay(false);
    if (snapshot.pendingRequests === 0) setShowProgress(false);
    return () => window.clearTimeout(timer);
  }, [snapshot.pendingRequests, snapshot.pendingMutations]);

  return (
    <>
      {showProgress && (
        <div className="bmaa-loading-progress" role="progressbar" aria-label="Loading page data">
          <span />
        </div>
      )}
      {showMutationOverlay && (
        <div className="bmaa-action-loading-overlay" role="status" aria-live="polite" aria-label="Processing your request">
          <div className="bmaa-action-loading-card">
            <span className="bmaa-loading-spinner" aria-hidden="true" />
            <span className="font-medium">Please wait…</span>
            <span className="text-sm text-muted-foreground">Processing your request</span>
          </div>
        </div>
      )}
    </>
  );
}
