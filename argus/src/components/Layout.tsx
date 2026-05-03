import { NavLink, Outlet } from 'react-router-dom'

export default function Layout() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">A</div>
          <div className="brand-text">
            <div className="brand-name">Argus</div>
            <div className="brand-sub">Medication copilot</div>
          </div>
        </div>

        <nav className="nav">
          <NavLink to="/" end className="nav-link">
            <span className="nav-dot" />
            Chat
          </NavLink>
          <NavLink to="/medications" className="nav-link">
            <span className="nav-dot" />
            Medications
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="status-pill">
            <span className="status-dot" />
            Agent online
          </div>
        </div>
      </aside>

      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
