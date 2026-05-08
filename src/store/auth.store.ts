import { create } from "zustand";

export interface UserProfile {
  sub: string;
  name?: string;
  email?: string;
  preferredUsername?: string;
  realmRoles: string[];
}

interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  isLoading: boolean;
  setUser: (user: UserProfile) => void;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  isLoading: true,
  setUser: (user) =>
    set({
      user,
      isAuthenticated: true,
      isLoading: false,
    }),
  clearUser: () =>
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    }),
  setLoading: (isLoading) => set({ isLoading }),
}));
