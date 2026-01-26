import React from 'react'
import EditorContainer from './components/EditorContainer'
import { useDocumentStore } from './store'

function App() {
  const { setInitialContent } = useDocumentStore()

  React.useEffect(() => {
    setInitialContent('# Welcome to Typora\n\nStart typing your Markdown here...\n\n## Features\n\n- **Bold** and *italic* text\n- `Code` blocks\n- [Links](https://example.com)\n\nAnd more to come!')
  }, [])

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '10px 20px', borderBottom: '1px solid #e0e0e0' }}>
        <h1 style={{ margin: 0, fontSize: '18px' }}>Typora Editor</h1>
      </header>
      <div style={{ flex: 1, padding: '20px' }}>
        <EditorContainer />
      </div>
    </div>
  )
}

export default App
