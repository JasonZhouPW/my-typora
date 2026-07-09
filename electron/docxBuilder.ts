import MarkdownIt from 'markdown-it'

type InlineStyle = {
  bold?: boolean
  italic?: boolean
  code?: boolean
}

type ParagraphOptions = {
  style?: string
  indentLevel?: number
  listKind?: 'bullet' | 'ordered'
}

const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
})

const crcTable = makeCrcTable()

export function buildDocxFromMarkdown(markdownContent: string): Buffer {
  const documentXml = buildDocumentXml(markdownContent)
  const files = new Map<string, string | Buffer>([
    ['[Content_Types].xml', contentTypesXml()],
    ['_rels/.rels', rootRelationshipsXml()],
    ['docProps/core.xml', corePropertiesXml()],
    ['docProps/app.xml', appPropertiesXml()],
    ['word/document.xml', documentXml],
    ['word/styles.xml', stylesXml()],
    ['word/numbering.xml', numberingXml()],
    ['word/settings.xml', settingsXml()],
  ])

  return zipFiles(files)
}

function buildDocumentXml(markdownContent: string): string {
  const tokens = markdown.parse(markdownContent, {})
  const body: string[] = []
  const listStack: Array<'bullet' | 'ordered'> = []
  let pendingParagraph: ParagraphOptions | null = null
  let blockquoteDepth = 0

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index]

    if (token.type === 'heading_open') {
      pendingParagraph = { style: `Heading${token.tag.replace('h', '')}` }
      continue
    }

    if (token.type === 'paragraph_open') {
      const currentList = listStack[listStack.length - 1]
      pendingParagraph = currentList
        ? { listKind: currentList, indentLevel: Math.max(0, listStack.length - 1) }
        : blockquoteDepth > 0
          ? { style: 'Quote' }
          : {}
      continue
    }

    if (token.type === 'bullet_list_open') {
      listStack.push('bullet')
      continue
    }

    if (token.type === 'ordered_list_open') {
      listStack.push('ordered')
      continue
    }

    if (token.type === 'bullet_list_close' || token.type === 'ordered_list_close') {
      listStack.pop()
      continue
    }

    if (token.type === 'inline') {
      body.push(paragraphXml(renderInlineRuns(token.children ?? [], blockquoteDepth > 0 ? { italic: true } : {}), pendingParagraph ?? {}))
      pendingParagraph = null
      continue
    }

    if (token.type === 'fence' || token.type === 'code_block') {
      const lines = token.content.replace(/\s+$/, '').split('\n')
      lines.forEach((line) => {
        body.push(paragraphXml([runXml(line || ' ', { code: true })], { style: 'CodeBlock' }))
      })
      continue
    }

    if (token.type === 'blockquote_open') {
      blockquoteDepth += 1
      continue
    }

    if (token.type === 'blockquote_close') {
      blockquoteDepth = Math.max(0, blockquoteDepth - 1)
    }
  }

  if (body.length === 0) {
    body.push(paragraphXml([runXml('', {})], {}))
  }

  return xmlDocument([
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">',
    '<w:body>',
    body.join(''),
    '<w:sectPr>',
    '<w:pgSz w:w="12240" w:h="15840"/>',
    '<w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>',
    '</w:sectPr>',
    '</w:body>',
    '</w:document>',
  ])
}

function renderInlineRuns(tokens: NonNullable<ReturnType<MarkdownIt['parse']>[number]['children']>, style: InlineStyle): string[] {
  const runs: string[] = []
  let currentStyle = { ...style }

  tokens.forEach((token) => {
    if (token.type === 'strong_open') {
      currentStyle = { ...currentStyle, bold: true }
      return
    }

    if (token.type === 'strong_close') {
      currentStyle = { ...currentStyle, bold: false }
      return
    }

    if (token.type === 'em_open') {
      currentStyle = { ...currentStyle, italic: true }
      return
    }

    if (token.type === 'em_close') {
      currentStyle = { ...currentStyle, italic: false }
      return
    }

    if (token.type === 'code_inline') {
      runs.push(runXml(token.content, { ...currentStyle, code: true }))
      return
    }

    if (token.type === 'softbreak' || token.type === 'hardbreak') {
      runs.push('<w:r><w:br/></w:r>')
      return
    }

    if (token.type === 'text') {
      runs.push(runXml(token.content, currentStyle))
    }
  })

  return runs
}

