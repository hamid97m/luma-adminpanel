import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { api, clearToken } from '../api'

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/users', label: 'Users' },
  { to: '/users/new', label: 'New User' },
  { to: '/chats', label: 'Chats' },
  { to: '/reports', label: 'Reports' },
  { to: '/support', label: 'Support' },
  { to: '/gifts', label: 'Gifts' },
  { to: '/premium', label: 'Premium' },
  { to: '/bot', label: 'Bot' },
  { to: '/uploads', label: 'Upload image' },
]

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [pendingReports, setPendingReports] = useState(0)
  const [needsReply, setNeedsReply] = useState(0)

  useEffect(() => {
    api.reports.list({ status: 'pending', page: 1 })
      .then((d) => setPendingReports(d.total))
      .catch(() => {})
  }, [location.pathname])

  useEffect(() => {
    api.support.list({ status: 'needs_reply', page: 1 })
      .then((d) => setNeedsReply(d.total))
      .catch(() => {})
  }, [location.pathname])

  const [fakeUnread, setFakeUnread] = useState(0)

  useEffect(() => {
    api.chats.unreadCount()
      .then((d) => setFakeUnread(d.count))
      .catch(() => {})
  }, [location.pathname])

  return (
    <div className="min-h-screen flex bg-slate-100">
      <aside className="w-56 bg-slate-900 text-slate-200 flex flex-col">
        <div className="px-5 py-4 text-lg font-semibold text-white">Luma Admin</div>
        <nav className="flex-1 px-2 space-y-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/users'}
              className={({ isActive }) =>
                `flex items-center justify-between rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-slate-700 text-white' : 'hover:bg-slate-800'}`
              }
            >
              <span>{l.label}</span>
              {l.to === '/reports' && pendingReports > 0 && (
                <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-semibold text-white bg-red-600 rounded-full">
                  {pendingReports}
                </span>
              )}
              {l.to === '/support' && needsReply > 0 && (
                <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-semibold text-white bg-red-600 rounded-full">
                  {needsReply}
                </span>
              )}
              {l.to === '/bot' && fakeUnread > 0 && (
                <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-semibold text-white bg-red-600 rounded-full">
                  {fakeUnread}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={() => { clearToken(); navigate('/login') }}
          className="m-3 rounded-lg px-3 py-2 text-sm text-left hover:bg-slate-800"
        >
          Log out
        </button>
      </aside>
      <main className="flex-1 p-6 overflow-x-auto">
        <Outlet />
      </main>
    </div>
  )
}
