import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'

export function AppShell() {
  return (
    <div className="broto-app">
      <Sidebar />
      <main className="broto-app__main">
        <Outlet />
      </main>
    </div>
  )
}
