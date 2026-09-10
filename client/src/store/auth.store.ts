import { create } from 'zustand';

export interface User {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  roleTitle?: string;
  department?: string;
  avatarUrl?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (token: string, refreshToken: string, user: User) => void;
  logout: () => void;
  hydrate: () => void;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,

  login: (token: string, refreshToken: string, user: User) => {
    localStorage.setItem('uos-auth-token', token);
    localStorage.setItem('uos-refresh-token', refreshToken);
    localStorage.setItem('uos-auth-user', JSON.stringify(user));
    set({ token, refreshToken, user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('uos-auth-token');
    localStorage.removeItem('uos-refresh-token');
    localStorage.removeItem('uos-auth-user');
    set({ user: null, token: null, refreshToken: null, isAuthenticated: false });
  },

  hydrate: () => {
    try {
      const token = localStorage.getItem('uos-auth-token');
      const refreshToken = localStorage.getItem('uos-refresh-token');
      const userRaw = localStorage.getItem('uos-auth-user');
      if (token && userRaw) {
        const user = JSON.parse(userRaw) as User;
        set({ token, refreshToken, user, isAuthenticated: true });
      }
    } catch {
      localStorage.removeItem('uos-auth-token');
      localStorage.removeItem('uos-refresh-token');
      localStorage.removeItem('uos-auth-user');
    }
  },

  updateUser: (updates: Partial<User>) => {
    const current = get().user;
    if (current) {
      const updated = { ...current, ...updates };
      localStorage.setItem('uos-auth-user', JSON.stringify(updated));
      set({ user: updated });
    }
  },
}));
