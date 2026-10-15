import { createRoot } from "react-dom/client";
import App from "./App";
import { installGlobalFetchLoading } from "./lib/globalLoading";
import "./index.css";

installGlobalFetchLoading();

createRoot(document.getElementById("root")!).render(<App />);

// Remove the static HTML boot loader only after React has rendered its app shell.
requestAnimationFrame(() => {
  document.getElementById("bmaa-initial-loader")?.classList.add("bmaa-loader-hidden");
  window.setTimeout(() => document.getElementById("bmaa-initial-loader")?.remove(), 220);
});
