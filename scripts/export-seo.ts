import { readdir, readFile, writeFile } from 'node:fs/promises'
import { resolve, relative } from 'node:path'
import ts from 'typescript'

const root = resolve(import.meta.dirname, '..')
const pagesDir = resolve(root, 'app/pages')
const seoSource = ts.createSourceFile(
  'useSeo.ts',
  await readFile(resolve(root, 'app/composables/useSeo.ts'), 'utf8'),
  ts.ScriptTarget.Latest,
  true
)

function constant(name: string): string {
  for (const statement of seoSource.statements) {
    if (!ts.isVariableStatement(statement)) continue
    for (const declaration of statement.declarationList.declarations) {
      if (declaration.name.getText(seoSource) === name && declaration.initializer && ts.isStringLiteral(declaration.initializer)) {
        return declaration.initializer.text
      }
    }
  }
  throw new Error(`No se encontró la constante SEO ${name}`)
}

const siteName = constant('SITE_NAME')
const defaultDescription = constant('DEFAULT_SEO_DESCRIPTION')

async function pageFiles(dir: string): Promise<string[]> {
  const files: string[] = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = resolve(dir, entry.name)
    if (entry.isDirectory()) files.push(...await pageFiles(path))
    else if (entry.name.endsWith('.vue')) files.push(path)
  }
  return files.sort()
}

function unwrap(expression: ts.Expression): ts.Expression {
  if (ts.isParenthesizedExpression(expression)) return unwrap(expression.expression)
  if (ts.isArrowFunction(expression) && !ts.isBlock(expression.body)) return unwrap(expression.body)
  return expression
}

function text(expression: ts.Expression | undefined, fallback: string): string {
  if (!expression) return fallback
  const value = unwrap(expression)
  if (ts.isStringLiteral(value) || ts.isNoSubstitutionTemplateLiteral(value)) return value.text || fallback
  return `Dinámico: ${value.getText().replace(/\s+/g, ' ')}`
}

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`
}

const rows: string[][] = [[
  'ruta', 'archivo', 'tipo', 'indexacion_actual', 'titulo_actual',
  'descripcion_actual', 'origen', 'titulo_propuesto', 'descripcion_propuesta', 'observaciones'
]]
const routes = new Set<string>()

for (const file of await pageFiles(pagesDir)) {
  const content = await readFile(file, 'utf8')
  const script = content.match(/<script\b[^>]*>([\s\S]*?)<\/script>/)?.[1] ?? ''
  const source = ts.createSourceFile(file, script, ts.ScriptTarget.Latest, true)
  const calls: ts.CallExpression[] = []
  function visit(node: ts.Node) {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)
      && ['usePageSeo', 'usePrivatePageSeo'].includes(node.expression.text)) calls.push(node)
    ts.forEachChild(node, visit)
  }
  visit(source)
  if (calls.length > 1 || /\buse(?:SeoMeta|Head)\s*\(/.test(script)) {
    throw new Error(`Revisá manualmente el SEO de ${file}: configuración no soportada`)
  }
  const route = '/' + relative(pagesDir, file).replace(/\.vue$/, '')
    .replace(/(^|\/)index$/, '').replace(/\[([^\]]+)\]/g, ':$1')
  if (routes.has(route)) throw new Error(`Ruta duplicada: ${route}`)
  routes.add(route)

  const call = calls[0]
  const privatePage = call?.expression.getText(source) === 'usePrivatePageSeo'
  const input = call?.arguments[0]
  const object = input ? unwrap(input) : undefined
  if (call && (!input || (!privatePage && (!object || !ts.isObjectLiteralExpression(object))))) {
    throw new Error(`Revisá manualmente el SEO de ${file}: argumento no soportado`)
  }
  const properties = new Map<string, ts.Expression>()
  if (object && ts.isObjectLiteralExpression(object)) {
    for (const property of object.properties) {
      if (!ts.isPropertyAssignment(property)) throw new Error(`Propiedad SEO no soportada en ${file}`)
      properties.set(property.name.getText(source), property.initializer)
    }
  }
  const noindex = privatePage || properties.get('noindex')?.kind === ts.SyntaxKind.TrueKeyword
  const title = text(privatePage ? input : properties.get('title'), '')
  const description = text(properties.get('description'), defaultDescription)
  const dynamic = title.startsWith('Dinámico:') || description.startsWith('Dinámico:')
  const notes = [
    'La indexación indicada corresponde a producción con NUXT_PUBLIC_SITE_INDEXABLE=true; staging siempre usa noindex.',
    !call ? 'Sin SEO propio: hereda título y descripción globales.' : '',
    privatePage ? 'Página privada o de autenticación; hereda la descripción global.' : '',
    dynamic ? `Plantilla sin consultar la base de datos. Título vacío: ${siteName}. Descripción vacía: ${defaultDescription}. toPlainText elimina HTML/Markdown y recorta a 160 caracteres.` : '',
    route.includes(':') ? 'Ruta parametrizada: no representa una URL concreta.' : ''
  ].filter(Boolean).join(' ')

  rows.push([
    route, relative(root, file), privatePage ? 'Privada' : noindex ? 'Técnica' : 'Pública',
    noindex ? 'noindex, nofollow' : 'index, follow',
    title ? `${title} · ${siteName}` : siteName,
    description, !call ? 'Fallback global' : dynamic ? 'Datos + fallback global' : 'Texto fijo + fallback global',
    '', '', notes
  ])
}

const output = resolve(root, 'seo-review.csv')
await writeFile(output, '\uFEFF' + rows.map(row => row.map(csvCell).join(',')).join('\r\n') + '\r\n')
console.log(`CSV generado: ${relative(root, output)} (${rows.length - 1} rutas)`)
