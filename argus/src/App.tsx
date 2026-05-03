import { Routes, Route, Link } from 'react-router-dom'
import { useStore } from '@/lib/store'
import Dashboard from '@/pages/Dashboard'
import Insights from '@/pages/Insights'
import Meds from '@/pages/Meds'

function App() {
  const { hasData } = useStore()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-primary">👁️ Argus</div>
              <p className="text-sm text-muted-foreground">Your AI medication watcher</p>
            </div>
            <nav className="flex gap-4">
              <Link
                to="/"
                className="rounded px-3 py-2 text-sm font-medium hover:bg-muted"
              >
                Dashboard
              </Link>
              <Link
                to="/insights"
                className="rounded px-3 py-2 text-sm font-medium hover:bg-muted"
              >
                Insights
              </Link>
              <Link to="/meds" className="rounded px-3 py-2 text-sm font-medium hover:bg-muted">
                Medications
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Demo data banner */}
      {!hasData && (
        <div className="border-b bg-blue-50 px-4 py-3 text-center text-sm text-blue-900">
          <p>
            No data yet. Click{' '}
            <button
              onClick={() => useStore.getState().loadSeedData()}
              className="font-semibold underline hover:text-blue-700"
            >
              Load Demo Data
            </button>{' '}
            to see a sample medication tracking history.
          </p>
        </div>
      )}

      {/* Main content */}
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/meds" element={<Meds />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
