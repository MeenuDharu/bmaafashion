export interface GlobalLoadingSnapshot {
  pendingRequests: number;
  pendingMutations: number;
}

let snapshot: GlobalLoadingSnapshot = {
  pendingRequests: 0,
  pendingMutations: 0,
};

export function getGlobalLoadingSnapshot(): GlobalLoadingSnapshot {
  return snapshot;
}

function publish() {
  window.dispatchEvent(new CustomEvent<GlobalLoadingSnapshot>("bmaa:global-loading", {
    detail: { ...snapshot },
  }));
}

export function beginGlobalRequest(isMutation: boolean) {
  snapshot = {
    pendingRequests: snapshot.pendingRequests + 1,
    pendingMutations: snapshot.pendingMutations + (isMutation ? 1 : 0),
  };
  publish();
}

export function endGlobalRequest(isMutation: boolean) {
  snapshot = {
    pendingRequests: Math.max(0, snapshot.pendingRequests - 1),
    pendingMutations: Math.max(0, snapshot.pendingMutations - (isMutation ? 1 : 0)),
  };
  publish();
}

/** Tracks API requests only; it does not change request options, responses, or error handling. */
let globalFetchLoadingInstalled = false;

export function installGlobalFetchLoading(): void {
  if (typeof window === "undefined" || globalFetchLoadingInstalled) return;
  globalFetchLoadingInstalled = true;

  const originalFetch = window.fetch.bind(window);
  const trackedFetch = (async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    let isApiRequest = false;
    let isMutation = false;

    try {
      const rawUrl = input instanceof Request ? input.url : String(input);
      const pathname = new URL(rawUrl, window.location.origin).pathname;
      isApiRequest = pathname === "/api" || pathname.startsWith("/api/");
      const method = (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
      isMutation = !["GET", "HEAD", "OPTIONS"].includes(method);
    } catch {
      // If the request URL cannot be parsed, leave it untracked and let fetch handle it normally.
    }

    if (isApiRequest) beginGlobalRequest(isMutation);
    try {
      return await originalFetch(input, init);
    } finally {
      if (isApiRequest) endGlobalRequest(isMutation);
    }
  }) as typeof window.fetch;

  window.fetch = trackedFetch;
}
