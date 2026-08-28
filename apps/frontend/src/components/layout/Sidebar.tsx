import type { SessionUser } from '../../lib/api'

type PageName = string

interface SidebarProps {
  page: PageName
  navigate: (p: PageName) => void
  onLogout: () => void
  collapsed: boolean
  onToggleCollapse: () => void
  user: SessionUser
  area: 'user' | 'admin'
  canAccessAdmin: boolean
  onSwitchArea: (area: 'user' | 'admin') => void
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: GridIcon },
  { id: 'vps', label: 'VPS Instances', icon: ServerIcon },
  { id: 'create-vps', label: 'Create VPS', icon: PlusCircleIcon },
  { id: 'rdp', label: 'RDP / Desktop', icon: MonitorIcon },
  { id: 'networks', label: 'Networks', icon: NetworkIcon },
  { id: 'storage', label: 'Storage', icon: DatabaseIcon },
  { id: 'terminal', label: 'Web Terminal', icon: TerminalIcon },
  { id: 'ssh', label: 'SSH Access', icon: KeyIcon },
  { id: 'activity', label: 'Activity', icon: ActivityIcon },
  { id: 'billing', label: 'Billing', icon: CreditCardIcon },
  { id: 'api-keys', label: 'API Keys', icon: CodeIcon },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
]

