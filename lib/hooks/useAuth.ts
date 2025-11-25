import { useAuthStore } from "@/lib/stores";
import { authApi } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { LoginRequest, BranchSwitchRequest } from "@/types";

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

          if (response.br) {
            // Find the current branch from memberships if available
            const meData = await authApi.getMe();
            setMeData(meData);
          }

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

        // Fetch updated user data
        const meData = await authApi.getMe();
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
   * Load user data
   */
  const loadUser = useCallback(async () => {
    try {
      setLoading(true);
      const data = await authApi.getMe();
      setMeData(data);
    } catch (error) {
      console.error("Load user error:", error);
      storeLogout();
    } finally {
      setLoading(false);
    }
  }, [setMeData, setLoading, storeLogout]);

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
   * Check if user is super admin
   */
  const isSuperAdmin = useCallback(() => {
    return hasRole("super_admin");
  }, [hasRole]);

  /**
   * Check if user is branch admin
   */
  const isBranchAdmin = useCallback(() => {
    return hasRole(["super_admin", "branch_admin"]);
  }, [hasRole]);

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

    // Helpers
    hasRole,
    isSuperAdmin,
    isBranchAdmin,
  };
};
