import { randomBytes, createHash } from 'node:crypto'
import type { VerificationTokenType } from '../../../prisma/generated/enums'

const TOKEN_BYTES = 32
const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24 // 24 horas

function hashToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex')
}

export interface CreatedToken {
  /** Token crudo, se envía al usuario. Nunca se persiste. */
  token: string
}

export interface CreateVerificationTokenOptions {
  ttlMs?: number
  /** Email pendiente asociado al token (solo para cambios de correo). */
  newEmail?: string
}

/**
 * Crea un token de verificación para un usuario. Persiste únicamente el hash
 * SHA-256 del token; el valor crudo se devuelve para enviarlo por email.
 * Invalida tokens previos del mismo tipo no consumidos.
 */
export async function createVerificationToken(
  userId: number,
  type: VerificationTokenType,
  options: CreateVerificationTokenOptions = {}
): Promise<CreatedToken> {
  const { ttlMs = DEFAULT_TTL_MS, newEmail } = options
  const token = randomBytes(TOKEN_BYTES).toString('hex')
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + ttlMs)

  await prisma.$transaction([
    prisma.verificationToken.deleteMany({
      where: { userId, type, consumedAt: null }
    }),
    prisma.verificationToken.create({
      data: { userId, type, tokenHash, expiresAt, newEmail: newEmail ?? null }
    })
  ])

  return { token }
}

/**
 * Consume un token: valida que exista, no esté expirado ni consumido, lo marca
 * como consumido y devuelve el userId asociado (y el email pendiente, si aplica).
 * Devuelve null si es inválido.
 */
export async function consumeVerificationToken(
  rawToken: string,
  type: VerificationTokenType
): Promise<{ userId: number, newEmail: string | null } | null> {
  const tokenHash = hashToken(rawToken)

  const record = await prisma.verificationToken.findUnique({
    where: { tokenHash }
  })

  if (
    !record
    || record.type !== type
    || record.consumedAt !== null
    || record.expiresAt.getTime() < Date.now()
  ) {
    return null
  }

  await prisma.verificationToken.update({
    where: { id: record.id },
    data: { consumedAt: new Date() }
  })

  return { userId: record.userId, newEmail: record.newEmail }
}
