import { useState } from 'react'

type FilterType = 'all' | 'vps' | 'auth' | 'network' | 'storage' | 'rdp'

const entries = [
  { id: 1, time: '2026-08-28 10:32:14', action: 'VPS Started', resource: 'web-prod-01', ip: '195.20.14.10', status: 'success', type: 'vps', detail: 'VPS started by admin' },
  { id: 2, time: '2026-08-28 10:14:22', action: 'SSH Key Added', resource: 'MacBook Pro', ip: '195.20.14.10', status: 'success', type: 'auth', detail: 'ED25519 key added to account' },
  { id: 3, time: '2026-08-28 09:44:07', action: 'Login Success', resource: 'admin@vexpanel.io', ip: '195.20.14.10', status: 'success', type: 'auth', detail: 'Login from Berlin, Germany' },
  { id: 4, time: '2026-08-28 08:31:55', action: 'CPU Alert Triggered', resource: 'db-primary', ip: '—', status: 'warning', type: 'vps', detail: 'CPU usage exceeded 70% threshold' },
  { id: 5, time: '2026-08-28 07:12:03', action: 'VPS Created', resource: 'dev-sandbox', ip: '195.20.14.10', status: 'success', type: 'vps', detail: 'Ubuntu 24.04, 2 vCPU, 4GB RAM' },
  { id: 6, time: '2026-08-27 22:48:11', action: 'Network Created', resource: 'vpc-backend', ip: '195.20.14.10', status: 'success', type: 'network', detail: 'Private network 192.168.10.0/24' },
  { id: 7, time: '2026-08-27 18:05:44', action: 'Volume Snapshot', resource: 'backup-vol-01', ip: '—', status: 'success', type: 'storage', detail: 'Automatic snapshot created' },
  { id: 8, time: '2026-08-27 16:22:30', action: 'Login Failed', resource: 'admin@vexpanel.io', ip: '92.168.54.3', status: 'error', type: 'auth', detail: 'Invalid password - Moscow, RU' },
  { id: 9, time: '2026-08-27 14:11:59', action: 'RDP Desktop Started', resource: 'Ubuntu Desktop Dev', ip: '195.20.14.10', status: 'success', type: 'rdp', detail: 'Desktop started on port 3389' },
  { id: 10, time: '2026-08-27 11:33:27', action: 'VPS Stopped', resource: 'staging-env', ip: '195.20.14.10', status: 'success', type: 'vps', detail: 'Manually stopped by admin' },
  { id: 11, time: '2026-08-27 09:00:00', action: 'Volume Resized', resource: 'db-storage', ip: '195.20.14.10', status: 'success', type: 'storage', detail: 'Resized from 100GB to 200GB' },
  { id: 12, time: '2026-08-27 04:15:18', action: 'API Key Created', resource: 'Deploy Bot v2', ip: '195.20.14.10', status: 'success', type: 'auth', detail: 'New API key with VPS and Storage permissions' },
]

const statusConfig = {
  success: { color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: 'Success' },
  error: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', label: 'Error' },
  warning: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'Warning' },
}

const typeIcons: Record<string, string> = {
  vps: '🖥️', auth: '🔐', network: '🌐', storage: '💾', rdp: '🖱️',
}

const filterLabels: Record<FilterType, string> = {
  all: 'All Events',
  vps: 'VPS',
  auth: 'Authentication',
  network: 'Network',
  storage: 'Storage',
  rdp: 'RDP',
}

export default function Activity({ navigate: _navigate }: { navigate: (p: string) => void }) {
  const [filter, setFilter] = useState<FilterType>('all')
  const [search, setSearch] = useState('')

  const filtered = entries.filter(e => {
    if (filter !== 'all' && e.type !== filter) return false
    if (search && ![e.action, e.resource, e.ip].some(f => f.toLowerCase().includes(search.toLowerCase()))) return false
    return true
  })

  return (
    <div style={{ padding: '28px' }}>
      {/* Filters + search */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 280 }}>
          <div style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#4b4b6a', pointerEvents: 'none' }}>
            <SearchIcon size={13}/>
          </div>
          <input className="vex-input" style={{ paddingLeft: 30, height: 36 }} placeholder="Search events..." value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        <div className="flex items-center gap-1 flex-wrap" style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '3px' }}>
          {(Object.keys(filterLabels) as FilterType[]).map(f => (
            <button key={f} className={`tab-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)} style={{ padding: '5px 12px' }}>
              {filterLabels[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid gap-3 mb-6" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {[
          { label: 'Total Events', value: entries.length, color: '#8b5cf6' },
          { label: 'Today', value: entries.filter(e => e.time.startsWith('2026-08-28')).length, color: '#3b82f6' },
          { label: 'Errors', value: entries.filter(e => e.status === 'error').length, color: '#ef4444' },
          { label: 'Warnings', value: entries.filter(e => e.status === 'warning').length, color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} className="vex-card" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 11.5, color: '#6b7280', marginBottom: 5 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Log Table */}
      <div className="vex-card" style={{ overflow: 'hidden' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e4e4f0', margin: 0 }}>Audit Log</h3>
            <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0' }}>All events in the last 30 days</p>
          </div>
          <span style={{ fontSize: 12.5, color: '#6b7280' }}>{filtered.length} events</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {['Timestamp', 'Action', 'Resource', 'IP Address', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '10px 18px', fontSize: 11, fontWeight: 600, color: '#4b4b6a', textAlign: 'left', whiteSpace: 'nowrap', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry, i) => {
                const sc = statusConfig[entry.status as keyof typeof statusConfig]
                return (
                  <tr key={entry.id} className="table-row" style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <td style={{ padding: '12px 18px' }}>
                      <span className="mono" style={{ fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap' }}>{entry.time}</span>
                    </td>
                    <td style={{ padding: '12px 18px' }}>
                      <div className="flex items-center gap-2">
                        <span>{typeIcons[entry.type]}</span>
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 600, color: '#e4e4f0' }}>{entry.action}</div>
                          <div style={{ fontSize: 11.5, color: '#6b7280', marginTop: 1 }}>{entry.detail}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 18px' }}>
                      <span style={{ fontSize: 13, color: '#9ca3af' }}>{entry.resource}</span>
                    </td>
                    <td style={{ padding: '12px 18px' }}>
                      <span className="mono" style={{ fontSize: 12.5, color: '#6b7280' }}>{entry.ip}</span>
                    </td>
                    <td style={{ padding: '12px 18px' }}>
                      <span className="badge" style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.color}30` }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: sc.color }}/>
                        {sc.label}
                      </span>
                    </td>
                    <td style={{ padding: '12px 18px' }}>
                      <button className="action-icon-btn"><ExternalIcon size={13}/></button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ padding: '48px', textAlign: 'center', color: '#4b4b6a', fontSize: 14 }}>No events match your filter.</div>
          )}
        </div>
      </div>
    </div>
  )
}

function SearchIcon({ size = 16 }) { return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5l3 3"/></svg> }
function ExternalIcon({ size = 16 }) { return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M7 3H3a1 1 0 00-1 1v9a1 1 0 001 1h9a1 1 0 001-1V9"/><path d="M10 2h4v4"/><line x1="14" y1="2" x2="7" y2="9"/></svg> }
