"use client";

import { useEffect } from "react";

/** Mounted once in the root layout. Registers public/sw.js after the page loads. */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Not fatal — the app works identically without an installed SW.
      });
    };

    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
