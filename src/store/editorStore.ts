import { create } from 'zustand'

interface EditorState {
  cursorPosition: number
  selectionStart: number
  selectionEnd: number
  currentBlockType: string
  setCursorPosition: (pos: number) => void
  setSelection: (start: number, end: number) => void
  setCurrentBlockType: (type: string) => void
}

export const useEditorStore = create<EditorState>((set) => ({
  cursorPosition: 0,
  selectionStart: 0,
  selectionEnd: 0,
  currentBlockType: 'paragraph',

  setCursorPosition: (pos: number) => set({ cursorPosition: pos }),
  setSelection: (start: number, end: number) => set({ selectionStart: start, selectionEnd: end }),
  setCurrentBlockType: (type: string) => set({ currentBlockType: type }),
}))
