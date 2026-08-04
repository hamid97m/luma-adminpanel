import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { getToken } from './api'
import Login from './screens/Login'

function RequireAuth({ children }: { children: ReactNode }) {
  if (!getToken()) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <RequireAuth>
              <Routes>
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </RequireAuth>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
