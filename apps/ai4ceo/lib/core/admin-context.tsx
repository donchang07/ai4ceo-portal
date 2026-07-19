"use client";

import { createContext, useContext, type ReactNode } from "react";

const AdminContext = createContext(false);

export function AdminProvider({ isAdmin, children }: { isAdmin: boolean; children: ReactNode }) {
  return <AdminContext.Provider value={isAdmin}>{children}</AdminContext.Provider>;
}

export function useIsAdmin(): boolean {
  return useContext(AdminContext);
}
