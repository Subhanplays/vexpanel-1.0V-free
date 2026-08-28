import { useState } from 'react'

type NFilter = 'all' | 'vps' | 'security' | 'billing'

interface Notification {
  id: number
  type: NFilter
  title: string
  body: string
  time: string
  icon: string
  read: boolean
  severity: 'info' | 'success' | 'warning' | 'error'
}

const initialNotifs: Notification[] = [
  { id: 1, type: 'vps', title: 'VPS dev-sandbox created', body: 'Your VPS dev-sandbox (Ubuntu 24.04, 2 vCPU, 4GB) is ready and running.', time: '2 min ago', icon: '🖥️', read: false, severity: 'success' },
  { id: 2, type: 'security', title: 'New login detected', body: 'Login from Berlin, Germany (195.20.14.10) via password.', time: '18 min ago', icon: '🔐', read: false, severity: 'info' },
  { id: 3, type: 'vps', title: 'High CPU usage on db-primary', body: 'db-primary CPU usage has exceeded 70% for over 15 minutes.', time: '1h 04m ago', icon: '⚠️', read: false, severity: 'warning' },
  { id: 4, type: 'vps', title: 'VPS deployment failed', body: 'Failed to deploy test-node-01: Network configuration error. Please retry.', time: '3h 20m ago', icon: '❌', read: true, severity: 'error' },
  { id: 5, type: 'billing', title: 'Invoice #INV-2026-07 available', body: 'Your July 2026 invoice for $44.90 is ready for download.', time: '5 days ago', icon: '💳', read: true, severity: 'info' },
  { id: 6, type: 'security', title: 'SSH key added', body: 'A new SSH key "MacBook Pro" (ED25519) was added to your account.', time: '6 days ago', icon: '🔑', read: true, severity: 'success' },
  { id: 7, type: 'vps', title: 'VPS web-prod-01 restarted', body: 'web-prod-01 was restarted automatically after an OOM event.', time: '1 week ago', icon: '🔄', read: true, severity: 'warning' },
  { id: 8, type: 'billing', title: 'Payment method expiring', body: 'Your Visa card ending in 4242 expires in 30 days. Please update.', time: '2 weeks ago', icon: '💳', read: true, severity: 'warning' },
]

const severityStyles = {
  success: { color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.2)' },
  info: { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.2)' },
  warning: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.2)' },
  error: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.2)' },
}

export default function Notifications({ navigate: _navigate }: { navigate: (p: string) => void }) {
  const [notifs, setNotifs] = useState(initialNotifs)
  const [filter, setFilter] = useState<NFilter>('all')

  const filtered = notifs.filter(n => filter === 'all' || n.type === filter)
  const unread = notifs.filter(n => !n.read).length

  const markRead = (id: number) => setNotifs(n => n.map(x => x.id === id ? { ...x, read: true } : x))
  const markAllRead = () => setNotifs(n => n.map(x => ({ ...x, read: true })))
  const clearAll = () => setNotifs([])

  const filterLabels: Record<NFilter, string> = { all: `All (${unread})`, vps: 'VPS', security: 'Security', billing: 'Billing' }

  return (
    <div style={{ padding: '28px' }}>
      <div style={{ maxWidth: 760 }}>
        {/* Controls */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-1" style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '3px' }}>
            {(Object.keys(filterLabels) as NFilter[]).map(f => (
              <button key={f} className={`tab-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                {filterLabels[f]}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {unread > 0 && (
              <button className="vex-btn vex-btn-ghost" style={{ height: 32, fontSize: 12.5 }} onClick={markAllRead}>
                Mark All Read
              </button>
            )}
            <button className="vex-btn vex-btn-ghost" style={{ height: 32, fontSize: 12.5 }} onClick={clearAll}>
              Clear All
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="vex-card" style={{ padding: '60px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔔</div>
            <p style={{ fontSize: 15, color: '#4b4b6a', margin: 0 }}>No notifications to show</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map(notif => {
              const s = severityStyles[notif.severity]
              return (
                <div
                  key={notif.id}
                  className="vex-card"
                  style={{
                    padding: '16px 18px',
                    opacity: notif.read ? 0.6 : 1,
                    cursor: 'pointer',
                    borderColor: notif.read ? 'rgba(255,255,255,0.07)' : s.border,
                    background: notif.read ? '#0d0d1a' : s.bg.replace('0.12', '0.06'),
                    transition: 'opacity 0.15s',
                  }}
                  onClick={() => markRead(notif.id)}
                >
                  <div className="flex items-start gap-3">
                    <div style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      background: s.bg,
                      border: `1px solid ${s.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                      flexShrink: 0,
                    }}>
                      {notif.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span style={{ fontSize: 13.5, fontWeight: 600, color: '#e4e4f0' }}>{notif.title}</span>
                          {!notif.read && (
                            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#7c3aed', flexShrink: 0 }}/>
                          )}
                        </div>
                        <span style={{ fontSize: 11.5, color: '#4b4b6a', whiteSpace: 'nowrap', marginLeft: 12 }}>{notif.time}</span>
                      </div>
                      <p style={{ fontSize: 13, color: '#9ca3af', margin: 0, lineHeight: 1.5 }}>{notif.body}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
