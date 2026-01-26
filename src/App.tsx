import React from 'react'
import EditorContainer from './components/EditorContainer'
import { useDocumentStore, useUIStore } from './store'
import { fileOperations } from './utils/fileOperations'

function App() {
  const { filePath, setFilePath, setModified, setInitialContent } = useDocumentStore()
  const { toggleSidebar } = useUIStore()

  React.useEffect(() => {
    setInitialContent('# Welcome to Typora\n\nStart typing your Markdown here...\n\n## Features\n\n- **Bold** and *italic* text\n- `Code` blocks\n- [Links](https://example.com)\n\nAnd more to come!')
  }, [setInitialContent])

  React.useEffect(() => {
    const handleNew = () => {
      setFilePath(null)
      setModified(false)
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

    const handleMenuAction = async (_event: Electron.IpcRendererEvent, channel: string) => {
      switch (channel) {
        case 'file:new':
          handleNew()
          break
        case 'file:open-request':
          await handleOpenRequest()
          break
        case 'file:save-request':
          await handleSaveRequest()
          break
        case 'file:save-as-request':
          await handleSaveAsRequest()
          break
      }
    }

    const listener = (_event: Electron.IpcRendererEvent, channel: string) => {
      handleMenuAction(_event, channel)
    }

    const { ipcRenderer } = require('electron')
    ipcRenderer.on('menu-action', listener)

    return () => {
      ipcRenderer.removeListener('menu-action', listener)
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
