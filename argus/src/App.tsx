import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import ChatPage from './pages/ChatPage'
import MedicationsPage from './pages/MedicationsPage'
import PatternsPage from './pages/PatternsPage'
import './App.css'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<ChatPage />} />
          <Route path="/patterns" element={<PatternsPage />} />
          <Route path="/medications" element={<MedicationsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
