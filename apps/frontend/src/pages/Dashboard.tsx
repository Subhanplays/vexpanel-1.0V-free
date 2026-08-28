import { useEffect, useMemo, useState } from 'react'
import { Area, AreaChart, ResponsiveContainer, Tooltip } from 'recharts'
import { apiGet, type SessionUser } from '../lib/api'

interface DashboardProps {
  navigate: (p: string) => void
  user: SessionUser
  area: 'user' | 'admin'
  canAccessAdmin: boolean
  onAccessAdmin: () => void
}

type DashboardStats = {
  total: number
  running: number
  stopped: number
  suspended: number
  provisioning: number
  tasks: number
  nodesOnline?: number
  nodesTotal?: number
  ipsAvailable?: number
  ipsTotal?: number
  expiringSoon?: number
  usersTotal?: number
}

type VpsRow = {
  id: string
  name: string
  hostname: string
  status: string
  node?: { name: string }
  ip?: { address: string }
  plan?: { name: string }
  cpu: number
  ramMiB: number
  diskGiB: number
}

function buildSeries(value: number, swing: number) {
  return Array.from({ length: 20 }, (_, i) => ({
    x: i,
    v: Math.max(0, value + Math.sin(i * 0.55) * swing + (Math.random() - 0.5) * swing * 0.4),
  }))
}

