import { useState } from 'react'
import type { SessionUser } from '../../lib/api'

interface TopbarProps {
  page: string
  navigate: (p: string) => void
  onLogout: () => void
  user: SessionUser
  area: 'user' | 'admin'
  canAccessAdmin: boolean
  onSwitchArea: (area: 'user' | 'admin') => void
  rootPath: string
}

const pageTitles: Record<string, string> = {
  dashboard: 'Dashboard',
  vps: 'VPS Instances',
  'create-vps': 'Create VPS',
  'vps-details': 'VPS Details',
  rdp: 'RDP / Desktop',
  networks: 'Networks',
  storage: 'Storage',
  terminal: 'Web Terminal',
  ssh: 'SSH Access',
  activity: 'Activity Log',
  billing: 'Billing',
  'api-keys': 'API Keys',
  settings: 'Settings',
  notifications: 'Notifications',
  'error-404': 'Page Not Found',
  'error-500': 'Server Error',
}

const pageActions: Record<string, { label: string; page?: string }> = {
  dashboard: { label: '+ Create VPS', page: 'create-vps' },
  vps: { label: '+ Create VPS', page: 'create-vps' },
  networks: { label: '+ Create Network' },
  storage: { label: '+ Create Volume' },
  'api-keys': { label: '+ New API Key' },
  ssh: { label: '+ Add SSH Key' },
}

export default function Topbar({ page, navigate, onLogout, user, area, canAccessAdmin, onSwitchArea }: TopbarProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [searchVal, setSearchVal] = useState('')
  const title = pageTitles[page] || page
  const action = pageActions[page]
  const showAction = action && (area === 'admin' || canAccessAdmin || action.page !== 'create-vps')

  return (
    <div
      className="flex-shrink-0 flex items-center gap-4 px-6"
      style={{
        height: 60,
        background: '#080811',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'relative',
        zIndex: 10,
      }}
    >
      <div className="flex-1">
        <h1 style={{ fontSize: 15.5, fontWeight: 600, color: '#e4e4f0', margin: 0 }}>{title}</h1>
      </div>

      {['dashboard', 'vps', 'activity'].includes(page) && (
        <div style={{ position: 'relative', width: 200 }}>
          <div style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#4b4b6a', pointerEvents: 'none' }}>
            <SearchIcon size={13} />
          </div>
          <input
            className="vex-input"
            style={{ paddingLeft: 30, height: 34 }}
            placeholder="Search..."
            value={searchVal}
            onChange={e => setSearchVal(e.target.value)}
          />
        </div>
      )}

      {canAccessAdmin && area === 'user' && (
        <button className="vex-btn vex-btn-secondary" onClick={() => onSwitchArea('admin')} style={{ height: 34, fontSize: 13 }}>
          Open Admin
        </button>
      )}

      {showAction && action && (
        <button
          className="vex-btn vex-btn-primary"
          onClick={() => action.page && navigate(action.page)}
          style={{ height: 34, fontSize: 13 }}
        >
          {action.label}
        </button>
      )}

      <button
        className="action-icon-btn tooltip"
        onClick={() => navigate('notifications')}
        style={{ width: 34, height: 34, position: 'relative' }}
      >
        <BellIcon size={16} />
        <div style={{
          position: 'absolute',
          top: 7,
          right: 7,
          width: 7,
          height: 7,
          background: '#7c3aed',
          borderRadius: '50%',
          border: '2px solid #080811',
        }} />
        <span className="tooltip-text">Notifications</span>
      </button>

      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center gap-2"
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 8, transition: 'background 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <div className="flex items-center justify-center rounded-full" style={{ width: 30, height: 30, background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', fontSize: 12, fontWeight: 600, color: '#fff' }}>
            {user.username.slice(0, 1).toUpperCase()}
          </div>
          <div style={{ textAlign: 'left', display: 'none' }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: '#e4e4f0' }}>{user.username}</div>
          </div>
          <ChevronDownIcon size={12} />
        </button>
        {showMenu && (
          <div
            className="vex-card-elevated fade-in"
            style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 200, padding: '6px', zIndex: 100 }}
            onMouseLeave={() => setShowMenu(false)}
          >
            {canAccessAdmin && (
              <button
                className="sidebar-item w-full"
                onClick={() => { onSwitchArea(area === 'admin' ? 'user' : 'admin'); setShowMenu(false) }}
              >
                <ShieldIcon size={14} />
                {area === 'admin' ? 'User Dashboard' : 'Admin Panel'}
              </button>
            )}
            {[
              { label: 'Profile', icon: UserIcon, page: 'settings' },
              { label: 'API Keys', icon: CodeIcon, page: 'api-keys' },
              { label: 'Billing', icon: CreditCardIcon, page: 'billing' },
            ].map(item => (
              <button
                key={item.label}
                className="sidebar-item w-full"
                onClick={() => { navigate(item.page); setShowMenu(false) }}
              >
                <item.icon size={14} />
                {item.label}
              </button>
            ))}
            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />
            <button
              className="sidebar-item w-full"
              style={{ color: '#f87171' }}
              onClick={() => { onLogout(); setShowMenu(false) }}
            >
              <LogOutIcon size={14} />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function SearchIcon({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5l3 3"/></svg>
}
function BellIcon({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 1.5a4.5 4.5 0 014.5 4.5c0 2.5.8 3.5 1.5 4.5H2c.7-1 1.5-2 1.5-4.5A4.5 4.5 0 018 1.5z"/><path d="M6.5 12.5a1.5 1.5 0 003 0"/></svg>
}
function UserIcon({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="5.5" r="3"/><path d="M2.5 14c0-3 2.5-5 5.5-5s5.5 2 5.5 5"/></svg>
}
function ShieldIcon({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 1.5 13 3.5v4c0 3.1-2.2 5.8-5 7-2.8-1.2-5-3.9-5-7v-4z"/><path d="M8 4.5v6"/></svg>
}
function CodeIcon({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="5,4 1,8 5,12"/><polyline points="11,4 15,8 11,12"/><line x1="9.5" y1="2.5" x2="6.5" y2="13.5"/></svg>
}
function CreditCardIcon({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1.5" y="3.5" width="13" height="9" rx="1.5"/><path d="M1.5 7h13"/><path d="M4.5 10.5h2"/></svg>
}
function LogOutIcon({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3"/><polyline points="11,11 14,8 11,5"/><line x1="14" y1="8" x2="6" y2="8"/></svg>
}
function ChevronDownIcon({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="4,6 8,10 12,6"/></svg>
}
