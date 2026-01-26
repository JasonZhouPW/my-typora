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

  /**
   * Convert markdown to HTML
   */
  transform(markdown: string): string {
    return this.md.render(markdown)
  }

  /**
   * Parse markdown to tokens
   */
  parse(markdown: string) {
    return this.md.parse(markdown, {})
  }

  /**
   * Get plain text from markdown (strips formatting)
   */
  toToPlainText(markdown: string): string {
    const html = this.md.render(markdown)
    return html.replace(/<[^>]*>/g, '')
  }
}

// Singleton instance
export const markdownTransformer = new MarkdownTransformer()
