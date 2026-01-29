import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { EditorView } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { markdown } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import { bracketMatching } from '@codemirror/language'
import { oneDark } from '@codemirror/theme-one-dark'

export interface CodeMirrorEditorRef {
  insertText: (text: { before: string; after: string } | string) => void
}

interface CodeMirrorEditorProps {
  content: string
  onChange: (content: string) => void
  onSelectionChange?: (from: number, to: number) => void
}

const CodeMirrorEditor = forwardRef<CodeMirrorEditorRef, CodeMirrorEditorProps>(({
  content,
  onChange,
  onSelectionChange,
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)

  const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches

  useImperativeHandle(ref, () => ({
    insertText: (text) => {
      if (!viewRef.current) return

      const view = viewRef.current
      const { from, to } = view.state.selection.main

      if (typeof text === 'string') {
        view.dispatch({
          changes: { from, to, insert: text },
          selection: { anchor: from + text.length },
        })
      } else if (text && 'before' in text && 'after' in text) {
        const selectedText = view.state.doc.sliceString(from, to)
        view.dispatch({
          changes: { from, to, insert: text.before + selectedText + text.after },
          selection: { anchor: from + text.before.length + selectedText.length },
        })
      }

      onChange(view.state.doc.toString())
    },
  }))

  useEffect(() => {
    if (!containerRef.current) return

    const startState = EditorState.create({
      doc: content,
      extensions: [
        markdown({ codeLanguages: languages }),
        bracketMatching(),
        isDarkMode ? oneDark : EditorView.theme({
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
})

CodeMirrorEditor.displayName = 'CodeMirrorEditor'
export default CodeMirrorEditor