export default function Sidebar({ page, navigate, onLogout, collapsed, onToggleCollapse, user, area, canAccessAdmin, onSwitchArea }: SidebarProps) {
  const w = collapsed ? 60 : 240

  return (
    <div
      className="sidebar-transition flex-shrink-0 flex flex-col h-full overflow-hidden"
      style={{
        width: w,
        background: '#080811',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex items-center gap-3 px-4 py-5" style={{ minHeight: 64 }}>
        <div
          className="flex-shrink-0 flex items-center justify-center rounded-[9px]"
          style={{ width: 32, height: 32, background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', boxShadow: '0 0 14px rgba(124,58,237,0.4)' }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="2" width="5" height="5" rx="1" fill="white" opacity="0.9" />
            <rect x="9" y="2" width="5" height="5" rx="1" fill="white" opacity="0.6" />
            <rect x="2" y="9" width="5" height="5" rx="1" fill="white" opacity="0.6" />
            <rect x="9" y="9" width="5" height="5" rx="1" fill="white" opacity="0.9" />
          </svg>
        </div>
        {!collapsed && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#e4e4f0', letterSpacing: '-0.02em' }}>
              Vibe TO <span style={{ color: '#8b5cf6' }}>Vexpanel</span>
            </div>
            <div style={{ fontSize: 11.5, color: '#6b7280' }}>{area === 'admin' ? 'Admin Console' : 'User Dashboard'}</div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2" style={{ overflowX: 'hidden' }}>
        <div style={{ fontSize: 10.5, fontWeight: 600, color: '#3a3a5a', letterSpacing: '0.08em', textTransform: 'uppercase', padding: collapsed ? '8px 0' : '8px 10px 6px', textAlign: collapsed ? 'center' : 'left' }}>
          {collapsed ? '···' : 'Infrastructure'}
        </div>
        {navItems.slice(0, 8).map(item => (
          <NavItem key={item.id} item={item} active={page === item.id} collapsed={collapsed} navigate={navigate} />
        ))}
        <div style={{ fontSize: 10.5, fontWeight: 600, color: '#3a3a5a', letterSpacing: '0.08em', textTransform: 'uppercase', padding: collapsed ? '12px 0 6px' : '12px 10px 6px', textAlign: collapsed ? 'center' : 'left' }}>
          {collapsed ? '···' : 'Account'}
        </div>
        {navItems.slice(8).map(item => (
          <NavItem key={item.id} item={item} active={page === item.id} collapsed={collapsed} navigate={navigate} />
        ))}
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: collapsed ? '10px 8px' : '12px' }}>
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center justify-center rounded-full" style={{ width: 32, height: 32, background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', fontSize: 13, fontWeight: 600, color: '#fff' }}>
              {user.username.slice(0, 1).toUpperCase()}
            </div>
            <button onClick={onToggleCollapse} className="action-icon-btn" style={{ width: 26, height: 26, color: '#6b7280' }}>
              <ChevronRightIcon size={14} />
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center rounded-full flex-shrink-0" style={{ width: 34, height: 34, background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', fontSize: 13.5, fontWeight: 600, color: '#fff' }}>
                {user.username.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div style={{ fontSize: 13, fontWeight: 600, color: '#e4e4f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.username}</div>
                <div className="flex items-center gap-1.5">
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                  <span style={{ fontSize: 11.5, color: '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</span>
                </div>
              </div>
              <button onClick={onLogout} className="action-icon-btn flex-shrink-0" title="Sign out">
                <LogOutIcon size={14} />
              </button>
            </div>

            {canAccessAdmin && (
              <button
                className="vex-btn vex-btn-primary w-full justify-center mb-2"
                style={{ padding: '6px 8px', fontSize: 12 }}
                onClick={() => onSwitchArea(area === 'admin' ? 'user' : 'admin')}
              >
                {area === 'admin' ? 'Open User Dashboard' : 'Open Admin Panel'}
              </button>
            )}

            <button onClick={onToggleCollapse} className="vex-btn vex-btn-secondary w-full justify-center" style={{ padding: '6px 8px', fontSize: 12 }}>
              <ChevronLeftIcon size={13} />
              Collapse
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function NavItem({ item, active, collapsed, navigate }: {
  item: { id: string; label: string; icon: React.FC<{ size?: number }> }
  active: boolean
  collapsed: boolean
  navigate: (p: string) => void
}) {
  const Icon = item.icon
  return (
    <div
      className={`sidebar-item ${active ? 'active' : ''}`}
      onClick={() => navigate(item.id)}
      title={collapsed ? item.label : undefined}
      style={collapsed ? { justifyContent: 'center', padding: '8px' } : {}}
    >
      <Icon size={16} />
      {!collapsed && <span>{item.label}</span>}
    </div>
  )
}

function GridIcon({ size = 16 }) { return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1.5" y="1.5" width="5" height="5" rx="1"/><rect x="9.5" y="1.5" width="5" height="5" rx="1"/><rect x="1.5" y="9.5" width="5" height="5" rx="1"/><rect x="9.5" y="9.5" width="5" height="5" rx="1"/></svg> }
function ServerIcon({ size = 16 }) { return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1.5" y="2.5" width="13" height="4" rx="1"/><rect x="1.5" y="9.5" width="13" height="4" rx="1"/><circle cx="12.5" cy="4.5" r="0.8" fill="currentColor" stroke="none"/><circle cx="12.5" cy="11.5" r="0.8" fill="currentColor" stroke="none"/></svg> }
function PlusCircleIcon({ size = 16 }) { return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 5.5v5M5.5 8h5"/></svg> }
function MonitorIcon({ size = 16 }) { return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1.5" y="2" width="13" height="9" rx="1.5"/><path d="M5.5 14h5M8 11v3"/></svg> }
function NetworkIcon({ size = 16 }) { return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="3" r="1.5"/><circle cx="3" cy="13" r="1.5"/><circle cx="13" cy="13" r="1.5"/><path d="M8 4.5v4M8 8.5L3 11.5M8 8.5L13 11.5"/></svg> }
function DatabaseIcon({ size = 16 }) { return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><ellipse cx="8" cy="4.5" rx="5.5" ry="2"/><path d="M2.5 4.5v7c0 1.1 2.46 2 5.5 2s5.5-.9 5.5-2v-7"/><path d="M2.5 8c0 1.1 2.46 2 5.5 2s5.5-.9 5.5-2"/></svg> }
function TerminalIcon({ size = 16 }) { return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1.5" y="2.5" width="13" height="11" rx="1.5"/><path d="M4.5 6l2.5 2-2.5 2"/><path d="M9 10h3"/></svg> }
function KeyIcon({ size = 16 }) { return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6.5" cy="6.5" r="3"/><path d="M8.5 8.5l5 5"/><path d="M11.5 11.5l1.5-1.5"/></svg> }
function ActivityIcon({ size = 16 }) { return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="1,8 4,8 5,4 7,12 9,6 11,9 12,8 15,8"/></svg> }
function CreditCardIcon({ size = 16 }) { return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1.5" y="3.5" width="13" height="9" rx="1.5"/><path d="M1.5 7h13"/><path d="M4.5 10.5h2"/></svg> }
function CodeIcon({ size = 16 }) { return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="5,4 1,8 5,12"/><polyline points="11,4 15,8 11,12"/><line x1="9.5" y1="2.5" x2="6.5" y2="13.5"/></svg> }
function SettingsIcon({ size = 16 }) { return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="2.5"/><path d="M8 1.5v1.2M8 13.3v1.2M1.5 8h1.2M13.3 8h1.2M3.4 3.4l0.85 0.85M11.75 11.75l0.85 0.85M3.4 12.6l0.85-.85M11.75 4.25l0.85-.85"/></svg> }
function LogOutIcon({ size = 16 }) { return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3"/><polyline points="11,11 14,8 11,5"/><line x1="14" y1="8" x2="6" y2="8"/></svg> }
function ChevronLeftIcon({ size = 16 }) { return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="10,4 6,8 10,12"/></svg> }
function ChevronRightIcon({ size = 16 }) { return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="6,4 10,8 6,12"/></svg> }

