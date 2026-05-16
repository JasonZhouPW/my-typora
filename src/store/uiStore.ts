import { create } from 'zustand'

interface UIState {
  theme: 'default' | 'white'
  darkMode: boolean
  viewMode: 'normal' | 'focus' | 'typewriter'
  activeSidebarSection: 'files' | 'tags' | 'search' | 'recent'
  activeInsightTab: 'preview' | 'outline' | 'backlinks' | 'export'
  showSidebar: boolean
  showTableOfContents: boolean
  showInsightPanel: boolean
  showPreview: boolean
  showEditor: boolean
  isCommandPaletteOpen: boolean
  isGlobalSearchOpen: boolean
  sliderPosition: number
  isFocusMode: boolean
  isFullscreen: boolean
  setTheme: (theme: 'default' | 'white') => void
  setDarkMode: (dark: boolean) => void
  setViewMode: (mode: 'normal' | 'focus' | 'typewriter') => void
  setActiveSidebarSection: (section: 'files' | 'tags' | 'search' | 'recent') => void
  setActiveInsightTab: (tab: 'preview' | 'outline' | 'backlinks' | 'export') => void
  toggleSidebar: () => void
  toggleTableOfContents: () => void
  toggleInsightPanel: () => void
  togglePreview: () => void
  toggleEditor: () => void
  setCommandPaletteOpen: (open: boolean) => void
  toggleCommandPalette: () => void
  setGlobalSearchOpen: (open: boolean) => void
  toggleGlobalSearch: () => void
  setSliderPosition: (position: number) => void
  toggleTheme: () => void
  toggleFocusMode: () => void
  setFullscreen: (fullscreen: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  theme: 'default',
  darkMode: false,
  viewMode: 'normal',
  activeSidebarSection: 'files',
  activeInsightTab: 'preview',
  showSidebar: true,
  showTableOfContents: false,
  showInsightPanel: true,
  showPreview: true,
  showEditor: true,
  isCommandPaletteOpen: false,
  isGlobalSearchOpen: false,
  sliderPosition: 50,
  isFocusMode: false,
  isFullscreen: false,

  setTheme: (theme: 'default' | 'white') => set({ theme }),
  setDarkMode: (dark: boolean) => set({ darkMode: dark }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setActiveSidebarSection: (section) => set({ activeSidebarSection: section, showSidebar: true }),
  setActiveInsightTab: (tab) => set({ activeInsightTab: tab, showInsightPanel: true }),
  toggleSidebar: () => set((state) => ({ showSidebar: !state.showSidebar })),
  toggleTableOfContents: () => set((state) => ({ showTableOfContents: !state.showTableOfContents })),
  toggleInsightPanel: () => set((state) => ({ showInsightPanel: !state.showInsightPanel })),
  togglePreview: () => set((state) => ({ showPreview: !state.showPreview })),
  toggleEditor: () => set((state) => ({ showEditor: !state.showEditor })),
  setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),
  toggleCommandPalette: () => set((state) => ({ isCommandPaletteOpen: !state.isCommandPaletteOpen })),
  setGlobalSearchOpen: (open) => set({ isGlobalSearchOpen: open }),
  toggleGlobalSearch: () => set((state) => ({ isGlobalSearchOpen: !state.isGlobalSearchOpen })),
  setSliderPosition: (position: number) => set({ sliderPosition: position }),
  toggleTheme: () => set((state) => ({ theme: state.theme === 'default' ? 'white' : 'default' })),
  toggleFocusMode: () => set((state) => ({ isFocusMode: !state.isFocusMode })),
  setFullscreen: (fullscreen: boolean) => set({ isFullscreen: fullscreen }),
}))
