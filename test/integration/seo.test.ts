import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { test } from 'node:test'
import { resolve } from 'node:path'

for (const value of ['false', 'true', undefined]) {
  test(`el build respeta la indexación con variable ${value ?? 'ausente'}`, { timeout: 30_000 }, async (t) => {
    const env = { ...process.env }
    delete env.NUXT_PUBLIC_SITE_INDEXABLE
    if (value !== undefined) env.NUXT_PUBLIC_SITE_INDEXABLE = value
    const server = spawn(process.execPath, [resolve('.output/server/index.mjs')], {
      env: {
        ...env,
        NODE_ENV: 'production',
        NITRO_HOST: '127.0.0.1',
        NITRO_PORT: '0',
        // Estas páginas no consultan la base; no usar credenciales reales.
        DATABASE_URL: 'mysql://seo:seo@127.0.0.1:1/seo',
        NUXT_SESSION_PASSWORD: 'seo-test-password-with-at-least-32-characters'
      },
      stdio: ['ignore', 'pipe', 'pipe']
    })
    t.after(async () => {
      if (server.exitCode !== null || server.signalCode !== null) return
      const exited = once(server, 'exit')
      server.kill('SIGTERM')
      await exited
    })

    const base = await new Promise<string>((resolveUrl, reject) => {
      let output = ''
      const timeout = setTimeout(() => reject(new Error('El servidor SEO no arrancó a tiempo')), 15_000)
      server.once('error', (error) => {
        clearTimeout(timeout)
        reject(error)
      })
      server.once('exit', (code) => {
        clearTimeout(timeout)
        reject(new Error(`El servidor SEO terminó antes de arrancar (${code})`))
      })
      server.stderr.on('data', (chunk: Buffer) => {
        output += chunk.toString()
      })
      server.stdout.on('data', (chunk: Buffer) => {
        output += chunk.toString()
        const url = output.match(/Listening on (http:\/\/127\.0\.0\.1:\d+)/)?.[1]
        if (url) {
          clearTimeout(timeout)
          resolveUrl(url)
        }
      })
    })

    const enabled = value === 'true'
    for (const path of ['/acerca-de', '/encuentros-regionales/formulario', '/auth/login']) {
      const response = await fetch(`${base}${path}`)
      assert.equal(response.status, 200, `Respuesta de ${path}`)
      assert.equal(response.headers.get('x-robots-tag'), enabled ? null : 'noindex, nofollow')
      const html = await response.text()
      const tags = html.match(/<meta\b[^>]*name="robots"[^>]*>/g) ?? []
      assert.equal(tags.length, 1, `Una única meta robots en ${path}`)
      const expected = enabled && path !== '/auth/login' ? 'index, follow' : 'noindex, nofollow'
      assert.equal(tags[0]?.includes(`content="${expected}"`), true, `Política SSR de ${path}`)
    }

    const robots = await fetch(`${base}/robots.txt`)
    assert.equal(robots.status, 200)
    const policy = await robots.text()
    assert.equal(policy.includes('Allow: /'), true)
    assert.equal(policy.includes('Disallow: /'), false)
  })
}
