import { useEffect, useRef, useState } from 'react'
import { EditorView, Compartment } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { markdown } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import { oneDark } from '@codemirror/theme-one-dark'

interface CodeMirrorEditorProps {
  content: string
  onChange: (content: string) => void
  onSelectionChange?: (from: number, to: number) => void
}

// Create a compartment for managing the theme dynamically
const themeCompartment = new Compartment()

export default function CodeMirrorEditor({
  content,
  onChange,
  onSelectionChange,
}: CodeMirrorEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const [isDarkMode, setIsDarkMode] = useState(
    window.matchMedia('(prefers-color-scheme: dark)').matches
  )

  // Listen for system dark mode preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => setIsDarkMode(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    if (!containerRef.current) return

    const startState = EditorState.create({
      doc: content,
      extensions: [
        markdown({ codeLanguages: languages }),
        themeCompartment.of(isDarkMode ? oneDark : []),
        EditorView.theme({
          '&': { height: '100%', fontSize: '16px' },
          '.cm-scroller': { overflow: 'auto' },
          '.cm-content': { padding: '20px' },
        }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChange(update.state.doc.toString())
          }
          if (update.selectionSet && onSelectionChange) {
            const { from, to } = update.state.selection.main
            onSelectionChange(from, to)
          }
        }),
      ],
    })

    const view = new EditorView({
      state: startState,
      parent: containerRef.current,
    })

    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
    }
  }, [])

  // Handle theme changes dynamically
  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: themeCompartment.reconfigure(isDarkMode ? oneDark : []),
      })
    }
  }, [isDarkMode])

  useEffect(() => {
    if (viewRef.current && content !== viewRef.current.state.doc.toString()) {
      const transaction = viewRef.current.state.update({
        changes: { from: 0, to: viewRef.current.state.doc.length, insert: content },
      })
      viewRef.current.dispatch(transaction)
    }
  }, [content])

  return (
    <div
      ref={containerRef}
      style={{
        height: '100%',
        width: '100%',
        border: '1px solid #e0e0e0',
        borderRadius: '4px',
      }}
    />
  )
}
