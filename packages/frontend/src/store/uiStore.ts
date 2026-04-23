import { create } from 'zustand';

type ThemeMode = 'light' | 'dark';

interface UiState {
  theme: ThemeMode;
  sidebarOpen: boolean;
  activeModal: string | null;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  openModal: (modalId: string) => void;
  closeModal: () => void;
}

function getStoredTheme(): ThemeMode {
  try {
    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
  } catch {
    // localStorage unavailable
  }
  return 'light';
}

function applyThemeToDOM(theme: ThemeMode) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

// Apply on initial load
const initialTheme = getStoredTheme();
applyThemeToDOM(initialTheme);

export const useUiStore = create<UiState>((set) => ({
  theme: initialTheme,
  sidebarOpen: true,
  activeModal: null,

  toggleSidebar: () =>
    set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setSidebarOpen: (open) =>
    set({ sidebarOpen: open }),

  setTheme: (theme) => {
    try {
      localStorage.setItem('theme', theme);
    } catch {
      // ignore
    }
    applyThemeToDOM(theme);
    set({ theme });
  },

  toggleTheme: () => {
    set((state) => {
      const next: ThemeMode = state.theme === 'light' ? 'dark' : 'light';
      try {
        localStorage.setItem('theme', next);
      } catch {
        // ignore
      }
      applyThemeToDOM(next);
      return { theme: next };
    });
  },

  openModal: (modalId) =>
    set({ activeModal: modalId }),

  closeModal: () =>
    set({ activeModal: null }),
}));
