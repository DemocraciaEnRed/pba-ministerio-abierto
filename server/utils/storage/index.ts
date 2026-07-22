import type { StorageDriver } from './types'
import { LocalStorageDriver } from './local'
import { S3StorageDriver } from './s3'

let cachedDriver: StorageDriver | null = null

function createDriver(): StorageDriver {
  const config = useRuntimeConfig()
  const storage = config.storage

  if (storage.driver === 's3') {
    const s3 = storage.s3
    if (!s3.bucket || !s3.accessKeyId || !s3.secretAccessKey) {
      throw new Error('Storage driver "s3" requires bucket, accessKeyId and secretAccessKey')
    }
    return new S3StorageDriver({
      endpoint: s3.endpoint || undefined,
      region: s3.region,
      bucket: s3.bucket,
      accessKeyId: s3.accessKeyId,
      secretAccessKey: s3.secretAccessKey,
      prefix: s3.prefix || undefined,
      publicBaseUrl: s3.publicBaseUrl || undefined,
      forcePathStyle: s3.forcePathStyle === 'true'
    })
  }

  return new LocalStorageDriver({
    dir: storage.local.dir,
    publicPath: '/uploads'
  })
}

/** Devuelve el driver de storage configurado (singleton). */
export function useStorageDriver(): StorageDriver {
  if (!cachedDriver) {
    cachedDriver = createDriver()
  }
  return cachedDriver
}
