import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { clearToken } from '../api'

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/users', label: 'Users' },
  { to: '/users/new', label: 'New User' },
  { to: '/chats', label: 'Chats' },
]

export default function Layout() {
  const navigate = useNavigate()
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
                `block rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-slate-700 text-white' : 'hover:bg-slate-800'}`
              }
            >
              {l.label}
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
