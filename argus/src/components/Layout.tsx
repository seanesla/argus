import { NavLink, Outlet } from 'react-router-dom'
import AccentPicker from './AccentPicker'

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
  return (
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
          <div className="status-pill">
            <span className="status-dot" />
            agent online
          </div>
        </div>
      </aside>

      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
