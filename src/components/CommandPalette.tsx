import React from 'react'
import { useUIStore } from '../store'

interface Command {
  id: string
  label: string
  hint: string
  run: () => void
}

interface CommandPaletteProps {
  commands: Command[]
}

export default function CommandPalette({ commands }: CommandPaletteProps) {
  const { isCommandPaletteOpen, setCommandPaletteOpen } = useUIStore()
  const [query, setQuery] = React.useState('')
  const filtered = commands.filter(command =>
    `${command.label} ${command.hint}`.toLowerCase().includes(query.toLowerCase())
  )

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === 'p') {
        event.preventDefault()
        setCommandPaletteOpen(true)
      }

      if (event.key === 'Escape') {
        setCommandPaletteOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [setCommandPaletteOpen])

  if (!isCommandPaletteOpen) return null

  return (
    <div className="command-overlay" onMouseDown={() => setCommandPaletteOpen(false)}>
      <div className="command-palette" onMouseDown={event => event.stopPropagation()}>
        <input
          autoFocus
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Run a command"
        />
        <div className="command-list">
          {filtered.map(command => (
            <button
              className="command-row"
              key={command.id}
              onClick={() => {
                command.run()
                setCommandPaletteOpen(false)
                setQuery('')
              }}
            >
              <span>{command.label}</span>
              <small>{command.hint}</small>
            </button>
          ))}
          {filtered.length === 0 && <div className="empty-state">No matching commands</div>}
        </div>
      </div>
    </div>
  )
}
