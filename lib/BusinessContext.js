"use client";

import { createContext, useContext } from "react";

export const BusinessContext = createContext(null);

export function useBusiness() {
  const ctx = useContext(BusinessContext);
  if (!ctx) throw new Error("useBusiness debe usarse dentro de /panel");
  return ctx;
}