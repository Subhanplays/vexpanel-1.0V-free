import { useEffect, useState } from 'react'
import { apiGet, type SessionUser } from '../lib/api'

interface VPSListProps {
  navigate: (p: string) => void
  user: SessionUser
  area: 'user' | 'admin'
}

type VpsRow = {
  id: string
  name: string
  hostname: string
  status: string
  imageAlias?: string
  cpu: number
  ramMiB: number
  diskGiB: number
  node?: { name: string }
  ip?: { address: string }
  plan?: { name: string }
  rdp?: { enabled: boolean }
}

export default function VPSList({ navigate, area }: VPSListProps) {
  const [items, setItems] = useState<VpsRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const scope = area === 'admin' ? 'admin' : 'user'
      const data = await apiGet<VpsRow[]>(`/api/vps?scope=${scope}`)
      if (!cancelled) {
        setItems(data)
        setLoading(false)
      }
    })().catch(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [area])

  return (
    <div style={{ padding: '28px 28px 48px' }}>
      <div className="vex-card" style={{ padding: '22px 24px', marginBottom: 20 }}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: '#e4e4f0', margin: 0 }}>VPS Instances</h1>
            <p style={{ fontSize: 13.5, color: '#6b7280', margin: '8px 0 0' }}>
              {area === 'admin' ? 'Browse every VPS in the platform.' : 'Manage the VPS tied to your account.'}
            </p>
          </div>
          <button className="vex-btn vex-btn-primary" onClick={() => navigate('create-vps')}>
            + Create VPS
          </button>
        </div>
      </div>

      <div className="vex-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Name', 'Status', 'IP', 'Node', 'Plan', 'Resources', 'Actions'].map(col => (
                  <th key={col} style={{ textAlign: 'left', fontSize: 11.5, color: '#6b7280', fontWeight: 600, padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ color: '#e4e4f0', fontWeight: 600 }}>{item.name}</div>
                    <div style={{ color: '#6b7280', fontSize: 11.5 }}>{item.hostname}</div>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span className={`badge badge-${item.status.toLowerCase()}`}>{item.status}</span>
                  </td>
                  <td style={{ padding: '14px 18px', color: '#9ca3af' }}>{item.ip?.address ?? '—'}</td>
                  <td style={{ padding: '14px 18px', color: '#9ca3af' }}>{item.node?.name ?? '—'}</td>
                  <td style={{ padding: '14px 18px', color: '#9ca3af' }}>{item.plan?.name ?? '—'}</td>
                  <td style={{ padding: '14px 18px', color: '#9ca3af' }}>{item.cpu} vCPU · {item.ramMiB} MiB · {item.diskGiB} GiB</td>
                  <td style={{ padding: '14px 18px' }}>
                    <div className="flex items-center gap-2">
                      <button className="action-icon-btn" title="Details" onClick={() => navigate(`vps-details:${item.id}`)}>↗</button>
                      <button className="action-icon-btn" title="Terminal" onClick={() => navigate('terminal')}>⌨</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!items.length && !loading && (
                <tr>
                  <td colSpan={7} style={{ padding: '26px 18px', color: '#6b7280' }}>
                    No VPS found.
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={7} style={{ padding: '26px 18px', color: '#6b7280' }}>
                    Loading VPS...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

