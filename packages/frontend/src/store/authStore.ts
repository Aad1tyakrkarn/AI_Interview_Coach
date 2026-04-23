import { create } from 'zustand';
import { authApi } from '../api/auth.api';
import { userApi } from '../api/user.api';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatarUrl?: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string, twoFactorCode?: string) => Promise<void>;
  register: (data: { email: string; password: string; firstName: string; lastName: string }) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  setTokens: (accessToken: string, refreshToken: string) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken'),
  isAuthenticated: !!localStorage.getItem('accessToken'),
  isLoading: false,
  error: null,

  login: async (email, password, twoFactorCode?) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await authApi.login({ email, password, twoFactorCode });
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      set({
        user: data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      const message = error.response?.data?.error?.message || 'Login failed';
      set({ isLoading: false, error: message });
      throw error;
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await authApi.register(data);
      set({ isLoading: false });
    } catch (error: any) {
      const message = error.response?.data?.error?.message || 'Registration failed';
      set({ isLoading: false, error: message });
      throw error;
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch { /* ignore */ }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
  },

  loadUser: async () => {
    if (!get().accessToken) return;
    try {
      const { data } = await userApi.getProfile();
      set({ user: data, isAuthenticated: true });
    } catch {
      get().logout();
    }
  },

  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    set({ accessToken, refreshToken, isAuthenticated: true });
  },

  clearError: () => set({ error: null }),
}));
