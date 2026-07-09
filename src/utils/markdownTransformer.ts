import MarkdownIt from 'markdown-it'

export class MarkdownTransformer {
  private md: MarkdownIt

  constructor() {
    this.md = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true,
    })
  }

  transform(markdown: string): string {
    let html = this.md.render(markdown)
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
