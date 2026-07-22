import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import type { StorageDriver, PutObjectInput } from './types'

export interface S3DriverConfig {
  endpoint?: string
  region: string
  bucket: string
  accessKeyId: string
  secretAccessKey: string
  /** Prefijo base opcional dentro del bucket. */
  prefix?: string
  /** Base URL pública (CDN o bucket público). Si está vacía, se usan URLs presignadas. */
  publicBaseUrl?: string
  /** Necesario para algunos proveedores S3-compatibles. */
  forcePathStyle?: boolean
}

const DEFAULT_PRESIGN_TTL = 60 * 15 // 15 minutos

/** Driver S3 / compatible (AWS S3, DigitalOcean Spaces, MinIO, etc.). */
export class S3StorageDriver implements StorageDriver {
  readonly name = 's3' as const
  private readonly client: S3Client
  private readonly bucket: string
  private readonly prefix?: string
  private readonly publicBaseUrl?: string

  constructor(config: S3DriverConfig) {
    this.bucket = config.bucket
    this.prefix = normalizePrefix(config.prefix)
    this.publicBaseUrl = config.publicBaseUrl?.replace(/\/$/, '') || undefined
    this.client = new S3Client({
      region: config.region,
      endpoint: config.endpoint || undefined,
      forcePathStyle: config.forcePathStyle ?? false,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey
      }
    })
  }

  private normalizeKey(key: string): string {
    return key.replace(/^\/+/, '')
  }

  private resolveObjectKey(key: string): string {
    const normalizedKey = this.normalizeKey(key)
    return this.prefix ? `${this.prefix}/${normalizedKey}` : normalizedKey
  }

  async put(input: PutObjectInput): Promise<{ key: string }> {
    const key = this.normalizeKey(input.key)
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: this.resolveObjectKey(key),
      Body: input.body,
      ContentType: input.contentType,
      ACL: input.public === false ? 'private' : 'public-read'
    }))
    return { key }
  }

  async get(key: string): Promise<Buffer | null> {
    try {
      const result = await this.client.send(new GetObjectCommand({
        Bucket: this.bucket,
        Key: this.resolveObjectKey(key)
      }))
      const bytes = await result.Body?.transformToByteArray()
      return bytes ? Buffer.from(bytes) : null
    } catch (error) {
      if ((error as { name?: string }).name === 'NoSuchKey') return null
      throw error
    }
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: this.resolveObjectKey(key)
    }))
  }

  async url(key: string, options?: { expiresIn?: number }): Promise<string> {
    const normalizedKey = this.normalizeKey(key)
    const objectKey = this.resolveObjectKey(normalizedKey)
    if (this.publicBaseUrl) {
      return `${this.publicBaseUrl}/${objectKey}`
    }
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: objectKey }),
      { expiresIn: options?.expiresIn ?? DEFAULT_PRESIGN_TTL }
    )
  }
}

function normalizePrefix(prefix?: string): string | undefined {
  const normalizedPrefix = prefix?.replace(/^\/+|\/+$/g, '')
  return normalizedPrefix || undefined
}
