import { useEffect } from 'react'
import { useFileTreeStore } from '../store'
import FileTreeNode from './FileTreeNode'

interface FileExplorerProps {
  onFileSelect: (path: string) => void
}

export default function FileExplorer({ onFileSelect }: FileExplorerProps) {
  const { fileTree, setFileTree } = useFileTreeStore()

  useEffect(() => {
    async function loadRoots() {
      try {
        const roots = await window.electronAPI.fileTree.getRoots()
        setFileTree(roots)
      } catch (error) {
        console.error('Error loading file tree roots:', error)
      }
    }
    loadRoots()
  }, [setFileTree])

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#fafafa' }}>
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #e0e0e0',
        fontWeight: 600,
        fontSize: '14px',
        color: '#424242',
      }}>
        Explorer
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {fileTree.map((node) => (
          <FileTreeNode key={node.path} node={node} level={0} onFileSelect={onFileSelect} />
        ))}
      </div>
    </div>
  )
}
