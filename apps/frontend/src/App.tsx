import { useEffect, useMemo, useState } from 'react'
import AppLayout from './components/layout/AppLayout'
import { apiGet, apiJson, getAreaFromPath, isPrivileged, type BootstrapState, type SessionUser, stripAreaPrefix, withArea } from './lib/api'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import VPSList from './pages/VPSList'
import CreateVPS from './pages/CreateVPS'
import VPSDetails from './pages/VPSDetails'
import Terminal from './pages/Terminal'
import RDPDesktop from './pages/RDPDesktop'
import Networks from './pages/Networks'
import Storage from './pages/Storage'
import SSHAccess from './pages/SSHAccess'
import Activity from './pages/Activity'
import Billing from './pages/Billing'
import APIKeys from './pages/APIKeys'
import Settings from './pages/Settings'
import Notifications from './pages/Notifications'
import { Error404, Error500 } from './pages/ErrorPages'

type PageName =
  | 'login' | 'register'
  | 'dashboard' | 'vps' | 'create-vps' | 'vps-details'
  | 'terminal' | 'rdp' | 'networks' | 'storage'
  | 'ssh' | 'activity' | 'billing' | 'api-keys'
  | 'settings' | 'notifications' | 'error-404' | 'error-500'

type RouteState = {
  page: PageName
  area: 'user' | 'admin'
  vpsId?: string
}

const defaultRoute: RouteState = { page: 'dashboard', area: 'user' }

function parseRoute(pathname: string): RouteState {
  const area = getAreaFromPath(pathname)
  const stripped = stripAreaPrefix(pathname).replace(/\/+$/, '') || '/'

  if (stripped === '/login') return { page: 'login', area }
  if (stripped === '/register') return { page: 'register', area }
  if (stripped === '/error-404') return { page: 'error-404', area }
  if (stripped === '/error-500') return { page: 'error-500', area }
  if (stripped.startsWith('/vps/')) return { page: 'vps-details', area, vpsId: stripped.split('/')[2] }

  const routeMap: Record<string, PageName> = {
    '/': 'dashboard',
    '/dashboard': 'dashboard',
    '/vps': 'vps',
    '/create-vps': 'create-vps',
    '/terminal': 'terminal',
    '/rdp': 'rdp',
    '/networks': 'networks',
    '/storage': 'storage',
    '/ssh': 'ssh',
    '/activity': 'activity',
    '/billing': 'billing',
    '/api-keys': 'api-keys',
    '/settings': 'settings',
    '/notifications': 'notifications',
  }

  return { page: routeMap[stripped] ?? 'dashboard', area }
}

function buildRoute(page: PageName, area: 'user' | 'admin', vpsId?: string) {
  const prefix = area === 'admin' ? '/admin' : ''
  switch (page) {
    case 'login':
      return '/login'
    case 'register':
      return '/admin/register'
    case 'dashboard':
      return `${prefix || ''}/`.replace(/\/{2,}/g, '/')
    case 'vps-details':
      return vpsId ? `${prefix || ''}/vps/${vpsId}`.replace(/\/{2,}/g, '/') : `${prefix || ''}/vps`
    case 'error-404':
    case 'error-500':
      return `${prefix || ''}/${page}`.replace(/\/{2,}/g, '/')
    default:
      return `${prefix || ''}/${page}`.replace(/\/{2,}/g, '/')
  }
}

