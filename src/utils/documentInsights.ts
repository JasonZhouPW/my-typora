export interface DocumentSummary {
  id: string
  title: string
  filePath: string | null
  content: string
}

export interface HeadingInfo {
  level: number
  text: string
  slug: string
  line: number
}

export interface SearchResult {
  document: DocumentSummary
  line: number
  snippet: string
}

export interface BacklinkResult {
  document: DocumentSummary
  line: number
  match: string
}

const TAG_PATTERN = /(^|\s)#([A-Za-z0-9_\-\u4e00-\u9fa5]+)/g

export function getDocumentTitle(filePath: string | null, content: string): string {
  const firstHeading = extractHeadings(content)[0]
  if (firstHeading) return firstHeading.text
  if (!filePath) return 'Untitled'
  return filePath.split('/').pop() || filePath
}

export function getFileBaseName(filePath: string | null): string {
  if (!filePath) return 'Untitled'
  const fileName = filePath.split('/').pop() || filePath
  return fileName.replace(/\.(md|markdown|txt)$/i, '')
}

export function extractHeadings(markdown: string): HeadingInfo[] {
  return markdown.split('\n').reduce<HeadingInfo[]>((headings, line, index) => {
    const match = /^(#{1,6})\s+(.+?)\s*$/.exec(line)
    if (!match) return headings

    const text = match[2].replace(/[#*_`~]/g, '').trim()
    if (!text) return headings

    headings.push({
      level: match[1].length,
      text,
      slug: createSlug(text),
      line: index + 1,
    })
    return headings
  }, [])
}

export function extractTags(markdown: string): string[] {
  const tags = new Set<string>()
  const frontmatterMatch = /^---\n([\s\S]*?)\n---/.exec(markdown)

  if (frontmatterMatch) {
    const tagLine = frontmatterMatch[1]
      .split('\n')
      .find(line => line.trim().startsWith('tags:'))

    if (tagLine) {
      tagLine
        .replace(/^tags:\s*/, '')
        .replace(/[\[\]]/g, '')
        .split(',')
        .map(tag => tag.trim().replace(/^#/, ''))
        .filter(Boolean)
        .forEach(tag => tags.add(tag))
    }
  }

  let match: RegExpExecArray | null
  TAG_PATTERN.lastIndex = 0
  while ((match = TAG_PATTERN.exec(markdown)) !== null) {
    tags.add(match[2])
  }

  return Array.from(tags).sort((a, b) => a.localeCompare(b))
}

export function searchDocuments(query: string, docs: DocumentSummary[]): SearchResult[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return []

  return docs.flatMap(document => {
    const lines = document.content.split('\n')
    return lines.flatMap((line, index) => {
      if (!line.toLowerCase().includes(normalized) && !document.title.toLowerCase().includes(normalized)) {
        return []
      }

      return [{
        document,
        line: index + 1,
        snippet: line.trim().slice(0, 160) || document.title,
      }]
    })
  }).slice(0, 50)
}

export function findBacklinks(target: DocumentSummary, docs: DocumentSummary[]): BacklinkResult[] {
  const title = target.title.trim()
  const baseName = getFileBaseName(target.filePath)
  const needles = Array.from(new Set([
    title,
    baseName,
    `[[${title}]]`,
    `[[${baseName}]]`,
  ].filter(Boolean))).map(value => value.toLowerCase())

  return docs
    .filter(document => document.id !== target.id)
    .flatMap(document => document.content.split('\n').flatMap((line, index) => {
      const normalizedLine = line.toLowerCase()
      const matched = needles.find(needle => normalizedLine.includes(needle))
      if (!matched) return []
      return [{
        document,
        line: index + 1,
        match: line.trim().slice(0, 160),
      }]
    }))
    .slice(0, 30)
}

function createSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\u4e00-\u9fa5\s-]/g, '')
    .replace(/\s+/g, '-')
}
