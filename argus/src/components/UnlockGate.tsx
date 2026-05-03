import { useState, type ReactNode } from 'react'
import { destroyVault, setupAndUnlock, unlock, useVault } from '@/lib/useVault'

const MIN_PASSPHRASE_LENGTH = 8

export default function UnlockGate({ children }: { children: ReactNode }) {
  const { status } = useVault()

  if (status === 'loading') {
    return (
      <div className="vault-screen">
        <div className="vault-card">
          <p className="vault-loading">opening vault…</p>
        </div>
      </div>
    )
  }

  if (status === 'unlocked') return <>{children}</>

  return <UnlockForm isSetup={status === 'setup'} />
}

function UnlockForm({ isSetup }: { isSetup: boolean }) {
  const [pass, setPass] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (isSetup) {
      if (pass.length < MIN_PASSPHRASE_LENGTH) {
        setError(`passphrase must be at least ${MIN_PASSPHRASE_LENGTH} characters`)
        return
      }
      if (pass !== confirm) {
        setError('passphrases do not match')
        return
      }
    }

    setBusy(true)
    try {
      if (isSetup) {
        await setupAndUnlock(pass)
      } else {
        await unlock(pass)
      }
    } catch {
      setError(isSetup ? 'failed to create vault' : 'wrong passphrase')
    } finally {
      setBusy(false)
    }
  }

  function onReset() {
    const ok = window.confirm(
      'this will permanently delete the encrypted vault on this device. continue?',
    )
    if (!ok) return
    destroyVault()
  }

  return (
    <div className="vault-screen">
      <form className="vault-card" onSubmit={onSubmit}>
        <h1 className="vault-title">{isSetup ? 'set a passphrase' : 'unlock your vault'}</h1>
        <p className="vault-sub">
          {isSetup
            ? 'this encrypts your medications on this device only. forget it = data gone, no recovery.'
            : 'enter your passphrase to decrypt your medications.'}
        </p>

        <label className="vault-label">
          passphrase
          <input
            type="password"
            className="vault-input"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            autoFocus
            autoComplete={isSetup ? 'new-password' : 'current-password'}
            disabled={busy}
          />
        </label>

        {isSetup && (
          <label className="vault-label">
            confirm passphrase
            <input
              type="password"
              className="vault-input"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              disabled={busy}
            />
          </label>
        )}

        {error && <p className="vault-error">{error}</p>}

        <button type="submit" className="vault-submit" disabled={busy || !pass}>
          {busy ? 'working…' : isSetup ? 'create vault' : 'unlock'}
        </button>

        {!isSetup && (
          <button type="button" className="vault-reset" onClick={onReset}>
            forgot passphrase / start over
          </button>
        )}
      </form>
    </div>
  )
}
