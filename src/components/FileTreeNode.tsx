import { useState } from 'react'
import { useFileTreeStore, type TreeNode } from '../store'

interface FileTreeNodeProps {
  node: TreeNode
  level: number
  onFileSelect: (path: string) => void
}

export default function FileTreeNode({ node, level, onFileSelect }: FileTreeNodeProps) {
  const { expandedFolders, toggleFolder, selectedFile } = useFileTreeStore()
  const [children, setChildren] = useState<TreeNode[]>([])
  const [loaded, setLoaded] = useState(false)
  const isSelected = selectedFile === node.path
  const isExpanded = expandedFolders.has(node.path)

  const handleClick = async () => {
    if (node.type === 'folder') {
      toggleFolder(node.path)
      if (!loaded && !isExpanded) {
        try {
          const nodes = await window.electronAPI.fileTree.readDirectory(node.path)
          setChildren(nodes)
          setLoaded(true)
        } catch (error) {
          console.error('Error loading directory:', error)
        }
      }
    } else {
      onFileSelect(node.path)
    }
  }

  const icon = node.type === 'folder' ? (isExpanded ? '📂' : '📁') : '📄'
  const paddingLeft = level * 16 + 8

  return (
    <>
      <div
        onClick={handleClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '4px 8px',
          paddingLeft: `${paddingLeft}px`,
          cursor: 'pointer',
          backgroundColor: isSelected ? '#e3f2fd' : 'transparent',
          borderRadius: '4px',
          userSelect: 'none',
          fontSize: '14px',
          height: '28px',
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isSelected ? '#e3f2fd' : '#f5f5f5'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isSelected ? '#e3f2fd' : 'transparent'}
      >
        <span style={{ marginRight: '6px' }}>{icon}</span>
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {node.name}
        </span>
      </div>
      {isExpanded && children.map((child) => (
        <FileTreeNode key={child.path} node={child} level={level + 1} onFileSelect={onFileSelect} />
      ))}
    </>
  )
}
