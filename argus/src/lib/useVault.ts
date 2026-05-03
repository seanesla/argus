import { useSyncExternalStore } from 'react'
import type { Medication } from '@/types'
import * as vault from './vault'

export type VaultStatus = 'loading' | 'setup' | 'locked' | 'unlocked'

interface VaultState {
  status: VaultStatus
  meds: Medication[]
}

let key: CryptoKey | null = null
let salt: Uint8Array<ArrayBuffer> | null = null
let state: VaultState = { status: 'loading', meds: [] }

const subscribers = new Set<() => void>()

function emit() {
  for (const fn of subscribers) fn()
}

function setState(next: VaultState) {
  state = next
  emit()
}

function subscribe(fn: () => void) {
  subscribers.add(fn)
  return () => {
    subscribers.delete(fn)
  }
}

function getSnapshot(): VaultState {
  return state
}

queueMicrotask(() => {
  setState({
    status: vault.vaultExists() ? 'locked' : 'setup',
    meds: [],
  })
})

export async function setupAndUnlock(
  passphrase: string,
  initialMeds: Medication[] = [],
): Promise<void> {
  const created = await vault.createVault(passphrase, initialMeds)
  key = created.key
  salt = created.salt
  setState({ status: 'unlocked', meds: initialMeds })
}

export async function unlock(passphrase: string): Promise<void> {
  const opened = await vault.unlockVault(passphrase)
  key = opened.key
  salt = opened.salt
  setState({ status: 'unlocked', meds: opened.meds })
}

export function lock(): void {
  key = null
  salt = null
  setState({ status: 'locked', meds: [] })
}

export function destroyVault(): void {
  vault.clearVault()
  key = null
  salt = null
  setState({ status: 'setup', meds: [] })
}

async function persist(meds: Medication[]) {
  if (!key || !salt) throw new Error('vault is locked')
  await vault.saveMeds(key, salt, meds)
  setState({ status: 'unlocked', meds })
}

export async function setMeds(meds: Medication[]): Promise<void> {
  await persist(meds)
}

export async function addMed(med: Medication): Promise<void> {
  await persist([...state.meds, med])
}

export async function removeMed(id: string): Promise<void> {
  await persist(state.meds.filter((m) => m.id !== id))
}

export async function updateMed(med: Medication): Promise<void> {
  await persist(state.meds.map((m) => (m.id === med.id ? med : m)))
}

export function useVault(): VaultState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