function paragraphXml(runs: string[], options: ParagraphOptions): string {
  const properties: string[] = []

  if (options.style) {
    properties.push(`<w:pStyle w:val="${escapeXmlAttribute(options.style)}"/>`)
  }

  if (options.listKind) {
    const ilvl = options.indentLevel ?? 0
    const numId = options.listKind === 'bullet' ? 1 : 2
    properties.push(`<w:numPr><w:ilvl w:val="${ilvl}"/><w:numId w:val="${numId}"/></w:numPr>`)
  }

  const propertyXml = properties.length > 0 ? `<w:pPr>${properties.join('')}</w:pPr>` : ''
  return `<w:p>${propertyXml}${runs.join('')}</w:p>`
}

function runXml(text: string, style: InlineStyle): string {
  const properties: string[] = []

  if (style.bold) properties.push('<w:b/>')
  if (style.italic) properties.push('<w:i/>')
  if (style.code) {
    properties.push('<w:rStyle w:val="CodeInline"/>')
    properties.push('<w:rFonts w:ascii="Menlo" w:hAnsi="Menlo"/>')
  }

  const propertyXml = properties.length > 0 ? `<w:rPr>${properties.join('')}</w:rPr>` : ''
  const preserveSpace = /^\s|\s$/.test(text) ? ' xml:space="preserve"' : ''
  return `<w:r>${propertyXml}<w:t${preserveSpace}>${escapeXmlText(text)}</w:t></w:r>`
}

function contentTypesXml(): string {
  return xmlDocument([
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">',
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>',
    '<Default Extension="xml" ContentType="application/xml"/>',
    '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>',
    '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>',
    '<Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>',
    '<Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>',
    '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>',
    '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>',
    '</Types>',
  ])
}

function rootRelationshipsXml(): string {
  return xmlDocument([
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>',
    '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>',
    '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>',
    '</Relationships>',
  ])
}

function stylesXml(): string {
  return xmlDocument([
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">',
    '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/><w:rPr><w:sz w:val="22"/></w:rPr></w:style>',
    headingStyleXml('Heading1', 32, true),
    headingStyleXml('Heading2', 28, true),
    headingStyleXml('Heading3', 24, true),
    headingStyleXml('Heading4', 22, true),
    headingStyleXml('Heading5', 22, false),
    headingStyleXml('Heading6', 22, false),
    '<w:style w:type="paragraph" w:styleId="Quote"><w:name w:val="Quote"/><w:pPr><w:ind w:left="432"/><w:spacing w:before="120" w:after="120"/></w:pPr><w:rPr><w:i/><w:color w:val="666666"/></w:rPr></w:style>',
    '<w:style w:type="paragraph" w:styleId="CodeBlock"><w:name w:val="Code Block"/><w:pPr><w:spacing w:before="80" w:after="80"/><w:shd w:fill="F3F4F6"/></w:pPr><w:rPr><w:rFonts w:ascii="Menlo" w:hAnsi="Menlo"/><w:sz w:val="20"/></w:rPr></w:style>',
    '<w:style w:type="character" w:styleId="CodeInline"><w:name w:val="Inline Code"/><w:rPr><w:rFonts w:ascii="Menlo" w:hAnsi="Menlo"/><w:sz w:val="20"/></w:rPr></w:style>',
    '</w:styles>',
  ])
}

function headingStyleXml(id: string, size: number, bold: boolean): string {
  return `<w:style w:type="paragraph" w:styleId="${id}"><w:name w:val="${id}"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:before="240" w:after="120"/></w:pPr><w:rPr>${bold ? '<w:b/>' : ''}<w:sz w:val="${size}"/></w:rPr></w:style>`
}

