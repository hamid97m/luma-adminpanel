import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { getToken } from './api'
import Layout from './components/Layout'
import Login from './screens/Login'
import Dashboard from './screens/Dashboard'
import Users from './screens/Users'
import UserDetail from './screens/UserDetail'
import UserNew from './screens/UserNew'
import Chats from './screens/Chats'
import ChatView from './screens/ChatView'
import Reports from './screens/Reports'
import ReportDetail from './screens/ReportDetail'
import Support from './screens/Support'
import SupportDetail from './screens/SupportDetail'
import Gifts from './screens/Gifts'

function RequireAuth({ children }: { children: ReactNode }) {
  if (!getToken()) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<RequireAuth><Layout /></RequireAuth>}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/users" element={<Users />} />
          <Route path="/users/new" element={<UserNew />} />
          <Route path="/users/:id" element={<UserDetail />} />
          <Route path="/chats" element={<Chats />} />
          <Route path="/chats/:matchId" element={<ChatView />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/reports/:userId" element={<ReportDetail />} />
          <Route path="/support" element={<Support />} />
          <Route path="/support/:id" element={<SupportDetail />} />
          <Route path="/gifts" element={<Gifts />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
