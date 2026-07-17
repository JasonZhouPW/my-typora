import MarkdownIt from 'markdown-it'

const LOCAL_ASSET_SCHEME = 'typra-local://asset/'

function isExternalResource(source: string): boolean {
  return /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(source)
}

function normalizePath(filePath: string): string {
  const usesWindowsSeparators = filePath.includes('\\')
  const separator = usesWindowsSeparators ? '\\' : '/'
  const prefix = filePath.match(/^[A-Za-z]:[\\/]/)?.[0].slice(0, 2) ?? (filePath.startsWith('/') ? '/' : '')
  const parts = filePath.split(/[\\/]+/)
  const normalized: string[] = []

  for (const part of parts) {
    if (!part || part === '.' || /^[A-Za-z]:$/.test(part)) continue
    if (part === '..') {
      normalized.pop()
    } else {
      normalized.push(part)
    }
  }

  return `${prefix}${prefix && prefix !== '/' ? separator : ''}${normalized.join(separator)}`
}

function toLocalAssetUrl(source: string, documentPath?: string | null): string {
  if (!source || isExternalResource(source)) return source

  let decodedSource = source
  try {
    decodedSource = decodeURIComponent(source)
  } catch {
    // Keep malformed percent escapes unchanged so the preview remains renderable.
  }

  const isAbsolute = decodedSource.startsWith('/') || /^[A-Za-z]:[\\/]/.test(decodedSource)
  if (!isAbsolute && !documentPath) return source

  const documentDirectory = documentPath?.replace(/[\\/][^\\/]*$/, '') ?? ''
  const resolvedPath = normalizePath(isAbsolute ? decodedSource : `${documentDirectory}/${decodedSource}`)
  return `${LOCAL_ASSET_SCHEME}${encodeURIComponent(resolvedPath)}`
}

export class MarkdownTransformer {
  private md: MarkdownIt

  constructor() {
    this.md = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true,
    })

    const defaultImageRenderer = this.md.renderer.rules.image
    this.md.renderer.rules.image = (tokens, index, options, environment, renderer) => {
      const token = tokens[index]
      const sourceIndex = token.attrIndex('src')
      if (sourceIndex >= 0) {
        token.attrs![sourceIndex][1] = toLocalAssetUrl(
          token.attrs![sourceIndex][1],
          (environment as { documentPath?: string | null }).documentPath,
        )
      }
      return defaultImageRenderer
        ? defaultImageRenderer(tokens, index, options, environment, renderer)
        : renderer.renderToken(tokens, index, options)
    }
  }

  transform(markdown: string, documentPath?: string | null): string {
    const environment = { documentPath }
    let html = this.md.render(markdown, environment)
    // Replace mermaid code blocks with placeholder divs
    const mermaidDiagrams = html.match(/<pre><code class="language-mermaid">[\s\S]*?<\/code><\/pre>/g)
    if (mermaidDiagrams) {
      mermaidDiagrams.forEach(() => {
        html = html.replace(
          /<pre><code class="language-mermaid">[\s\S]*?<\/code><\/pre>/,
          `<div class="mermaid-diagram" style="display: flex; justify-content: center; align-items: center; min-height: 100px; width: 100%; padding: 10px;"></div>`
        )
      })
    }
    return html
  }

  transformForExport(markdown: string): string {
    return this.md.render(markdown)
  }

  extractMermaidCode(markdown: string): string[] {
    const mermaidRegex = /```mermaid\n([\s\S]*?)\n```/g
    const matches = []
    let match
    while ((match = mermaidRegex.exec(markdown)) !== null) {
      let code = match[1]
      console.log('Raw extracted mermaid code:', JSON.stringify(code))
      code = code.trim()
      console.log('Trimmed mermaid code:', JSON.stringify(code))
      matches.push(code)
    }
    return matches
  }

  parse(markdown: string) {
    return this.md.parse(markdown, {})
  }

  toToPlainText(markdown: string): string {
    const html = this.md.render(markdown)
    return html.replace(/<[^>]*>/g, '')
  }
}

// Singleton instance
export const markdownTransformer = new MarkdownTransformer()
