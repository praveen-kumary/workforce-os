import { create } from 'zustand';

export type ThemeMode = 'dark' | 'light' | 'system';
export type Density = 'comfortable' | 'compact' | 'dense';

interface ThemeState {
  theme: ThemeMode;
  resolvedTheme: 'dark' | 'light';
  density: Density;
  sidebarCollapsed: boolean;
  sidebarMobileOpen: boolean;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setDensity: (d: Density) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  setSidebarMobileOpen: (v: boolean) => void;
}

function getSystemTheme(): 'dark' | 'light' {
  if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

function applyThemeToDOM(theme: ThemeMode) {
  const resolved = theme === 'system' ? getSystemTheme() : theme;
  document.documentElement.setAttribute('data-theme', resolved);
  if (resolved === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  return resolved;
}

const savedTheme = (typeof window !== 'undefined' ? (localStorage.getItem('uos-theme') as ThemeMode) : null) || 'dark';
const initialResolved = typeof window !== 'undefined' ? applyThemeToDOM(savedTheme) : 'dark';

export const useThemeStore = create<ThemeState>((set, get) => {
  // Listen for OS system theme changes
  if (typeof window !== 'undefined' && window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (get().theme === 'system') {
        const resolved = e.matches ? 'dark' : 'light';
        applyThemeToDOM('system');
        set({ resolvedTheme: resolved });
      }
    });
  }

  return {
    theme: savedTheme,
    resolvedTheme: initialResolved,
    density: (typeof window !== 'undefined' ? (localStorage.getItem('uos-density') as Density) : null) || 'comfortable',
    sidebarCollapsed: typeof window !== 'undefined' ? localStorage.getItem('uos-sidebar-collapsed') === 'true' : false,
    sidebarMobileOpen: false,

    setTheme: (theme: ThemeMode) => {
      localStorage.setItem('uos-theme', theme);
      const resolved = applyThemeToDOM(theme);
      set({ theme, resolvedTheme: resolved });
    },

    toggleTheme: () => {
      const current = get().theme;
      const nextTheme: ThemeMode = current === 'dark' ? 'light' : 'dark';
      get().setTheme(nextTheme);
    },

    setDensity: (d) => {
      localStorage.setItem('uos-density', d);
      document.documentElement.setAttribute('data-density', d === 'comfortable' ? '' : d);
      set({ density: d });
    },

    toggleSidebar: () =>
      set((s) => {
        const next = !s.sidebarCollapsed;
        localStorage.setItem('uos-sidebar-collapsed', String(next));
        return { sidebarCollapsed: next };
      }),

    setSidebarCollapsed: (v) => {
      localStorage.setItem('uos-sidebar-collapsed', String(v));
      set({ sidebarCollapsed: v });
    },

    setSidebarMobileOpen: (v) => set({ sidebarMobileOpen: v }),
  };
});
