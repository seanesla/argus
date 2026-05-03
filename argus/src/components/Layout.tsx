import { NavLink, Outlet } from 'react-router-dom'
import AccentPicker from './AccentPicker'
import FaultyTerminal from './FaultyTerminal'
import ModeToggle from './ModeToggle'
import RefillBanner from './RefillBanner'
import { ACCENT_HEX, useAccent } from '@/lib/accent'

function EyeMark() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12 C 5 6, 19 6, 22 12 C 19 18, 5 18, 2 12 Z" />
      <circle cx="12" cy="12" r="3.5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export default function Layout() {
  const accent = useAccent()

  return (
    <>
      {/* Background WebGL terminal — sits behind everything, tinted to current accent */}
      <div className="bg-terminal" aria-hidden="true">
        <FaultyTerminal
          scale={1.6}
          gridMul={[2, 1]}
          digitSize={1.2}
          timeScale={0.4}
          scanlineIntensity={0.5}
          glitchAmount={0.6}
          flickerAmount={0.35}
          noiseAmp={0.6}
          chromaticAberration={0}
          dither={0}
          curvature={0.08}
          tint={ACCENT_HEX[accent]}
          mouseReact
          mouseStrength={0.15}
          pageLoadAnimation
          brightness={0.22}
        />
        <div className="bg-terminal-veil" />
      </div>

      <div className="app-shell">
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-mark">
              <EyeMark />
            </div>
            <div className="brand-text">
              <div className="brand-name">a r g u s</div>
              <div className="brand-sub">medication copilot</div>
            </div>
          </div>

          <nav className="nav">
            <NavLink to="/" end className="nav-link">
              <span className="nav-dot" />
              chat
            </NavLink>
            <NavLink to="/medications" className="nav-link">
              <span className="nav-dot" />
              medications
            </NavLink>
          </nav>

          <div className="sidebar-footer">
            <AccentPicker />
            <ModeToggle />
            <div className="status-pill">
              <span className="status-dot" />
              agent online
            </div>
          </div>
        </aside>

        <main className="main">
          <RefillBanner />
          <Outlet />
        </main>
      </div>
    </>
  )
}
