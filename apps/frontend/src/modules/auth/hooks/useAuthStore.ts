import { create } from "zustand";

export interface CurrentUser {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  avatarUrl?: string | null;
}

interface AuthState {
  accessToken: string | null;
  user: CurrentUser | null;
  permissions: string[];
  setSession: (accessToken: string, user: CurrentUser, permissions: string[]) => void;
  setAccessToken: (token: string) => void;
  clear: () => void;
}

import { persist } from "zustand/middleware";

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      permissions: [],
      setSession: (accessToken, user, permissions) => set({ accessToken, user, permissions }),
      setAccessToken: (token) => set({ accessToken: token }),
      clear: () => set({ accessToken: null, user: null, permissions: [] }),
    }),
    {
      name: "auth-storage",
    }
  )
);