function numberingXml(): string {
  return xmlDocument([
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">',
    '<w:abstractNum w:abstractNumId="1"><w:multiLevelType w:val="hybridMultilevel"/><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr></w:lvl></w:abstractNum>',
    '<w:abstractNum w:abstractNumId="2"><w:multiLevelType w:val="hybridMultilevel"/><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr></w:lvl></w:abstractNum>',
    '<w:num w:numId="1"><w:abstractNumId w:val="1"/></w:num>',
    '<w:num w:numId="2"><w:abstractNumId w:val="2"/></w:num>',
    '</w:numbering>',
  ])
}

function settingsXml(): string {
  return xmlDocument([
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">',
    '<w:defaultTabStop w:val="720"/>',
    '</w:settings>',
  ])
}

function corePropertiesXml(): string {
  const now = new Date().toISOString()
  return xmlDocument([
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">',
    '<dc:creator>Typra</dc:creator>',
    `<dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created>`,
    `<dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified>`,
    '</cp:coreProperties>',
  ])
}

function appPropertiesXml(): string {
  return xmlDocument([
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">',
    '<Application>Typra</Application>',
    '</Properties>',
  ])
}

function zipFiles(files: Map<string, string | Buffer>): Buffer {
  const localParts: Buffer[] = []
  const centralParts: Buffer[] = []
  let offset = 0

  files.forEach((content, name) => {
    const fileName = Buffer.from(name, 'utf-8')
    const data = Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf-8')
    const crc = crc32(data)
    const localHeader = Buffer.alloc(30)

    localHeader.writeUInt32LE(0x04034b50, 0)
    localHeader.writeUInt16LE(20, 4)
    localHeader.writeUInt16LE(0x0800, 6)
    localHeader.writeUInt16LE(0, 8)
    localHeader.writeUInt16LE(0, 10)
    localHeader.writeUInt16LE(0, 12)
    localHeader.writeUInt32LE(crc, 14)
    localHeader.writeUInt32LE(data.length, 18)
    localHeader.writeUInt32LE(data.length, 22)
    localHeader.writeUInt16LE(fileName.length, 26)
    localHeader.writeUInt16LE(0, 28)

    localParts.push(localHeader, fileName, data)

    const centralHeader = Buffer.alloc(46)
    centralHeader.writeUInt32LE(0x02014b50, 0)
    centralHeader.writeUInt16LE(20, 4)
    centralHeader.writeUInt16LE(20, 6)
    centralHeader.writeUInt16LE(0x0800, 8)
    centralHeader.writeUInt16LE(0, 10)
    centralHeader.writeUInt16LE(0, 12)
    centralHeader.writeUInt16LE(0, 14)
    centralHeader.writeUInt32LE(crc, 16)
    centralHeader.writeUInt32LE(data.length, 20)
    centralHeader.writeUInt32LE(data.length, 24)
    centralHeader.writeUInt16LE(fileName.length, 28)
    centralHeader.writeUInt16LE(0, 30)
    centralHeader.writeUInt16LE(0, 32)
    centralHeader.writeUInt16LE(0, 34)
    centralHeader.writeUInt16LE(0, 36)
    centralHeader.writeUInt32LE(0, 38)
    centralHeader.writeUInt32LE(offset, 42)
    centralParts.push(centralHeader, fileName)

    offset += localHeader.length + fileName.length + data.length
  })

  const centralDirectory = Buffer.concat(centralParts)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(0, 4)
  end.writeUInt16LE(0, 6)
  end.writeUInt16LE(files.size, 8)
  end.writeUInt16LE(files.size, 10)
  end.writeUInt32LE(centralDirectory.length, 12)
  end.writeUInt32LE(offset, 16)
  end.writeUInt16LE(0, 20)

  return Buffer.concat([...localParts, centralDirectory, end])
}

function crc32(data: Buffer): number {
  let crc = 0xffffffff
  for (const byte of data) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 0xff]
  }
  return (crc ^ 0xffffffff) >>> 0
}

function makeCrcTable(): number[] {
  const table: number[] = []
  for (let index = 0; index < 256; index += 1) {
    let value = index
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1)
    }
    table[index] = value >>> 0
  }
  return table
}

function escapeXmlText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function escapeXmlAttribute(value: string): string {
  return escapeXmlText(value).replace(/"/g, '&quot;')
}

function xmlDocument(parts: string[]): string {
  return parts.join('')
}