export default function App() {
  const [route, setRoute] = useState<RouteState>(() => parseRoute(window.location.pathname))
  const [bootstrap, setBootstrap] = useState<BootstrapState | null>(null)
  const [user, setUser] = useState<SessionUser | null>(null)
  const [ready, setReady] = useState(false)
  const [selectedVpsId, setSelectedVpsId] = useState<string | undefined>(route.vpsId)

  const canAccessAdmin = isPrivileged(user?.role)
  const isAdminArea = route.area === 'admin'
  const rootForArea = useMemo(() => (route.area === 'admin' ? '/admin/' : '/'), [route.area])

  const syncRoute = (next: RouteState) => {
    const path = buildRoute(next.page, next.area, next.vpsId)
    window.history.pushState({}, '', path)
    setRoute(next)
    if (next.vpsId) setSelectedVpsId(next.vpsId)
  }

  const navigate = (target: string) => {
    const [pageName, vpsId] = target.split(':')
    const page = pageName as PageName
    const area = page === 'register' ? 'admin' : route.area
    syncRoute({ page, area, vpsId: vpsId || undefined })
  }

  const switchArea = (area: 'user' | 'admin') => {
    syncRoute({ page: 'dashboard', area })
  }

  const logout = async () => {
    try {
      await apiJson('/api/auth/logout', {}, 'POST')
    } finally {
      setUser(null)
      syncRoute({ page: bootstrap?.needsBootstrap ? 'register' : 'login', area: bootstrap?.needsBootstrap ? 'admin' : 'user' })
    }
  }

  useEffect(() => {
    const handlePop = () => {
      const next = parseRoute(window.location.pathname)
      setRoute(next)
      setSelectedVpsId(next.vpsId)
    }
    window.addEventListener('popstate', handlePop)
    return () => window.removeEventListener('popstate', handlePop)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const bootstrapState = await apiGet<BootstrapState>('/api/auth/bootstrap')
        if (cancelled) return
        setBootstrap(bootstrapState)

        try {
          const me = await apiGet<SessionUser>('/api/me')
          if (cancelled) return
          setUser(me)
        } catch {
          if (cancelled) return
          setUser(null)
        }

        const current = parseRoute(window.location.pathname)
        if (bootstrapState.needsBootstrap && current.page !== 'register') {
          syncRoute({ page: 'register', area: 'admin' })
        } else if (!bootstrapState.needsBootstrap && current.page === 'register') {
          syncRoute({ page: 'login', area: 'user' })
        } else {
          setRoute(current)
          setSelectedVpsId(current.vpsId)
        }
      } finally {
        if (!cancelled) setReady(true)
      }
    })()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!ready || !bootstrap) return

    if (!user && !['login', 'register'].includes(route.page)) {
      syncRoute({ page: bootstrap.needsBootstrap ? 'register' : 'login', area: bootstrap.needsBootstrap ? 'admin' : 'user' })
      return
    }

    if (user && ['login', 'register'].includes(route.page)) {
      syncRoute({ page: 'dashboard', area: canAccessAdmin && isAdminArea ? 'admin' : route.area })
      return
    }

    if (user && !canAccessAdmin && isAdminArea) {
      syncRoute({ page: 'dashboard', area: 'user' })
    }
  }, [bootstrap, canAccessAdmin, isAdminArea, ready, route.area, route.page, user])

  if (!ready || !bootstrap) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#07070f', color: '#e4e4f0' }}>
        <div className="vex-card-elevated" style={{ padding: 24, minWidth: 320 }}>
          Loading Vibe TO Vexpanel…
        </div>
      </div>
    )
  }

  if (!user) {
    if (bootstrap.needsBootstrap) {
      return (
        <Register
          navigate={navigate}
          area="admin"
          onSuccess={() => {
            apiGet<SessionUser>('/api/me').then(me => {
              setUser(me)
              syncRoute({ page: 'dashboard', area: 'admin' })
            }).catch(() => syncRoute({ page: 'dashboard', area: 'admin' }))
          }}
        />
      )
    }
    return (
      <Login
        navigate={navigate}
        area={route.area}
        onLogin={(_sessionUser, nextArea) => {
          apiGet<SessionUser>('/api/me').then(me => {
            setUser(me)
            syncRoute({ page: 'dashboard', area: nextArea ?? route.area })
          }).catch(() => syncRoute({ page: 'dashboard', area: nextArea ?? route.area }))
        }}
      />
    )
  }

  const pageContent = () => {
    switch (route.page) {
      case 'dashboard': return <Dashboard navigate={navigate} user={user} area={route.area} canAccessAdmin={canAccessAdmin} onAccessAdmin={() => switchArea('admin')} />
      case 'vps': return <VPSList navigate={navigate} user={user} area={route.area} />
      case 'create-vps': return <CreateVPS navigate={navigate} user={user} area={route.area} />
      case 'vps-details': return <VPSDetails navigate={navigate} user={user} area={route.area} vpsId={selectedVpsId} />
      case 'terminal': return <Terminal navigate={navigate} />
      case 'rdp': return <RDPDesktop navigate={navigate} />
      case 'networks': return <Networks navigate={navigate} />
      case 'storage': return <Storage navigate={navigate} />
      case 'ssh': return <SSHAccess navigate={navigate} />
      case 'activity': return <Activity navigate={navigate} />
      case 'billing': return <Billing navigate={navigate} />
      case 'api-keys': return <APIKeys navigate={navigate} />
      case 'settings': return <Settings navigate={navigate} />
      case 'notifications': return <Notifications navigate={navigate} />
      case 'error-404': return <Error404 navigate={navigate} />
      case 'error-500': return <Error500 navigate={navigate} />
      default: return <Dashboard navigate={navigate} user={user} area={route.area} canAccessAdmin={canAccessAdmin} onAccessAdmin={() => switchArea('admin')} />
    }
  }

  return (
    <AppLayout
      page={route.page}
      navigate={navigate}
      onLogout={logout}
      user={user}
      area={route.area}
      canAccessAdmin={canAccessAdmin}
      onSwitchArea={switchArea}
      rootPath={rootForArea}
    >
      {route.page === 'terminal'
        ? <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>{pageContent()}</div>
        : pageContent()}
    </AppLayout>
  )
}
