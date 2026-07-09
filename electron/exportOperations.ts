import { BrowserWindow, dialog, ipcMain } from 'electron'
import fs from 'fs/promises'
import path from 'path'
import { buildDocxFromMarkdown } from './docxBuilder'
import { getMainWindow } from './main'

type ExportPayload = {
  markdown: string
  html: string
  sourceFilePath?: string | null
}

type ExportResult = {
  success: boolean
  filePath?: string
  error?: string
}

export function registerExportHandlers() {
  ipcMain.handle('export:pdf', async (_event, payload: ExportPayload): Promise<ExportResult> => {
    const filePath = await chooseExportPath(payload.sourceFilePath, 'pdf')
    if (!filePath) return { success: false }

    let printWindow: BrowserWindow | null = null
    try {
      printWindow = new BrowserWindow({
        show: false,
        webPreferences: {
          offscreen: true,
        },
      })

      await printWindow.loadURL(`data:text/html;charset=UTF-8,${encodeURIComponent(renderPdfHtml(payload.html))}`)
      const pdf = await printWindow.webContents.printToPDF({
        printBackground: true,
        pageSize: 'A4',
      })

      await fs.writeFile(filePath, pdf)
      return { success: true, filePath }
    } catch (error) {
      console.error('Failed to export PDF:', error)
      return { success: false, error: errorMessage(error) }
    } finally {
      printWindow?.close()
    }
  })

  ipcMain.handle('export:docx', async (_event, payload: ExportPayload): Promise<ExportResult> => {
    const filePath = await chooseExportPath(payload.sourceFilePath, 'docx')
    if (!filePath) return { success: false }

    try {
      const docx = buildDocxFromMarkdown(payload.markdown)
      await fs.writeFile(filePath, docx)
      return { success: true, filePath }
    } catch (error) {
      console.error('Failed to export DOCX:', error)
      return { success: false, error: errorMessage(error) }
    }
  })
}

async function chooseExportPath(sourceFilePath: string | null | undefined, extension: 'pdf' | 'docx'): Promise<string | null> {
  const mainWindow = getMainWindow()
  const defaultPath = getDefaultExportPath(sourceFilePath, extension)
  const options = {
    defaultPath,
    filters: [
      extension === 'pdf'
        ? { name: 'PDF Documents', extensions: ['pdf'] }
        : { name: 'Word Documents', extensions: ['docx'] },
    ],
  }
  const result = mainWindow
    ? await dialog.showSaveDialog(mainWindow, options)
    : await dialog.showSaveDialog(options)

  if (result.canceled || !result.filePath) {
    return null
  }

  return ensureExtension(result.filePath, extension)
}

function getDefaultExportPath(sourceFilePath: string | null | undefined, extension: 'pdf' | 'docx'): string {
  if (!sourceFilePath) {
    return `Untitled.${extension}`
  }

  const parsed = path.parse(sourceFilePath)
  return path.join(parsed.dir, `${parsed.name}.${extension}`)
}

function ensureExtension(filePath: string, extension: 'pdf' | 'docx'): string {
  return path.extname(filePath).toLowerCase() === `.${extension}` ? filePath : `${filePath}.${extension}`
}

function renderPdfHtml(contentHtml: string): string {
  return `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8">
    <style>
      body {
        color: #1f2937;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-size: 14px;
        line-height: 1.65;
        margin: 40px;
      }
      h1, h2, h3, h4, h5, h6 {
        color: #111827;
        line-height: 1.25;
        margin: 1.2em 0 0.45em;
      }
      h1 { font-size: 30px; }
      h2 { font-size: 24px; }
      h3 { font-size: 20px; }
      p { margin: 0 0 0.9em; }
      pre {
        background: #f3f4f6;
        border-radius: 6px;
        overflow-wrap: anywhere;
        padding: 12px;
        white-space: pre-wrap;
      }
      code {
        background: #f3f4f6;
        border-radius: 4px;
        font-family: Menlo, Monaco, Consolas, monospace;
        font-size: 0.92em;
        padding: 0.12em 0.3em;
      }
      pre code {
        background: transparent;
        padding: 0;
      }
      blockquote {
        border-left: 3px solid #d1d5db;
        color: #4b5563;
        margin: 1em 0;
        padding-left: 1em;
      }
      table {
        border-collapse: collapse;
        margin: 1em 0;
        width: 100%;
      }
      th, td {
        border: 1px solid #d1d5db;
        padding: 6px 8px;
      }
      img, svg {
        max-width: 100%;
      }
    </style>
  </head>
  <body>${contentHtml}</body>
</html>`
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error'
}
