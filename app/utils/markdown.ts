import { Marked, type Token, type Tokens } from 'marked'
import DOMPurify from 'isomorphic-dompurify'

export interface MarkdownTocLink {
  id: string
  text: string
  children?: MarkdownTocLink[]
}

export interface ParsedMarkdown {
  html: string
  toc: MarkdownTocLink[]
}

function tokenText(tokens: Token[]): string {
  return tokens.map((token) => {
    if ('tokens' in token && token.tokens) return tokenText(token.tokens)
    if ('text' in token && typeof token.text === 'string') return token.text
    return ''
  }).join('')
}

export function parseMarkdown(content: string | null | undefined): ParsedMarkdown {
  if (!content) return { html: '', toc: [] }

  const marked = new Marked()
  const toc: MarkdownTocLink[] = []
  const usedIds = new Map<string, number>()

  marked.use({
    renderer: {
      heading({ tokens, depth }: Tokens.Heading) {
        const text = tokenText(tokens).trim()
        const baseId = slugify(text) || 'seccion'
        const occurrence = (usedIds.get(baseId) ?? 0) + 1
        const id = occurrence === 1 ? baseId : `${baseId}-${occurrence}`
        usedIds.set(baseId, occurrence)

        if (depth === 2) {
          toc.push({ id, text })
        } else if (depth === 3) {
          const parent = toc.at(-1)
          if (parent) {
            parent.children ??= []
            parent.children.push({ id, text })
          } else {
            toc.push({ id, text })
          }
        }

        return `<h${depth} id="${id}">${this.parser.parseInline(tokens)}</h${depth}>\n`
      }
    }
  })

  const rendered = marked.parse(content, { async: false }) as string
  return {
    html: DOMPurify.sanitize(rendered),
    toc
  }
}