export default function Dashboard({ navigate, user, area, canAccessAdmin, onAccessAdmin }: DashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [vps, setVps] = useState<VpsRow[]>([])
  const [activity, setActivity] = useState<Array<{ label: string; meta: string; tone: string }>>([])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const scope = area === 'admin' && canAccessAdmin ? 'admin' : 'user'
      const [dashboard, vpsList, recent] = await Promise.all([
        apiGet<DashboardStats>(`/api/dashboard?scope=${scope}`),
        apiGet<VpsRow[]>(`/api/vps?scope=${scope}`),
        apiGet<{ recentTasks: Array<{ type: string; status: string; createdAt: string; vps?: { name: string } }>; recentAudit: Array<{ action: string; result: string; createdAt: string; actor?: { username: string } }> }>(`/api/dashboard/recent?scope=${scope}`),
      ])
      if (cancelled) return
      setStats(dashboard)
      setVps(vpsList.slice(0, 5))
      const merged = [
        ...recent.recentTasks.map(task => ({
          label: task.type.split('.').join(' '),
          meta: task.vps?.name ? `${task.vps.name} · ${new Date(task.createdAt).toLocaleString()}` : new Date(task.createdAt).toLocaleString(),
          tone: task.status === 'RUNNING' ? 'running' : task.status === 'QUEUED' ? 'queued' : 'neutral',
        })),
        ...recent.recentAudit.map(item => ({
          label: item.action.split('.').join(' '),
          meta: `${item.actor?.username ?? 'system'} · ${item.result}`,
          tone: item.result === 'success' ? 'running' : 'neutral',
        })),
      ]
      setActivity(merged.slice(0, 6))
    })().catch(() => {
      if (!cancelled) {
        setStats(null)
        setVps([])
        setActivity([])
      }
    })
    return () => { cancelled = true }
  }, [area, canAccessAdmin])

  const cpuSeries = useMemo(() => buildSeries(stats?.running ?? 1, 20), [stats?.running])
  const ramSeries = useMemo(() => buildSeries(stats?.total ?? 1, 16), [stats?.total])

  return (
    <div style={{ padding: '28px 28px 48px' }}>
      <div className="vex-card" style={{ padding: '24px 26px', marginBottom: 20 }}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="badge badge-running">
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981' }}/>
                Live Session
              </span>
              <span className="mono" style={{ fontSize: 12.5, color: '#6b7280' }}>{user.email}</span>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e4e4f0', margin: 0 }}>Welcome back, {user.username}</h1>
            <p style={{ fontSize: 13.5, color: '#6b7280', margin: '8px 0 0', maxWidth: 720 }}>
              Manage your infrastructure from the {area === 'admin' ? 'admin console' : 'user dashboard'} with a premium Vibe TO Vexpanel UI.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {canAccessAdmin && area === 'user' && (
              <button className="vex-btn vex-btn-secondary" style={{ height: 36, fontSize: 13 }} onClick={onAccessAdmin}>
                Open Admin
              </button>
            )}
            <button className="vex-btn vex-btn-ghost" style={{ height: 36, fontSize: 13 }} onClick={() => navigate('vps')}>
              View VPS
            </button>
            {(area === 'admin' || canAccessAdmin) && (
              <button className="vex-btn vex-btn-primary" style={{ height: 36, fontSize: 13 }} onClick={() => navigate('create-vps')}>
                + Create VPS
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {[
          { label: 'Total VPS', value: stats?.total ?? '—', accent: '#8b5cf6', helper: area === 'admin' ? 'All tenants' : 'Your account' },
          { label: 'Running', value: stats?.running ?? '—', accent: '#10b981', helper: 'Active instances' },
          { label: 'Tasks', value: stats?.tasks ?? '—', accent: '#3b82f6', helper: 'Queued / running' },
          { label: 'Provisioning', value: stats?.provisioning ?? '—', accent: '#f59e0b', helper: 'Still deploying' },
        ].map(card => (
          <div key={card.label} className="vex-card" style={{ padding: '18px 20px' }}>
            <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 500, marginBottom: 6 }}>{card.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: card.accent, letterSpacing: '-0.03em' }}>{card.value}</div>
            <div style={{ fontSize: 11.5, color: '#4b4b6a', marginTop: 6 }}>{card.helper}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-5 mb-5" style={{ gridTemplateColumns: '1.25fr 0.75fr' }}>
        <div className="vex-card" style={{ overflow: 'hidden' }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e4e4f0', margin: 0 }}>System Pulse</h3>
            <span style={{ fontSize: 12, color: '#6b7280' }}>{stats?.nodesOnline ?? 0} online nodes</span>
          </div>
          <div style={{ padding: '18px' }}>
            <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 1fr' }}>
              {[
                { label: 'CPU load', data: cpuSeries, color: '#8b5cf6' },
                { label: 'Provisioning pressure', data: ramSeries, color: '#3b82f6' },
              ].map(chart => (
                <div key={chart.label}>
                  <div style={{ fontSize: 11.5, fontWeight: 500, color: '#6b7280', marginBottom: 8 }}>{chart.label}</div>
                  <div style={{ height: 110 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chart.data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
                        <defs>
                          <linearGradient id={`g-${chart.label}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={chart.color} stopOpacity={0.3}/>
                            <stop offset="100%" stopColor={chart.color} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="v" stroke={chart.color} strokeWidth={1.8} fill={`url(#g-${chart.label})`} dot={false} isAnimationActive={false}/>
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="vex-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e4e4f0', margin: 0 }}>Quick Status</h3>
          </div>
          <div style={{ padding: '14px 0' }}>
        {[
          { label: 'Stopped', value: stats?.stopped ?? 0, color: '#f59e0b' },
          { label: 'Suspended', value: stats?.suspended ?? 0, color: '#ef4444' },
          { label: 'Expiring soon', value: stats?.expiringSoon ?? 0, color: '#eab308' },
          ...(area === 'admin' ? [{ label: 'Users', value: stats?.usersTotal ?? '—', color: '#8b5cf6' }] : []),
        ].map(item => (
          <div key={item.label} className="flex items-center justify-between" style={{ padding: '11px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <span style={{ fontSize: 12.5, color: '#6b7280' }}>{item.label}</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: item.color }}>{item.value}</span>
          </div>
        ))}
          </div>
        </div>
      </div>

      <div className="grid gap-5" style={{ gridTemplateColumns: '1.15fr 0.85fr' }}>
        <div className="vex-card" style={{ padding: '0', overflow: 'hidden' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e4e4f0', margin: 0 }}>Recent VPS</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Name', 'Status', 'IP', 'Node', 'Plan', 'CPU/RAM/Disk'].map(col => (
                    <th key={col} style={{ textAlign: 'left', fontSize: 11.5, color: '#6b7280', fontWeight: 600, padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vps.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '14px 18px', color: '#e4e4f0', fontWeight: 600 }}>{item.name}</td>
                    <td style={{ padding: '14px 18px' }}><span className={`badge badge-${item.status.toLowerCase()}`}>{item.status}</span></td>
                    <td style={{ padding: '14px 18px', color: '#9ca3af' }}>{item.ip?.address ?? '—'}</td>
                    <td style={{ padding: '14px 18px', color: '#9ca3af' }}>{item.node?.name ?? '—'}</td>
                    <td style={{ padding: '14px 18px', color: '#9ca3af' }}>{item.plan?.name ?? '—'}</td>
                    <td style={{ padding: '14px 18px', color: '#9ca3af' }}>{item.cpu} / {item.ramMiB} / {item.diskGiB}</td>
                  </tr>
                ))}
                {!vps.length && (
                  <tr>
                    <td colSpan={6} style={{ padding: '24px 18px', color: '#6b7280' }}>No VPS found for this session.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="vex-card" style={{ padding: '0', overflow: 'hidden' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e4e4f0', margin: 0 }}>Recent Activity</h3>
          </div>
          <div style={{ padding: '8px 0' }}>
            {activity.map((item, index) => (
              <div key={`${item.label}-${index}`} style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div style={{ fontSize: 13.5, color: '#e4e4f0', fontWeight: 600 }}>{item.label}</div>
                    <div style={{ fontSize: 11.5, color: '#6b7280', marginTop: 4 }}>{item.meta}</div>
                  </div>
                  <span className="badge" style={{ background: item.tone === 'running' ? 'rgba(16,185,129,0.12)' : 'rgba(124,58,237,0.12)', color: item.tone === 'running' ? '#34d399' : '#c4b5fd' }}>
                    {item.tone}
                  </span>
                </div>
              </div>
            ))}
            {!activity.length && (
              <div style={{ padding: '18px 20px', color: '#6b7280' }}>Recent tasks will show up here.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#13132a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px' }}>
      <p style={{ fontSize: 11, color: '#6b7280', margin: '0 0 4px' }}>{label}</p>
      <p style={{ fontSize: 13, fontWeight: 600, color: '#e4e4f0', margin: 0 }}>{payload[0].value.toFixed(1)}</p>
    </div>
  )
}
