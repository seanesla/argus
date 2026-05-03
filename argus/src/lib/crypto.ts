const PBKDF2_ITERATIONS = 600_000
const SALT_BYTES = 16
const IV_BYTES = 12

const enc = new TextEncoder()
const dec = new TextDecoder()

function allocBytes(n: number): Uint8Array<ArrayBuffer> {
  return new Uint8Array(new ArrayBuffer(n))
}

function fromBuffer(buf: ArrayBuffer): Uint8Array<ArrayBuffer> {
  return new Uint8Array(buf)
}

export function randomSalt(): Uint8Array<ArrayBuffer> {
  const arr = allocBytes(SALT_BYTES)
  crypto.getRandomValues(arr)
  return arr
}

function randomIV(): Uint8Array<ArrayBuffer> {
  const arr = allocBytes(IV_BYTES)
  crypto.getRandomValues(arr)
  return arr
}

export function bytesToB64(bytes: Uint8Array<ArrayBuffer>): string {
  let s = ''
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i])
  return btoa(s)
}

export function b64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const s = atob(b64)
  const out = allocBytes(s.length)
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i)
  return out
}

function encodeUtf8(s: string): Uint8Array<ArrayBuffer> {
  const view = enc.encode(s)
  // Re-wrap into an ArrayBuffer-typed view to satisfy strict BufferSource.
  const out = allocBytes(view.byteLength)
  out.set(view)
  return out
}

export async function deriveKey(
  passphrase: string,
  salt: Uint8Array<ArrayBuffer>,
): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    encodeUtf8(passphrase),
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

export async function encryptJSON<T>(
  key: CryptoKey,
  value: T,
): Promise<{ iv: string; ciphertext: string }> {
  const iv = randomIV()
  const plaintext = encodeUtf8(JSON.stringify(value))
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext)
  return { iv: bytesToB64(iv), ciphertext: bytesToB64(fromBuffer(ciphertext)) }
}

export async function decryptJSON<T>(
  key: CryptoKey,
  ivB64: string,
  ciphertextB64: string,
): Promise<T> {
  const iv = b64ToBytes(ivB64)
  const ciphertext = b64ToBytes(ciphertextB64)
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
  return JSON.parse(dec.decode(plaintext)) as T
}
