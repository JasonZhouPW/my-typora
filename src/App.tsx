import React from 'react'
import EditorContainer from './components/EditorContainer'
import { useDocumentStore, useUIStore } from './store'
import { fileOperations } from './utils/fileOperations'

function App() {
  const { filePath, setFilePath, setModified, setInitialContent } = useDocumentStore()
  const { toggleSidebar } = useUIStore()

  React.useEffect(() => {
    setInitialContent('# Mermaid Test\n\n```mermaid\ngraph LR\n    A[Start] --> B[Process]\n    B --> C[End]\n```\n\nThis should render as a diagram above.')
  }, [setInitialContent])

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

    const newListener = () => handleNew()
    const openListener = () => handleOpenRequest()
    const saveListener = () => handleSaveRequest()
    const saveAsListener = () => handleSaveAsRequest()

    window.electronAPI.on('file:new', newListener)
    window.electronAPI.on('file:open-request', openListener)
    window.electronAPI.on('file:save-request', saveListener)
    window.electronAPI.on('file:save-as-request', saveAsListener)

    return () => {
      window.electronAPI.removeListener('file:new', newListener)
      window.electronAPI.removeListener('file:open-request', openListener)
      window.electronAPI.removeListener('file:save-request', saveListener)
      window.electronAPI.removeListener('file:save-as-request', saveAsListener)
    }
  }, [filePath, setFilePath, setModified, setInitialContent])

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
            Sidebar
          </button>
        </div>
      </header>
      <div style={{ flex: 1, padding: '20px' }}>
        <EditorContainer />
      </div>
    </div>
  )
}

export default App
