import React from 'react'
import EditorContainer from './components/EditorContainer'
import FileExplorer from './components/FileExplorer'
import TabBar from './components/TabBar'
import RecentFiles from './components/RecentFiles'
import { useDocumentStore, useUIStore } from './store'
import { fileOperations } from './utils/fileOperations'
import './styles/global.css'
import './styles/app.css'

// Default Howto.md content shown on startup
const HOWTO_CONTENT = `# Typra 使用说明

欢迎使用 Typra！这是一款 Typora 风格的 Markdown 编辑器，提供实时预览和流畅的编辑体验。

## 快速开始

### 打开文件
- 点击侧边栏的 **Show Sidebar** 按钮打开文件浏览器
- 在侧边栏中浏览文件夹，点击 \`.md\` 文件即可打开
- 或使用菜单 \`File > Open...\` (⌘O) 选择文件

### 新建文件
- 使用菜单 \`File > New\` (⌘N) 创建新文件

### 保存文件
- 使用菜单 \`File > Save\` (⌘S) 保存当前文件
- 使用 \`File > Save As...\` (⌘⇧S) 另存为新文件

## 侧边栏导航

侧边栏显示您主目录下的文件和文件夹：

- 📁 **文件夹** - 点击进入该目录
- 📄 **Markdown 文件** - 点击打开编辑（白色显示）
- 📄 **其他文件** - 不可打开（灰色显示）
- ↩️ **返回上一层** - 进入子目录后，点击返回父目录

## Markdown 语法支持

### 标题
\`\`\`
# 一级标题
## 二级标题
### 三级标题
\`\`\`

### 格式化
\`\`\`
**粗体文本**
*斜体文本*
~~删除线~~
\`行内代码\`
\`\`\`

### 列表
\`\`\`
- 无序列表项 1
- 无序列表项 2

1. 有序列表项 1
2. 有序列表项 2
\`\`\`

### 引用
\`\`\`
> 这是一段引用文本
\`\`\`

### 代码块
\`\`\`javascript
function hello() {
  console.log('Hello, World!')
}
\`\`\`

### Mermaid 图表

Typra 支持 Mermaid 图表渲染：

\`\`\`mermaid
graph LR
    A[开始] --> B[处理]
    B --> C[结束]
\`\`\`

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| ⌘N | 新建文件 |
| ⌘O | 打开文件 |
| ⌘S | 保存文件 |
| ⌘⇧S | 另存为 |
| ⌘Q | 退出应用 |

## 预览模式

- 点击 **Hide Preview** 隐藏预览面板
- 点击 **Show Preview** 显示预览面板
- 拖动中间的分隔条调整编辑器和预览区的比例

## 关于

Typra 是一款使用 Electron、React 和 TypeScript 构建的跨平台 Markdown 编辑器。
`

function App() {
  const { tabs, activeTabId, addTab, switchTab, getActiveTab, saveActiveTabToStack, addRecentFile } = useDocumentStore()
  const { toggleSidebar, showSidebar, isFocusMode, theme } = useUIStore()

  // Use refs to store listeners so they can be properly cleaned up
  const listenersRef = React.useRef<{
    newListener?: () => void
    openListener?: () => Promise<void>
    saveListener?: () => Promise<void>
    saveAsListener?: () => Promise<void>
    openFileListener?: (filePath: string) => Promise<void>
  }>({})

  // Initialize with a default tab on mount
  React.useEffect(() => {
    if (tabs.length === 0) {
      addTab({ content: HOWTO_CONTENT, filePath: null })
    }
  }, [])

  // Apply theme attribute to body
  React.useEffect(() => {
    document.body.setAttribute('data-theme', theme)
  }, [theme])

  // Tab switching auto-saves current tab
  React.useEffect(() => {
    if (activeTabId) {
      saveActiveTabToStack()
    }
  }, [activeTabId])

  // Initialize listeners only once on mount
  React.useEffect(() => {
    const handleNew = () => {
      addTab({ content: '', filePath: null })
    }

    const handleOpenRequest = async () => {
      const result = await fileOperations.openFile()
      if (result) {
        addTab({ content: result.content, filePath: result.path })
        addRecentFile(result.path)
      }
    }

    const handleSaveRequest = async () => {
      const activeTab = getActiveTab()
      if (activeTab?.filePath) {
        await fileOperations.saveFile(activeTab.filePath, activeTab.content)
      } else {
        await handleSaveAsRequest()
      }
    }

    const handleSaveAsRequest = async () => {
      const activeTab = getActiveTab()
      if (!activeTab) return

      const newFilePath = await fileOperations.saveAsFile(activeTab.content)
      if (newFilePath) {
        useDocumentStore.getState().updateActiveTab?.({ filePath: newFilePath })
      }
    }

    const handleOpenFileRequest = async (file: string) => {
      try {
        const result = await fileOperations.readFile(file)
        if (result) {
          // Check if file is already open in a tab
          const existingTab = tabs.find(t => t.filePath === result.path)
          if (existingTab) {
            switchTab(existingTab.id)
          } else {
            addTab({ content: result.content, filePath: result.path })
          }
          addRecentFile(result.path)
        }
      } catch (error) {
        console.error('Failed to open recent file:', error)
      }
    }

    // Store listeners in ref for cleanup
    listenersRef.current = {
      newListener: handleNew,
      openListener: handleOpenRequest,
      saveListener: handleSaveRequest,
      saveAsListener: handleSaveAsRequest,
      openFileListener: handleOpenFileRequest,
    }

    // Add listeners once
    window.electronAPI.on('file:new', handleNew)
    window.electronAPI.on('file:open-request', handleOpenRequest)
    window.electronAPI.on('file:save-request', handleSaveRequest)
    window.electronAPI.on('file:save-as-request', handleSaveAsRequest)
    window.electronAPI.on('file:open-file', handleOpenFileRequest)

    // Cleanup on unmount only
    return () => {
      if (listenersRef.current.newListener) {
        window.electronAPI.removeListener('file:new', listenersRef.current.newListener)
      }
      if (listenersRef.current.openListener) {
        window.electronAPI.removeListener('file:open-request', listenersRef.current.openListener)
      }
      if (listenersRef.current.saveListener) {
        window.electronAPI.removeListener('file:save-request', listenersRef.current.saveListener)
      }
      if (listenersRef.current.saveAsListener) {
        window.electronAPI.removeListener('file:save-as-request', listenersRef.current.saveAsListener)
      }
      if (listenersRef.current.openFileListener) {
        window.electronAPI.removeListener('file:open-file', listenersRef.current.openFileListener)
      }
    }
  }, [activeTabId]) // Re-bind when activeTab changes for save operations

  const handleNewTab = () => {
    addTab({ content: '', filePath: null })
  }

  return (
    <div className={`app-container ${isFocusMode ? 'focus-mode' : ''}`}>
      <header className="app-header">
        <h1 className="app-title">
          <span className="app-title-icon">📝</span>
          Typra
        </h1>
        <div className="header-actions">
          <button onClick={toggleSidebar}>
            {showSidebar ? '📂 隐藏' : '📂 显示'} 侧边栏
          </button>
        </div>
      </header>
      <TabBar onNewTab={handleNewTab} />
      <div className="app-main">
        {showSidebar && (
          <div className="sidebar">
            <RecentFiles />
            <FileExplorer />
          </div>
        )}
        <div className="content-area">
          <EditorContainer />
        </div>
      </div>
    </div>
  )
}

export default App
