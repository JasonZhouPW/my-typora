import { create } from 'zustand'

interface UIState {
  theme: 'default' | 'white'
  darkMode: boolean
  viewMode: 'normal' | 'focus' | 'typewriter'
  showSidebar: boolean
  showTableOfContents: boolean
  showPreview: boolean
  showEditor: boolean
  sliderPosition: number
  isFocusMode: boolean
  isFullscreen: boolean
  setTheme: (theme: 'default' | 'white') => void
  setDarkMode: (dark: boolean) => void
  setViewMode: (mode: 'normal' | 'focus' | 'typewriter') => void
  toggleSidebar: () => void
  toggleTableOfContents: () => void
  togglePreview: () => void
  toggleEditor: () => void
  setSliderPosition: (position: number) => void
  toggleTheme: () => void
  toggleFocusMode: () => void
  setFullscreen: (fullscreen: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  theme: 'default',
  darkMode: false,
  viewMode: 'normal',
  showSidebar: false,
  showTableOfContents: false,
  showPreview: true,
  showEditor: true,
  sliderPosition: 50,
  isFocusMode: false,
  isFullscreen: false,

  setTheme: (theme: 'default' | 'white') => set({ theme }),
  setDarkMode: (dark: boolean) => set({ darkMode: dark }),
  setViewMode: (mode) => set({ viewMode: mode }),
  toggleSidebar: () => set((state) => ({ showSidebar: !state.showSidebar })),
  toggleTableOfContents: () => set((state) => ({ showTableOfContents: !state.showTableOfContents })),
  togglePreview: () => set((state) => ({ showPreview: !state.showPreview })),
  toggleEditor: () => set((state) => ({ showEditor: !state.showEditor })),
  setSliderPosition: (position: number) => set({ sliderPosition: position }),
  toggleTheme: () => set((state) => ({ theme: state.theme === 'default' ? 'white' : 'default' })),
  toggleFocusMode: () => set((state) => ({ isFocusMode: !state.isFocusMode })),
  setFullscreen: (fullscreen: boolean) => set({ isFullscreen: fullscreen }),
}))
