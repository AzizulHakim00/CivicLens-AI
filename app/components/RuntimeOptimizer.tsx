"use client";

import { useEffect } from "react";

type NavigatorHints = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean; effectiveType?: string };
};

type AuthState = "loading" | "anonymous" | "authenticated";

function resolveAuthState(): AuthState {
  if (document.querySelector(".auth-account-dock")) return "authenticated";
  if (document.querySelector(".auth-gate")) return "anonymous";
  return "loading";
}

export default function RuntimeOptimizer() {
  useEffect(() => {
    const root = document.documentElement;
    const navigatorHints = navigator as NavigatorHints;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lowMemory = typeof navigatorHints.deviceMemory === "number" && navigatorHints.deviceMemory <= 4;
    const lowCpu = typeof navigator.hardwareConcurrency === "number" && navigator.hardwareConcurrency <= 4;
    const constrainedNetwork =
      navigatorHints.connection?.saveData === true ||
      ["slow-2g", "2g"].includes(navigatorHints.connection?.effectiveType ?? "");
    const compactViewport = window.matchMedia("(max-width: 760px)").matches;

    root.dataset.performance = reducedMotion || lowMemory || lowCpu || constrainedNetwork || compactViewport ? "lite" : "standard";
    root.dataset.authState = "loading";

    let currentState: AuthState = "loading";
    const publishAuthState = () => {
      const nextState = resolveAuthState();
      if (nextState === currentState) return;
      currentState = nextState;
      root.dataset.authState = nextState;
      window.dispatchEvent(new CustomEvent("civiclens:auth-state", { detail: nextState }));
    };

    const observer = new MutationObserver(publishAuthState);
    observer.observe(document.body, { childList: true, subtree: true });
    publishAuthState();

    const handleVisibility = () => {
      root.dataset.runtimePaused = document.hidden ? "true" : "false";
    };
    document.addEventListener("visibilitychange", handleVisibility, { passive: true });
    handleVisibility();

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
      delete root.dataset.runtimePaused;
    };
  }, []);

  return null;
}
