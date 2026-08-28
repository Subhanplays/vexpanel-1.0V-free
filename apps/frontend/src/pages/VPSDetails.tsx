import { useEffect, useMemo, useState } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts'
import { apiFetch, apiGet, apiJson, type SessionUser } from '../lib/api'

interface VPSDetailsProps {
  navigate: (p: string) => void
  user: SessionUser
  area: 'user' | 'admin'
  vpsId?: string
}

type VpsDetail = {
  id: string
  name: string
  hostname: string
  status: string
  imageAlias: string
  cpu: number
  ramMiB: number
  diskGiB: number
  createdAt: string
  expiresAt?: string | null
  node?: { name: string }
  ip?: { address: string }
  plan?: { name: string }
  snapshots?: Array<{ id: string; name: string; createdAt: string }>
  backups?: Array<{ id: string; name: string; createdAt: string }>
  tasks?: Array<{ id: string; type: string; status: string; createdAt: string }>
}

const makeSeries = (base: number, variance: number, points = 24) =>
  Array.from({ length: points }, (_, i) => ({
    t: `${i}:00`,
    v: Math.max(0, Math.min(100, base + Math.sin(i * 0.4) * variance + (Math.random() - 0.5) * variance * 0.5)),
  }))

export default function VPSDetails({ navigate, area, vpsId }: VPSDetailsProps) {
  const [vps, setVps] = useState<VpsDetail | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const listScope = area === 'admin' ? 'admin' : 'user'
      const all = await apiGet<Array<{ id: string } & Partial<VpsDetail>>>(`/api/vps?scope=${listScope}`)
      const firstId = vpsId || all[0]?.id
      if (!firstId) {
        if (!cancelled) setError('No VPS available for this session.')
        return
      }
      const detail = await apiGet<VpsDetail>(`/api/vps/${firstId}`)
      if (!cancelled) setVps(detail)
    })().catch(err => {
      if (!cancelled) setError(err instanceof Error ? err.message : 'Unable to load VPS details')
    })
    return () => { cancelled = true }
  }, [area, vpsId])

  const series = useMemo(() => ({
    cpu: makeSeries(60, 24),
    ram: makeSeries(72, 18),
    disk: makeSeries(42, 10),
    net: makeSeries(35, 26),
  }), [vps?.id])

  const action = async (name: 'start' | 'stop' | 'restart' | 'rebuild' | 'delete') => {
    if (!vps) return
    setBusy(name)
    setError('')
    try {
      await apiJson(`/api/vps/${vps.id}/actions`, { action: name }, 'POST')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setBusy(null)
    }
  }

  if (error && !vps) {
    return (
      <div style={{ padding: '28px' }}>
        <div className="vex-card" style={{ padding: '24px' }}>
          <h1 style={{ color: '#e4e4f0', margin: 0 }}>VPS Details</h1>
          <p style={{ color: '#f87171', marginTop: 12 }}>{error}</p>
          <button className="vex-btn vex-btn-primary" onClick={() => navigate('vps')}>Back to VPS list</button>
        </div>
      </div>
    )
  }

  if (!vps) {
    return (
      <div style={{ padding: '28px' }}>
        <div className="vex-card" style={{ padding: '24px', color: '#6b7280' }}>Loading VPS details…</div>
      </div>
    )
  }

  return (
    <div style={{ padding: '28px 28px 48px' }}>
      <div className="vex-card" style={{ padding: '22px 24px', marginBottom: 20 }}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
              🖥️
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 style={{ fontSize: 18, fontWeight: 700, color: '#e4e4f0', margin: 0 }}>{vps.name}</h1>
                <span className={`badge badge-${vps.status.toLowerCase()}`}>{vps.status}</span>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className="mono" style={{ fontSize: 12.5, color: '#6b7280' }}>{vps.ip?.address ?? 'No IP assigned'}</span>
                <span style={{ color: '#2a2a40' }}>·</span>
                <span style={{ fontSize: 12.5, color: '#6b7280' }}>{vps.hostname}</span>
                <span style={{ color: '#2a2a40' }}>·</span>
                <span style={{ fontSize: 12.5, color: '#6b7280' }}>{vps.node?.name ?? 'No node info'}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {['start', 'restart', 'stop', 'rebuild', 'delete'].map(name => (
              <button
                key={name}
                className={`vex-btn ${name === 'delete' ? 'vex-btn-danger' : name === 'start' ? 'vex-btn-success' : name === 'stop' ? 'vex-btn-secondary' : 'vex-btn-ghost'}`}
                style={{ height: 34, fontSize: 12.5 }}
                onClick={() => action(name as 'start' | 'stop' | 'restart' | 'rebuild' | 'delete')}
                disabled={busy !== null}
              >
                {busy === name ? 'Working…' : name.charAt(0).toUpperCase() + name.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && <div style={{ marginBottom: 16, color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 10, padding: '10px 12px' }}>{error}</div>}

      <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {[
          { label: 'CPU Usage', value: '62%', sub: `${vps.cpu} vCPU`, color: '#8b5cf6' },
          { label: 'RAM Usage', value: '74%', sub: `${Math.round(vps.ramMiB / 1024)} GiB`, color: '#3b82f6' },
          { label: 'Disk Usage', value: '48%', sub: `${vps.diskGiB} GiB`, color: '#10b981' },
          { label: 'Network I/O', value: '248 MB/s', sub: 'live panel stats', color: '#f59e0b' },
        ].map(r => (
          <div key={r.label} className="vex-card" style={{ padding: '18px 20px' }}>
            <div className="flex items-center justify-between mb-2">
              <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>{r.label}</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: r.color, letterSpacing: '-0.02em', marginBottom: 8 }}>{r.value}</div>
            <div className="resource-bar-track">
              <div className="resource-bar-fill" style={{ width: r.value.includes('%') ? r.value : '60%', background: r.color }}/>
            </div>
            <div style={{ fontSize: 11, color: '#4b4b6a', marginTop: 5 }}>{r.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-5 mb-5" style={{ gridTemplateColumns: '1fr 300px' }}>
        <div className="vex-card" style={{ overflow: 'hidden' }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e4e4f0', margin: 0 }}>Resource Monitoring</h3>
            <span style={{ fontSize: 12, color: '#6b7280' }}>live signals</span>
          </div>
          <div style={{ padding: '16px 18px' }}>
            <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 1fr' }}>
              {[
                { label: 'CPU', data: series.cpu, color: '#8b5cf6' },
                { label: 'RAM', data: series.ram, color: '#3b82f6' },
                { label: 'Disk', data: series.disk, color: '#10b981' },
                { label: 'Network', data: series.net, color: '#f59e0b' },
              ].map(chart => (
                <div key={chart.label}>
                  <div style={{ fontSize: 11.5, fontWeight: 500, color: '#6b7280', marginBottom: 8 }}>{chart.label}</div>
                  <div style={{ height: 90 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chart.data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
                        <defs>
                          <linearGradient id={`g-detail-${chart.label}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={chart.color} stopOpacity={0.25}/>
                            <stop offset="100%" stopColor={chart.color} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                        <Tooltip content={<CustomTooltip/>}/>
                        <Area type="monotone" dataKey="v" stroke={chart.color} strokeWidth={1.5} fill={`url(#g-detail-${chart.label})`} dot={false} isAnimationActive={false}/>
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="vex-card" style={{ padding: '0', overflow: 'hidden' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e4e4f0', margin: 0 }}>Server Information</h3>
          </div>
          <div style={{ padding: '12px 0' }}>
            {[
              { label: 'VPS ID', value: vps.id },
              { label: 'Hostname', value: vps.hostname },
              { label: 'Image', value: vps.imageAlias },
              { label: 'Created', value: new Date(vps.createdAt).toLocaleString() },
              { label: 'Expires', value: vps.expiresAt ? new Date(vps.expiresAt).toLocaleString() : '—' },
              { label: 'Plan', value: vps.plan?.name ?? '—' },
            ].map(item => (
              <div key={item.label} className="flex items-start justify-between" style={{ padding: '8px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: 11.5, color: '#6b7280', flexShrink: 0, marginRight: 12, paddingTop: 1 }}>{item.label}</span>
                <span style={{ fontSize: 12.5, color: '#c4c4d4', textAlign: 'right', wordBreak: 'break-all' }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="vex-card" style={{ padding: '20px 24px' }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e4e4f0', margin: '0 0 14px' }}>Quick Actions</h3>
        <div className="flex items-center gap-3 flex-wrap">
          <button className="vex-btn vex-btn-primary" onClick={() => navigate('terminal')} style={{ height: 38 }}>Web Terminal</button>
          <button className="vex-btn vex-btn-secondary" onClick={() => navigate('rdp')} style={{ height: 38 }}>RDP / Desktop</button>
          <button className="vex-btn vex-btn-secondary" onClick={() => navigate('ssh')} style={{ height: 38 }}>SSH Access</button>
          <button className="vex-btn vex-btn-ghost" onClick={() => navigate('vps')} style={{ height: 38 }}>Back to list</button>
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
      <p style={{ fontSize: 13, fontWeight: 600, color: '#e4e4f0', margin: 0 }}>{payload[0].value.toFixed(1)}%</p>
    </div>
  )
}

