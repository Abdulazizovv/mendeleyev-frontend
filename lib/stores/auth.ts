import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, CurrentBranch, BranchMembership, MeResponse } from "@/types";
import { STORAGE_KEYS } from "@/lib/config";

interface AuthState {
  // State
  user: User | null;
  currentBranch: CurrentBranch | null;
  memberships: BranchMembership[];
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setTokens: (access: string, refresh: string) => void;
  setUser: (user: User) => void;
  setCurrentBranch: (branch: CurrentBranch | null) => void;
  setMemberships: (memberships: BranchMembership[]) => void;
  setMeData: (data: MeResponse) => void;
  logout: () => void;
  setLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      currentBranch: null,
      memberships: [],
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true, // Start with true until hydration completes

      // Actions
      setTokens: (access, refresh) => {
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access);
          localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh);
        }
        set({
          accessToken: access,
          refreshToken: refresh,
          isAuthenticated: true,
        });
      },

      setUser: (user) => {
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
        }
        set({ user });
      },

      setCurrentBranch: (branch) => {
        if (typeof window !== "undefined") {
          if (branch) {
            localStorage.setItem(STORAGE_KEYS.CURRENT_BRANCH, JSON.stringify(branch));
          } else {
            localStorage.removeItem(STORAGE_KEYS.CURRENT_BRANCH);
          }
        }
        set({ currentBranch: branch });
      },

      setMemberships: (memberships) => {
        set({ memberships });
      },

      setMeData: (data) => {
        set({
          user: data.user,
          currentBranch: data.current_branch,
          memberships: data.memberships,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      logout: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.USER);
          localStorage.removeItem(STORAGE_KEYS.CURRENT_BRANCH);
        }
        set({
          user: null,
          currentBranch: null,
          memberships: [],
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      setLoading: (isLoading) => {
        set({ isLoading });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        currentBranch: state.currentBranch,
        memberships: state.memberships,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
