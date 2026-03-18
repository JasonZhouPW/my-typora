import React from 'react'
import { useDocumentStore } from '../store'
import '../styles/tab-bar.css'

interface TabBarProps {
  onNewTab: () => void
}

export default function TabBar({ onNewTab }: TabBarProps) {
  const { tabs, activeTabId, switchTab, closeTab, reorderTabs } = useDocumentStore()
  const [draggedTabId, setDraggedTabId] = React.useState<string | null>(null)

  const handleNewTab = (e: React.MouseEvent) => {
    e.stopPropagation()
    onNewTab()
  }

  const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation()
    closeTab(tabId)
  }

  const handleTabClick = (tabId: string) => {
    if (tabId !== activeTabId) {
      switchTab(tabId)
    }
  }

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, tabId: string) => {
    setDraggedTabId(tabId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetTabId: string) => {
    e.preventDefault()
    if (!draggedTabId || draggedTabId === targetTabId) return

    const draggedIndex = tabs.findIndex(t => t.id === draggedTabId)
    const targetIndex = tabs.findIndex(t => t.id === targetTabId)

    if (draggedIndex === -1 || targetIndex === -1) return

    // Reorder tabs
    const newTabs = [...tabs]
    const [draggedTab] = newTabs.splice(draggedIndex, 1)
    newTabs.splice(targetIndex, 0, draggedTab)

    reorderTabs(newTabs)
    setDraggedTabId(null)
  }

  const handleDragEnd = () => {
    setDraggedTabId(null)
  }

  const getTabTitle = (tab?: typeof tabs[0]) => {
    if (!tab?.filePath) return '未命名'
    const parts = tab.filePath.split('/')
    return parts[parts.length - 1]
  }

  return (
    <div className="tab-bar">
      <div className="tab-list">
        {tabs.map((tab) => {
          const title = getTabTitle(tab)
          const isActive = tab.id === activeTabId

          return (
            <div
              key={tab.id}
              className={`tab ${isActive ? 'active' : ''} ${draggedTabId === tab.id ? 'dragging' : ''}`}
              onClick={() => handleTabClick(tab.id)}
              draggable
              onDragStart={(e) => handleDragStart(e, tab.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, tab.id)}
              onDragEnd={handleDragEnd}
            >
              <span className="tab-icon">{tab.filePath ? '📄' : '📝'}</span>
              <span className="tab-title">{title}</span>
              <button
                className="tab-close"
                onClick={(e) => handleCloseTab(e, tab.id)}
                title="关闭标签"
              >
                ×
              </button>
            </div>
          )
        })}
      </div>
      <button className="tab-new" onClick={handleNewTab} title="新建标签">
        +
      </button>
    </div>
  )
}
