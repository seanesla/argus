import { useState } from 'react'
import { grantConsent } from '@/lib/consent'

const CHECKS = [
  'I understand Argus is a hackathon prototype, not a medical device, and does not replace medical advice.',
  "I understand my symptom and medication notes are sent to Google's Gemini API to power the chat. There is no Argus backend.",
  'I understand my data lives only in this browser (localStorage). Clearing site data deletes everything.',
] as const

export default function ConsentModal() {
  const [checked, setChecked] = useState<boolean[]>(() => CHECKS.map(() => false))
  const allChecked = checked.every(Boolean)

  function toggle(i: number) {
    setChecked((prev) => prev.map((v, j) => (j === i ? !v : v)))
  }

  function onAccept() {
    if (!allChecked) return
    grantConsent()
  }

  return (
    <div className="consent-overlay" role="dialog" aria-modal="true">
      <div className="consent-modal">
        <div className="consent-title">before you start</div>
        <p className="consent-lede">
          argus is a hackathon prototype. please read and confirm before logging
          anything.
        </p>
        <ul className="consent-list">
          {CHECKS.map((text, i) => (
            <li key={i} className="consent-item">
              <label>
                <input
                  type="checkbox"
                  checked={checked[i]}
                  onChange={() => toggle(i)}
                />
                <span>{text}</span>
              </label>
            </li>
          ))}
        </ul>
        <div className="consent-actions">
          <button
            type="button"
            className="composer-send"
            disabled={!allChecked}
            onClick={onAccept}
          >
            i understand — start using argus
          </button>
        </div>
      </div>
    </div>
  )
}
