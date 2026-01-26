import { create } from 'zustand'

interface UIState {
  theme: string
  darkMode: boolean
  viewMode: 'normal' | 'focus' | 'typewriter'
  showSidebar: boolean
  showTableOfContents: boolean
  showPreview: boolean
  setTheme: (theme: string) => void
  setDarkMode: (dark: boolean) => void
  setViewMode: (mode: 'normal' | 'focus' | 'typewriter') => void
  toggleSidebar: () => void
  toggleTableOfContents: () => void
  togglePreview: () => void
}

export const useUIStore = create<UIState>((set) => ({
  theme: 'default',
  darkMode: false,
  viewMode: 'normal',
  showSidebar: false,
  showTableOfContents: false,
  showPreview: true,

  setTheme: (theme: string) => set({ theme }),
  setDarkMode: (dark: boolean) => set({ darkMode: dark }),
  setViewMode: (mode) => set({ viewMode: mode }),
  toggleSidebar: () => set((state) => ({ showSidebar: !state.showSidebar })),
  toggleTableOfContents: () => set((state) => ({ showTableOfContents: !state.showTableOfContents })),
  togglePreview: () => set((state) => ({ showPreview: !state.showPreview })),
}))
