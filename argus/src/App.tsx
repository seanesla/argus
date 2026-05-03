import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import UnlockGate from './components/UnlockGate'
import ChatPage from './pages/ChatPage'
import MedicationsPage from './pages/MedicationsPage'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <UnlockGate>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<ChatPage />} />
            <Route path="/medications" element={<MedicationsPage />} />
          </Route>
        </Routes>
      </UnlockGate>
    </BrowserRouter>
  )
}

export default App
