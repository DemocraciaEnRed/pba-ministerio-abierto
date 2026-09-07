import { Marked, type Token, type Tokens, type TokenizerAndRendererExtension } from 'marked'
import DOMPurify from 'isomorphic-dompurify'
import {
  YOUTUBE_EMBED_URL_PATTERN,
  buildYoutubeEmbedUrl,
  extractYoutubeVideoId
} from '#shared/media/youtube'

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

// Sintaxis que emite el nodo `youtube` de Tiptap al serializar a Markdown:
// `:::youtube {src="https://www.youtube.com/watch?v=ID" start="12"} :::`
const YOUTUBE_BLOCK_RULE = /^:::youtube(?:[ \t]+\{([^}]*)\})?[ \t]*:::(?:\n+|$)/

function attributeValue(attrString: string, name: string): string | null {
  return new RegExp(`(?:^|\\s)${name}\\s*=\\s*"([^"]*)"`).exec(attrString)?.[1] ?? null
}

interface YoutubeToken extends Tokens.Generic {
  type: 'youtubeEmbed'
  raw: string
  embedUrl: string
}

const youtubeExtension: TokenizerAndRendererExtension = {
  name: 'youtubeEmbed',
  level: 'block',
  start: (src: string) => src.indexOf(':::youtube'),
  tokenizer(src: string) {
    const match = YOUTUBE_BLOCK_RULE.exec(src)
    if (!match) return undefined

    const attrString = match[1] ?? ''
    const videoId = extractYoutubeVideoId(attributeValue(attrString, 'src'))
    if (!videoId) return undefined

    const start = Number.parseInt(attributeValue(attrString, 'start') ?? '', 10)

    return {
      type: 'youtubeEmbed',
      raw: match[0],
      embedUrl: buildYoutubeEmbedUrl(videoId, Number.isNaN(start) ? null : start)
    } satisfies YoutubeToken
  },
  renderer(token) {
    const { embedUrl } = token as YoutubeToken
    return `<div class="not-prose my-6 aspect-video w-full overflow-hidden rounded-lg bg-black"><iframe src="${embedUrl}" title="Video de YouTube" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen class="h-full w-full border-0"></iframe></div>\n`
  }
}

// Frontera de seguridad: DOMPurify acepta iframes (ver `sanitize` más abajo),
// así que descartamos cualquiera que no sea un embed de YouTube.
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.nodeName !== 'IFRAME') return
  if (!YOUTUBE_EMBED_URL_PATTERN.test(node.getAttribute('src') ?? '')) {
    node.remove()
  }
})

export function parseMarkdown(content: string | null | undefined): ParsedMarkdown {
  if (!content) return { html: '', toc: [] }

  const marked = new Marked()
  const toc: MarkdownTocLink[] = []
  const usedIds = new Map<string, number>()

  marked.use({
    extensions: [youtubeExtension],
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
    html: DOMPurify.sanitize(rendered, {
      ADD_TAGS: ['iframe'],
      ADD_ATTR: ['allow', 'allowfullscreen', 'loading', 'referrerpolicy']
    }),
    toc
  }
}
