import type { Medication } from '@/types'
import {
  bytesToB64,
  b64ToBytes,
  decryptJSON,
  deriveKey,
  encryptJSON,
  randomSalt,
} from './crypto'

const VAULT_KEY = 'argus.vault.v1'

interface VaultBlob {
  v: 1
  salt: string
  iv: string
  ciphertext: string
}

function readBlob(): VaultBlob | null {
  const raw = localStorage.getItem(VAULT_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as VaultBlob
    if (parsed.v !== 1 || !parsed.salt || !parsed.iv || !parsed.ciphertext) return null
    return parsed
  } catch {
    return null
  }
}

function writeBlob(blob: VaultBlob): void {
  localStorage.setItem(VAULT_KEY, JSON.stringify(blob))
}

export function vaultExists(): boolean {
  return readBlob() !== null
}

export function clearVault(): void {
  localStorage.removeItem(VAULT_KEY)
}

export async function createVault(
  passphrase: string,
  meds: Medication[],
): Promise<{ key: CryptoKey; salt: Uint8Array<ArrayBuffer> }> {
  const salt = randomSalt()
  const key = await deriveKey(passphrase, salt)
  const { iv, ciphertext } = await encryptJSON(key, meds)
  writeBlob({ v: 1, salt: bytesToB64(salt), iv, ciphertext })
  return { key, salt }
}

export async function unlockVault(
  passphrase: string,
): Promise<{ key: CryptoKey; meds: Medication[]; salt: Uint8Array<ArrayBuffer> }> {
  const blob = readBlob()
  if (!blob) throw new Error('no vault to unlock')
  const salt = b64ToBytes(blob.salt)
  const key = await deriveKey(passphrase, salt)
  const meds = await decryptJSON<Medication[]>(key, blob.iv, blob.ciphertext)
  return { key, meds, salt }
}

export async function saveMeds(
  key: CryptoKey,
  salt: Uint8Array<ArrayBuffer>,
  meds: Medication[],
): Promise<void> {
  const { iv, ciphertext } = await encryptJSON(key, meds)
  writeBlob({ v: 1, salt: bytesToB64(salt), iv, ciphertext })
}
