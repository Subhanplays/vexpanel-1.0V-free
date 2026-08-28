import { useState } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import type { SessionUser } from '../../lib/api'

interface AppLayoutProps {
  page: string
  navigate: (p: string) => void
  onLogout: () => void
  children: React.ReactNode
  user: SessionUser
  area: 'user' | 'admin'
  canAccessAdmin: boolean
  onSwitchArea: (area: 'user' | 'admin') => void
  rootPath: string
}

export default function AppLayout({ page, navigate, onLogout, children, user, area, canAccessAdmin, onSwitchArea, rootPath }: AppLayoutProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex h-full overflow-hidden" style={{ background: '#07070f' }}>
      <Sidebar
        page={page}
        navigate={navigate}
        onLogout={onLogout}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        user={user}
        area={area}
        canAccessAdmin={canAccessAdmin}
        onSwitchArea={onSwitchArea}
      />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar
          page={page}
          navigate={navigate}
          onLogout={onLogout}
          user={user}
          area={area}
          canAccessAdmin={canAccessAdmin}
          onSwitchArea={onSwitchArea}
          rootPath={rootPath}
        />
        <main className="flex-1 overflow-y-auto" style={{ background: '#07070f' }}>
          <div className="fade-in h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

