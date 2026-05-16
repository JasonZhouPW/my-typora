import { create } from 'zustand'

interface UIState {
  theme: 'default' | 'dark'
  darkMode: boolean
  viewMode: 'normal' | 'focus' | 'typewriter'
  activeSidebarSection: 'files' | 'tags' | 'search' | 'recent'
  activeInsightTab: 'preview' | 'export'
  showSidebar: boolean
  showTableOfContents: boolean
  showInsightPanel: boolean
  showPreview: boolean
  showEditor: boolean
  isPreviewMaximized: boolean
  isCommandPaletteOpen: boolean
  isGlobalSearchOpen: boolean
  sliderPosition: number
  insightPanelWidth: number
  isFocusMode: boolean
  isFullscreen: boolean
  setTheme: (theme: 'default' | 'dark') => void
  setDarkMode: (dark: boolean) => void
  setViewMode: (mode: 'normal' | 'focus' | 'typewriter') => void
  setActiveSidebarSection: (section: 'files' | 'tags' | 'search' | 'recent') => void
  setActiveInsightTab: (tab: 'preview' | 'export') => void
  toggleSidebar: () => void
  toggleTableOfContents: () => void
  toggleInsightPanel: () => void
  togglePreview: () => void
  toggleEditor: () => void
  togglePreviewMaximized: () => void
  setCommandPaletteOpen: (open: boolean) => void
  toggleCommandPalette: () => void
  setGlobalSearchOpen: (open: boolean) => void
  toggleGlobalSearch: () => void
  setSliderPosition: (position: number) => void
  setInsightPanelWidth: (width: number) => void
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
  isPreviewMaximized: false,
  isCommandPaletteOpen: false,
  isGlobalSearchOpen: false,
  sliderPosition: 50,
  insightPanelWidth: 360,
  isFocusMode: false,
  isFullscreen: false,

  setTheme: (theme: 'default' | 'dark') => set({ theme }),
  setDarkMode: (dark: boolean) => set({ darkMode: dark }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setActiveSidebarSection: (section) => set({ activeSidebarSection: section, showSidebar: true }),
  setActiveInsightTab: (tab) => set({ activeInsightTab: tab, showInsightPanel: true }),
  toggleSidebar: () => set((state) => ({ showSidebar: !state.showSidebar })),
  toggleTableOfContents: () => set((state) => ({ showTableOfContents: !state.showTableOfContents })),
  toggleInsightPanel: () => set((state) => ({ showInsightPanel: !state.showInsightPanel })),
  togglePreview: () => set((state) => ({
    showPreview: !state.showPreview,
    showInsightPanel: true,
    activeInsightTab: state.showPreview ? 'export' : 'preview',
  })),
  toggleEditor: () => set((state) => ({ showEditor: !state.showEditor })),
  togglePreviewMaximized: () => set((state) => ({ isPreviewMaximized: !state.isPreviewMaximized, activeInsightTab: 'preview' })),
  setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),
  toggleCommandPalette: () => set((state) => ({ isCommandPaletteOpen: !state.isCommandPaletteOpen })),
  setGlobalSearchOpen: (open) => set({ isGlobalSearchOpen: open }),
  toggleGlobalSearch: () => set((state) => ({ isGlobalSearchOpen: !state.isGlobalSearchOpen })),
  setSliderPosition: (position: number) => set({ sliderPosition: position }),
  setInsightPanelWidth: (width: number) => set({ insightPanelWidth: Math.min(760, Math.max(280, width)) }),
  toggleTheme: () => set((state) => ({ theme: state.theme === 'default' ? 'dark' : 'default' })),
  toggleFocusMode: () => set((state) => ({ isFocusMode: !state.isFocusMode })),
  setFullscreen: (fullscreen: boolean) => set({ isFullscreen: fullscreen }),
}))
