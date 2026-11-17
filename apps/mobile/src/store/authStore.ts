import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { AuthTokens, AuthUser } from '@/types/auth';
import { queryClient } from '@/lib/queryClient';
import { subscriptionSyncService } from '@/services/subscriptionSync';
import { authEvents } from '@/services/authEvents';
import { getApiBaseUrl } from '@/utils/apiBaseUrl';
// Monitoring imports (will be enabled after package installation)
// import { setUser as setSentryUser, clearUser as clearSentryUser } from '@/lib/sentry';
// import { identifyUser, resetUser, trackEvent, AnalyticsEvents } from '@/lib/posthog';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  forcedLogoutReason: string | null;
  forcedLogoutEmail: string | null;
  forcedLogoutName: string | null;
  clearForcedLogoutReason: () => void;
  setAuth: (user: AuthUser, tokens: AuthTokens) => Promise<void>;
  refreshMe: () => Promise<void>;
  clearAuth: () => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,
  forcedLogoutReason: null,
  forcedLogoutEmail: null,
  forcedLogoutName: null,

  clearForcedLogoutReason: () =>
    set({ forcedLogoutReason: null, forcedLogoutEmail: null, forcedLogoutName: null }),

  setAuth: async (user, tokens) => {
    await SecureStore.setItemAsync('accessToken', tokens.accessToken);
    await SecureStore.setItemAsync('refreshToken', tokens.refreshToken);
    await SecureStore.setItemAsync('user', JSON.stringify(user));
    await SecureStore.setItemAsync('pinEnabled', (user as any)?.pinEnabled ? 'true' : 'false');

    set({
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      isAuthenticated: true,
      forcedLogoutReason: null,
    });
  },

  refreshMe: async () => {
    const accessToken = await SecureStore.getItemAsync('accessToken');
    if (!accessToken) return;
    try {
      const response = await fetch(`${getApiBaseUrl()}/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.ok) {
        const freshUserData = await response.json();
        await SecureStore.setItemAsync('user', JSON.stringify(freshUserData));
        await SecureStore.setItemAsync('pinEnabled', freshUserData?.pinEnabled ? 'true' : 'false');
        if (!freshUserData?.pinEnabled) {
          await SecureStore.deleteItemAsync('pinVerified');
        }
        set({ user: freshUserData });
      } else if (response.status === 403 || response.status === 401) {
        const errBody = await response.json().catch(() => ({}));
        if (
          response.status === 403 ||
          errBody?.code === 'ACCOUNT_SUSPENDED' ||
          errBody?.code === 'ACCOUNT_DELETED'
        ) {
          const prevUser = get().user;
          await get().clearAuth();
          set({
            forcedLogoutReason:
              errBody?.message || 'Hesabınız askıya alındı veya oturumunuz sonlandırıldı.',
            forcedLogoutEmail: prevUser?.email || null,
            forcedLogoutName: prevUser?.profile?.displayName || prevUser?.username || null,
          });
        }
      }
    } catch {
      // Ignore transient network errors on foreground refresh
    }
  },

  clearAuth: async () => {
    // Track logout event (will be enabled after package installation)
    // trackEvent(AnalyticsEvents.LOGOUT);

    // Clear monitoring user context
    // clearSentryUser();
    // resetUser();

    // Clear React Query cache to prevent data leakage between users
    queryClient.clear();
    // Reset subscription sync service
    subscriptionSyncService.reset();
    // Clear secure storage
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    await SecureStore.deleteItemAsync('user');
    await SecureStore.deleteItemAsync('pinVerified'); // Clear PIN verification
    await SecureStore.deleteItemAsync('pinEnabled');
    // Clear state
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  },

  logout: async () => {
    // Track logout event (will be enabled after package installation)
    // trackEvent(AnalyticsEvents.LOGOUT);

    // Clear monitoring user context
    // clearSentryUser();
    // resetUser();

    // Clear React Query cache to prevent data leakage between users
    queryClient.clear();
    // Reset subscription sync service
    subscriptionSyncService.reset();
    // Clear secure storage
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    await SecureStore.deleteItemAsync('user');
    await SecureStore.deleteItemAsync('pinVerified'); // Clear PIN verification
    await SecureStore.deleteItemAsync('pinEnabled');
    // Clear state
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  },

  initialize: async () => {
    try {
      const accessToken = await SecureStore.getItemAsync('accessToken');
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      const userStr = await SecureStore.getItemAsync('user');

      if (accessToken && refreshToken && userStr) {
        const user = JSON.parse(userStr);

        // Validate token by trying to fetch user data
        try {
          const response = await fetch(`${getApiBaseUrl()}/me`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          });

          if (response.ok) {
            // Token is valid, use fresh data from /me endpoint
            const freshUserData = await response.json();
            // Update cached user and PIN lock status in SecureStore with fresh data
            await SecureStore.setItemAsync('user', JSON.stringify(freshUserData));
            await SecureStore.setItemAsync('pinEnabled', freshUserData?.pinEnabled ? 'true' : 'false');
            if (!freshUserData?.pinEnabled) {
              await SecureStore.deleteItemAsync('pinVerified');
            }
            set({
              user: freshUserData,
              accessToken,
              refreshToken,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            const errBody = await response.json().catch(() => ({}));
            const suspendedMsg =
              errBody?.code === 'ACCOUNT_SUSPENDED' || errBody?.code === 'ACCOUNT_DELETED'
                ? errBody.message
                : null;
            // Token is invalid or account suspended, clear auth and cache
            queryClient.clear();
            subscriptionSyncService.reset();
            await SecureStore.deleteItemAsync('accessToken');
            await SecureStore.deleteItemAsync('refreshToken');
            await SecureStore.deleteItemAsync('user');
            await SecureStore.deleteItemAsync('pinVerified');
            await SecureStore.deleteItemAsync('pinEnabled');
            set({
              isLoading: false,
              isAuthenticated: false,
              forcedLogoutReason: suspendedMsg,
              forcedLogoutEmail: suspendedMsg ? user?.email || null : null,
              forcedLogoutName: suspendedMsg
                ? user?.profile?.displayName || user?.username || null
                : null,
            });
          }
        } catch (error) {
          // Network error or API not available, clear auth to be safe
          console.warn('Could not validate token, clearing auth:', error);
          queryClient.clear();
          await SecureStore.deleteItemAsync('accessToken');
          await SecureStore.deleteItemAsync('refreshToken');
          await SecureStore.deleteItemAsync('user');
          await SecureStore.deleteItemAsync('pinVerified');
          set({ isLoading: false, isAuthenticated: false });
        }
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      set({ isLoading: false });
    }

    // Subscribe to auth events from api.ts
    authEvents.subscribe(async (payload) => {
      const accessToken = await SecureStore.getItemAsync('accessToken');
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      const userStr = await SecureStore.getItemAsync('user');

      if (accessToken && refreshToken && userStr) {
        const user = JSON.parse(userStr);
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        });
      } else {
        queryClient.clear();
        subscriptionSyncService.reset();
        const reasonMessage =
          payload?.reason === 'ACCOUNT_SUSPENDED' || payload?.reason === 'ACCOUNT_DELETED'
            ? payload.message || 'Hesabınız yönetici tarafından askıya alınmıştır.'
            : null;
        set((prev) => ({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          forcedLogoutReason: reasonMessage,
          forcedLogoutEmail: prev.user?.email || null,
          forcedLogoutName: prev.user?.profile?.displayName || prev.user?.username || null,
        }));
      }
    });
  },
}));
