import { create } from 'zustand'

interface UIState {
  theme: string
  darkMode: boolean
  viewMode: 'normal' | 'focus' | 'typewriter'
  showSidebar: boolean
  sidebarWidth: number
  showTableOfContents: boolean
  showPreview: boolean
  showEditor: boolean
  sliderPosition: number
  setTheme: (theme: string) => void
  setDarkMode: (dark: boolean) => void
  setViewMode: (mode: 'normal' | 'focus' | 'typewriter') => void
  toggleSidebar: () => void
  setSidebarWidth: (width: number) => void
  toggleTableOfContents: () => void
  togglePreview: () => void
  toggleEditor: () => void
  setSliderPosition: (position: number) => void
}

export const useUIStore = create<UIState>((set) => ({
  theme: 'default',
  darkMode: false,
  viewMode: 'normal',
  showSidebar: false,
  sidebarWidth: 250,
  showTableOfContents: false,
  showPreview: true,
  showEditor: true,
  sliderPosition: 50,

  setTheme: (theme: string) => set({ theme }),
  setDarkMode: (dark: boolean) => set({ darkMode: dark }),
  setViewMode: (mode) => set({ viewMode: mode }),
  toggleSidebar: () => set((state) => ({ showSidebar: !state.showSidebar })),
  setSidebarWidth: (width: number) => set({ sidebarWidth: width }),
  toggleTableOfContents: () => set((state) => ({ showTableOfContents: !state.showTableOfContents })),
  togglePreview: () => set((state) => ({ showPreview: !state.showPreview })),
  toggleEditor: () => set((state) => ({ showEditor: !state.showEditor })),
  setSliderPosition: (position: number) => set({ sliderPosition: position }),
}))
