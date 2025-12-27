import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import bcrypt from "bcryptjs";

/**
 * Finance Guard Store
 * 
 * Moliya bo'limini PIN kod bilan himoyalash.
 * PIN LocalStorage da bcrypt hash sifatida saqlanadi.
 * Session SessionStorage da saqlanadi (tab yopilsa o'chadi).
 * 
 * Features:
 * - 6 raqamli PIN
 * - bcrypt hash (10 rounds)
 * - 30 daqiqalik session
 * - Auto-lock
 * - 3 ta noto'g'ri urinish = 5 daqiqa block
 */

interface FinanceGuardState {
  // Persistent (LocalStorage)
  pinHash: string | null;
  
  // Session (Memory)
  isUnlocked: boolean;
  unlockedUntil: number | null;
  failedAttempts: number;
  blockedUntil: number | null;
  
  // Actions
  setupPin: (pin: string) => void;
  verifyPin: (pin: string) => boolean;
  unlock: (duration?: number) => void;
  lock: () => void;
  checkSession: () => boolean;
  resetPin: () => void;
  isBlocked: () => boolean;
  getRemainingBlockTime: () => number;
}

const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes
const BLOCK_DURATION = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 3;

export const useFinanceGuard = create<FinanceGuardState>()(
  persist(
    (set, get) => ({
      // Initial state
      pinHash: null,
      isUnlocked: false,
      unlockedUntil: null,
      failedAttempts: 0,
      blockedUntil: null,

      /**
       * PIN o'rnatish (birinchi marta)
       */
      setupPin: (pin: string) => {
        // Validate PIN format
        if (!/^\d{6}$/.test(pin)) {
          throw new Error("PIN 6 raqamdan iborat bo'lishi kerak");
        }

        // Hash PIN with bcrypt
        const hash = bcrypt.hashSync(pin, 10);
        
        set({ 
          pinHash: hash,
          failedAttempts: 0,
          blockedUntil: null,
        });
      },

      /**
       * PIN tekshirish
       */
      verifyPin: (pin: string) => {
        const state = get();
        
        // Check if blocked
        if (state.isBlocked()) {
          return false;
        }

        const { pinHash } = state;
        
        if (!pinHash) {
          return false;
        }

        // Verify PIN
        const isValid = bcrypt.compareSync(pin, pinHash);

        if (isValid) {
          // Success - reset failed attempts and unlock
          set({ 
            failedAttempts: 0,
            blockedUntil: null,
          });
          get().unlock();
          return true;
        } else {
          // Failed - increment attempts
          const newAttempts = state.failedAttempts + 1;
          
          if (newAttempts >= MAX_ATTEMPTS) {
            // Block user for 5 minutes
            set({
              failedAttempts: newAttempts,
              blockedUntil: Date.now() + BLOCK_DURATION,
            });
          } else {
            set({ failedAttempts: newAttempts });
          }
          
          return false;
        }
      },

      /**
       * Qulfni ochish (session boshlash)
       */
      unlock: (duration = SESSION_DURATION) => {
        const unlockedUntil = Date.now() + duration;
        
        set({ 
          isUnlocked: true, 
          unlockedUntil,
          failedAttempts: 0,
          blockedUntil: null,
        });

        // Auto-lock after session expires
        setTimeout(() => {
          const currentState = get();
          if (currentState.unlockedUntil && Date.now() >= currentState.unlockedUntil) {
            get().lock();
          }
        }, duration);
      },

      /**
       * Qulfni yopish
       */
      lock: () => {
        set({ 
          isUnlocked: false, 
          unlockedUntil: null,
        });
      },

      /**
       * Session tekshirish
       */
      checkSession: () => {
        const { isUnlocked, unlockedUntil } = get();
        
        if (!isUnlocked || !unlockedUntil) {
          return false;
        }
        
        // Check if session expired
        if (Date.now() > unlockedUntil) {
          get().lock();
          return false;
        }
        
        return true;
      },

      /**
       * PIN ni reset qilish (faqat super admin)
       */
      resetPin: () => {
        set({ 
          pinHash: null,
          isUnlocked: false,
          unlockedUntil: null,
          failedAttempts: 0,
          blockedUntil: null,
        });
      },

      /**
       * Blok holatini tekshirish
       */
      isBlocked: () => {
        const { blockedUntil } = get();
        
        if (!blockedUntil) {
          return false;
        }
        
        if (Date.now() > blockedUntil) {
          // Block vaqti o'tgan - reset
          set({ 
            blockedUntil: null,
            failedAttempts: 0,
          });
          return false;
        }
        
        return true;
      },

      /**
       * Qolgan blok vaqtini olish (soniyalarda)
       */
      getRemainingBlockTime: () => {
        const { blockedUntil } = get();
        
        if (!blockedUntil) {
          return 0;
        }
        
        const remaining = Math.ceil((blockedUntil - Date.now()) / 1000);
        return Math.max(0, remaining);
      },
    }),
    {
      name: "finance-guard-storage",
      storage: createJSONStorage(() => localStorage),
      // Faqat pinHash localStorage da saqlanadi
      partialize: (state) => ({ 
        pinHash: state.pinHash,
      }),
    }
  )
);

/**
 * Helper: PIN o'rnatilganmi tekshirish
 */
export const isPinSetup = () => {
  const { pinHash } = useFinanceGuard.getState();
  return !!pinHash;
};

/**
 * Helper: Session active mi?
 */
export const isSessionActive = () => {
  return useFinanceGuard.getState().checkSession();
};

/**
 * Helper: Qolgan session vaqti (soniyalarda)
 */
export const getRemainingSessionTime = () => {
  const { unlockedUntil } = useFinanceGuard.getState();
  
  if (!unlockedUntil) {
    return 0;
  }
  
  const remaining = Math.ceil((unlockedUntil - Date.now()) / 1000);
  return Math.max(0, remaining);
};
