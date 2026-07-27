"use client";

import { lazy, Suspense, useEffect, useState } from "react";

const CityMediaExperience = lazy(() => import("./CityMediaExperience"));
const OperationsEnhancer = lazy(() => import("./OperationsEnhancer"));

export default function AuthenticatedEnhancements() {
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const sync = () => {
      setAuthenticated(document.documentElement.dataset.authState === "authenticated");
    };
    const handleAuthState = (event: Event) => {
      const state = (event as CustomEvent<string>).detail;
      setAuthenticated(state === "authenticated");
    };

    sync();
    window.addEventListener("civiclens:auth-state", handleAuthState);
    return () => window.removeEventListener("civiclens:auth-state", handleAuthState);
  }, []);

  if (!authenticated) return null;

  return (
    <Suspense fallback={null}>
      <CityMediaExperience />
      <OperationsEnhancer />
    </Suspense>
  );
}
