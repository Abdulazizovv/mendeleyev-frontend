import { useAuthStore } from "@/lib/stores";
import { authApi } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { LoginRequest, BranchSwitchRequest } from "@/types";
import { 
  getCache, 
  setCache, 
  clearCache,
  clearAllCaches, 
  isCacheValid,
  CACHE_KEYS, 
  CACHE_EXPIRY,
  getCacheInfo
} from "@/lib/utils/cache";
import type { MeResponse } from "@/types";

export const useAuth = () => {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const {
    user,
    currentBranch,
    memberships,
    isAuthenticated,
    isLoading,
    setTokens,
    setUser,
    setCurrentBranch,
    setMemberships,
    setMeData,
    logout: storeLogout,
    setLoading,
  } = useAuthStore();

  // Handle hydration from localStorage
  useEffect(() => {
    const unsubscribe = useAuthStore.persist.onFinishHydration(() => {
      setHydrated(true);
      setLoading(false);
    });
    
    // If already hydrated, set immediately
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
      setLoading(false);
    }

    return () => {
      unsubscribe();
    };
  }, [setLoading]);

  /**
   * Login function
   */
  const login = useCallback(
    async (data: LoginRequest) => {
      try {
        const response = await authApi.login(data);

        if ("access" in response && response.access) {
          // Success - got tokens
          setTokens(response.access, response.refresh);
          setUser(response.user);

          // Always fetch full user data after login to populate currentBranch and memberships
          const meData = await authApi.getMe();
          setCache(CACHE_KEYS.USER_DATA, meData, CACHE_EXPIRY.USER_PROFILE);
          setMeData(meData);

          return { success: true, data: response };
        } else {
          // Multi-branch or no-branch state
          return { success: false, data: response };
        }
      } catch (error) {
        console.error("Login error:", error);
        throw error;
      }
    },
    [setTokens, setUser, setMeData]
  );

  /**
   * Logout function
   */
  const logout = useCallback(() => {
    // Clear all caches
    clearAllCaches();
    storeLogout();
    router.push("/login");
  }, [storeLogout, router]);

  /**
   * Switch branch
   */
  const switchBranch = useCallback(
    async (branchId: string) => {
      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        if (!refreshToken) throw new Error("No refresh token");

        const data: BranchSwitchRequest = {
          refresh: refreshToken,
          branch_id: branchId,
        };

        const response = await authApi.switchBranch(data);
        setTokens(response.access, response.refresh);

        // Clear cache and fetch updated user data
        clearCache(CACHE_KEYS.USER_DATA);
        const meData = await authApi.getMe();
        
        // Save to cache
        setCache(CACHE_KEYS.USER_DATA, meData, CACHE_EXPIRY.USER_PROFILE);
        
        setMeData(meData);

        return { success: true };
      } catch (error) {
        console.error("Switch branch error:", error);
        throw error;
      }
    },
    [setTokens, setMeData]
  );

  /**
   * Load user data with smart caching
   */
  const loadUser = useCallback(async (forceRefresh = false) => {
    // Check cache first (no spinner for cache hits)
    if (!forceRefresh && isCacheValid(CACHE_KEYS.USER_DATA)) {
      const cachedData = getCache<MeResponse>(CACHE_KEYS.USER_DATA);
      if (cachedData) {
        setMeData(cachedData);
        return;
      }
    }

    // Cache miss or force refresh — fetch from API
    try {
      setLoading(true);
      const data = await authApi.getMe();
      setCache(CACHE_KEYS.USER_DATA, data, CACHE_EXPIRY.USER_PROFILE);
      setMeData(data);
    } catch (error) {
      console.error("Load user error:", error);
      clearCache(CACHE_KEYS.USER_DATA);
      storeLogout();
    } finally {
      setLoading(false);
    }
  }, [setMeData, setLoading, storeLogout]);

  /**
   * Check if user has a specific module-level permission.
   * Super admins always pass. Legacy users (no permissions set) always pass.
   */
  const hasPermission = useCallback(
    (module: string, action: string): boolean => {
      if (memberships?.some((m) => m.role === "super_admin")) return true;
      if (!currentBranch) return false;
      const perms = currentBranch.permissions;
      if (!perms || Object.keys(perms).length === 0) return true;
      return perms[module]?.[action] ?? false;
    },
    [currentBranch, memberships]
  );

  /**
   * Check if user has specific role
   */
  const hasRole = useCallback(
    (role: string | string[]) => {
      if (!currentBranch) return false;
      const roles = Array.isArray(role) ? role : [role];
      return roles.includes(currentBranch.role);
    },
    [currentBranch]
  );

  /**
   * Check if user is super admin.
   * Checks ALL memberships — not just currentBranch — so a user with super_admin
   * in any branch is treated as superadmin regardless of which branch is active.
   */
  const isSuperAdmin = useCallback(() => {
    return memberships?.some((m) => m.role === "super_admin") ?? false;
  }, [memberships]);

  /**
   * Check if user is branch admin
   */
  const isBranchAdmin = useCallback(() => {
    return hasRole(["super_admin", "branch_admin"]);
  }, [hasRole]);

  /**
   * Force refresh user data (clear cache and fetch from API)
   */
  const refreshUserData = useCallback(async () => {
    clearCache(CACHE_KEYS.USER_DATA);
    await loadUser(true);
  }, [loadUser]);

  /**
   * Get cache information for debugging
   */
  const getCacheStatus = useCallback(() => {
    return getCacheInfo(CACHE_KEYS.USER_DATA);
  }, []);

  return {
    // State
    user,
    currentBranch,
    memberships,
    isAuthenticated,
    isLoading,

    // Actions
    login,
    logout,
    switchBranch,
    loadUser,
    refreshUserData,

    // Helpers
    hasRole,
    hasPermission,
    isSuperAdmin,
    isBranchAdmin,
    getCacheStatus,
  };
};
