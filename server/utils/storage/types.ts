export interface PutObjectInput {
  /** Key/ruta relativa del objeto dentro del storage (ej. 'assets/foo.png'). */
  key: string
  body: Buffer | Uint8Array | string
  contentType?: string
  /** Visibilidad del objeto. Por defecto es público (`public-read` en S3). */
  public?: boolean
}

export interface StorageDriver {
  readonly name: 'local' | 's3'
  /** Guarda un objeto y devuelve su key. */
  put(input: PutObjectInput): Promise<{ key: string }>
  /** Lee un objeto. Devuelve null si no existe. */
  get(key: string): Promise<Buffer | null>
  /** Elimina un objeto. No falla si no existe. */
  delete(key: string): Promise<void>
  /** Devuelve una URL para acceder al objeto (pública o presignada). */
  url(key: string, options?: { expiresIn?: number }): Promise<string>
}
