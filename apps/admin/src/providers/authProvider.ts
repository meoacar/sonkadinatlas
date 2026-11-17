import { AuthProvider } from '@refinedev/core';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
const ADMIN_CHECK_CACHE_KEY = 'adminVerifiedAt';
const ADMIN_CHECK_TTL_MS = 2 * 60 * 1000;

function clearSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  sessionStorage.removeItem(ADMIN_CHECK_CACHE_KEY);
}

function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (!payload?.exp) return false;
    return Date.now() >= payload.exp * 1000 - 15_000;
  } catch {
    return true;
  }
}

export async function tryRefreshAccessToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return null;

  try {
    const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
    if (data?.accessToken) {
      localStorage.setItem('accessToken', data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      return data.accessToken;
    }
    return null;
  } catch {
    return null;
  }
}

async function verifyAdminAccess(token: string): Promise<boolean> {
  try {
    await axios.get(`${API_URL}/gamification/admin/overview`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 6000,
    });
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(ADMIN_CHECK_CACHE_KEY, String(Date.now()));
    }
    return true;
  } catch (err: any) {
    if (err?.response?.status === 401 || err?.response?.status === 403) {
      return false;
    }
    // Temporary network blip: allow if token structure is valid and recently verified
    return false;
  }
}

export const authProvider: AuthProvider = {
  login: async ({ email, password }) => {
    try {
      const identifier = String(email || '').trim();
      if (!identifier || !password) {
        return {
          success: false,
          error: {
            name: 'Giriş Hatası',
            message: 'E-posta ve şifre alanları zorunludur.',
          },
        };
      }

      const { data } = await axios.post(`${API_URL}/auth/login`, {
        identifier,
        password,
      });

      if (!data?.accessToken) {
        return {
          success: false,
          error: {
            name: 'Giriş Hatası',
            message: 'Geçersiz oturum yanıtı alındı.',
          },
        };
      }

      // Enforce admin privilege on the server before granting panel access
      const isAdmin = await verifyAdminAccess(data.accessToken);
      if (!isAdmin) {
        clearSession();
        return {
          success: false,
          error: {
            name: 'Yetkisiz Erişim',
            message: 'Bu hesap yönetim paneli erişim yetkisine sahip değil.',
          },
        };
      }

      localStorage.setItem('accessToken', data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }
      localStorage.setItem('user', JSON.stringify(data.user));

      return {
        success: true,
        redirectTo: '/',
      };
    } catch (error: any) {
      clearSession();
      const rawMsg = error?.response?.data?.message;
      const message = Array.isArray(rawMsg)
        ? rawMsg.join(', ')
        : rawMsg || 'E-posta adresi veya şifre hatalı.';
      return {
        success: false,
        error: {
          name: 'Giriş Başarısız',
          message,
        },
      };
    }
  },

  logout: async () => {
    clearSession();
    return {
      success: true,
      redirectTo: '/login',
    };
  },

  check: async () => {
    if (typeof window === 'undefined') {
      return { authenticated: false, redirectTo: '/login' };
    }

    let token = localStorage.getItem('accessToken');
    if (!token) {
      return {
        authenticated: false,
        redirectTo: '/login',
        logout: true,
      };
    }

    if (isTokenExpired(token)) {
      const refreshed = await tryRefreshAccessToken();
      if (!refreshed) {
        clearSession();
        return {
          authenticated: false,
          redirectTo: '/login',
          logout: true,
        };
      }
      token = refreshed;
    }

    const lastVerified = Number(sessionStorage.getItem(ADMIN_CHECK_CACHE_KEY) || 0);
    if (!lastVerified || Date.now() - lastVerified > ADMIN_CHECK_TTL_MS) {
      const isAdmin = await verifyAdminAccess(token);
      if (!isAdmin) {
        clearSession();
        return {
          authenticated: false,
          redirectTo: '/login',
          logout: true,
        };
      }
    }

    return {
      authenticated: true,
    };
  },

  getPermissions: async () => {
    if (typeof window === 'undefined') return null;
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        return userData.isAdmin ? 'admin' : 'user';
      } catch {
        return null;
      }
    }
    return null;
  },

  getIdentity: async () => {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      const u = JSON.parse(userStr);
      const name =
        u?.profile?.firstName && u?.profile?.lastName
          ? `${u.profile.firstName} ${u.profile.lastName}`
          : u?.profile?.displayName || u?.username || u?.email || 'Yönetici';
      return {
        id: u.id,
        name,
        email: u.email,
        avatar: u?.profile?.profilePictureUrl || undefined,
      };
    } catch {
      return null;
    }
  },

  onError: async (error) => {
    if (error?.status === 401 || error?.status === 403) {
      clearSession();
      return {
        logout: true,
        redirectTo: '/login',
        error,
      };
    }

    return { error };
  },
};
