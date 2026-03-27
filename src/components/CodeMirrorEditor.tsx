import { useEffect, useRef } from 'react'
import { EditorView } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { markdown } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import { search, highlightSelectionMatches, searchKeymap } from '@codemirror/search'
import { keymap, drawSelection, highlightActiveLine } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'

interface CodeMirrorEditorProps {
  content: string
  onChange: (content: string) => void
  onSelectionChange?: (from: number, to: number) => void
  viewRef?: React.RefObject<EditorView | null>
}

export default function CodeMirrorEditor({
  content,
  onChange,
  onSelectionChange,
  viewRef: externalViewRef,
}: CodeMirrorEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const startState = EditorState.create({
      doc: content,
      extensions: [
        markdown({ codeLanguages: languages }),
        search({ top: true }),
        highlightSelectionMatches(),
        history(),
        drawSelection(),
        highlightActiveLine(),
        keymap.of([
          ...defaultKeymap,
          ...historyKeymap,
          ...searchKeymap,
          {
            key: 'Ctrl-h',
            run: () => {
              // Open search panel - this is handled by search({ top: true })
              return true
            }
          }
        ]),
        EditorView.theme({
          '&': { height: '100%', fontSize: '16px' },
          '.cm-scroller': { overflow: 'auto' },
          '.cm-content': { padding: '20px' },
          '.cm-cursor': {
            borderLeftColor: 'var(--color-primary, #4f46e5)',
            borderLeftWidth: '3px',
            borderLeftStyle: 'solid',
          },
          '.cm-activeLine': {
            backgroundColor: 'var(--bg-secondary, #f9fafb)',
          },
          '.cm-searchMatch': { backgroundColor: '#ffdd57' },
          '.cm-searchMatch.cm-searchMatch-selected': { backgroundColor: '#ff9e1b' },
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

    if (externalViewRef) {
      (externalViewRef as React.MutableRefObject<EditorView | null>).current = view
    }

    return () => {
      view.destroy()
      viewRef.current = null
    }
  }, [])

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
