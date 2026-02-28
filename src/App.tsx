import React from 'react'
import EditorContainer from './components/EditorContainer'
import FileExplorer from './components/FileExplorer'
import { useDocumentStore, useUIStore } from './store'
import { fileOperations } from './utils/fileOperations'

function App() {
  const { filePath, setFilePath, setModified, setInitialContent } = useDocumentStore()
  const { toggleSidebar, showSidebar } = useUIStore()

  // Use refs to store listeners so they can be properly cleaned up
  const listenersRef = React.useRef<{
    newListener?: () => void
    openListener?: () => Promise<void>
    saveListener?: () => Promise<void>
    saveAsListener?: () => Promise<void>
  }>({})

  // Set initial content on mount
  React.useEffect(() => {
    setInitialContent('# Mermaid Test\n\n```mermaid\ngraph LR\n    A[Start] --> B[Process]\n    B --> C[End]\n```\n\nThis should render as a diagram above.')
  }, [setInitialContent])

  // Initialize listeners only once on mount
  React.useEffect(() => {
    const handleNew = () => {
      setFilePath(null)
      setModified(false)
      setInitialContent('# Mermaid Test\n\n```mermaid\ngraph LR\n    A[Start] --> B[Process]\n    B --> C[End]\n```\n\nThis should render as a diagram above.')
    }

    const handleOpenRequest = async () => {
      const result = await fileOperations.openFile()
      if (result) {
        setFilePath(result.path)
        setInitialContent(result.content)
        setModified(false)
      }
    }

    const handleSaveRequest = async () => {
      if (filePath) {
        const { content } = useDocumentStore.getState()
        await fileOperations.saveFile(filePath, content)
        setModified(false)
      } else {
        await handleSaveAsRequest()
      }
    }

    const handleSaveAsRequest = async () => {
      const { content } = useDocumentStore.getState()
      const newFilePath = await fileOperations.saveAsFile(content)
      if (newFilePath) {
        setFilePath(newFilePath)
        setModified(false)
      }
    }

    // Store listeners in ref for cleanup
    listenersRef.current = {
      newListener: handleNew,
      openListener: handleOpenRequest,
      saveListener: handleSaveRequest,
      saveAsListener: handleSaveAsRequest,
    }

    // Add listeners once
    window.electronAPI.on('file:new', handleNew)
    window.electronAPI.on('file:open-request', handleOpenRequest)
    window.electronAPI.on('file:save-request', handleSaveRequest)
    window.electronAPI.on('file:save-as-request', handleSaveAsRequest)

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
    }
  }, []) // Empty dependency array - only run on mount

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          padding: '10px 20px',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '18px' }}>Typora Editor</h1>
        <div>
          <button onClick={toggleSidebar} style={{ marginRight: '10px' }}>
            {showSidebar ? 'Hide' : 'Show'} Sidebar
          </button>
        </div>
      </header>
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {showSidebar && <FileExplorer />}
        <div style={{ flex: 1, padding: '20px' }}>
          <EditorContainer />
        </div>
      </div>
    </div>
  )
}

export default App
