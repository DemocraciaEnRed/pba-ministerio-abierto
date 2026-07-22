import { resolve, dirname, isAbsolute, sep } from 'node:path'
import { mkdir, writeFile, readFile, unlink } from 'node:fs/promises'
import type { StorageDriver, PutObjectInput } from './types'

export interface LocalDriverConfig {
  /** Directorio base en disco donde se guardan los objetos. */
  dir: string
  /** Prefijo de URL público bajo el que se sirven los objetos. */
  publicPath: string
}

/** Driver de filesystem local. */
export class LocalStorageDriver implements StorageDriver {
  readonly name = 'local' as const
  private readonly baseDir: string
  private readonly publicPath: string

  constructor(config: LocalDriverConfig) {
    this.baseDir = resolve(config.dir)
    this.publicPath = config.publicPath.replace(/\/$/, '')
  }

  /** Resuelve la ruta absoluta de una key impidiendo path traversal. */
  private resolveKey(key: string): string {
    const normalizedKey = key.replace(/^\/+/, '')
    const fullPath = resolve(this.baseDir, normalizedKey)
    if (fullPath !== this.baseDir && !fullPath.startsWith(this.baseDir + sep)) {
      throw new Error(`Invalid storage key: ${key}`)
    }
    if (isAbsolute(normalizedKey)) {
      throw new Error(`Invalid storage key: ${key}`)
    }
    return fullPath
  }

  async put(input: PutObjectInput): Promise<{ key: string }> {
    const fullPath = this.resolveKey(input.key)
    await mkdir(dirname(fullPath), { recursive: true })
    await writeFile(fullPath, input.body)
    return { key: input.key.replace(/^\/+/, '') }
  }

  async get(key: string): Promise<Buffer | null> {
    try {
      return await readFile(this.resolveKey(key))
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
      throw error
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await unlink(this.resolveKey(key))
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    }
  }

  async url(key: string): Promise<string> {
    return `${this.publicPath}/${key.replace(/^\/+/, '')}`
  }
}
