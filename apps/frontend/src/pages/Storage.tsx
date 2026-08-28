import { useState } from 'react'

interface StorageProps {
  navigate: (p: string) => void
}

const volumes = [
  { id: 'vol-1', name: 'web-prod-data', vps: 'web-prod-01', size: '50 GB', used: 42, fs: 'ext4', mount: '/var/www', status: 'mounted' },
  { id: 'vol-2', name: 'db-storage', vps: 'db-primary', size: '200 GB', used: 67, fs: 'xfs', mount: '/var/lib/postgresql', status: 'mounted' },
  { id: 'vol-3', name: 'backup-vol-01', vps: '—', size: '500 GB', used: 23, fs: 'ext4', mount: '—', status: 'detached' },
  { id: 'vol-4', name: 'mail-logs', vps: 'mail-server', size: '20 GB', used: 55, fs: 'ext4', mount: '/var/log', status: 'mounted' },
  { id: 'vol-5', name: 'cache-data', vps: 'cache-redis', size: '10 GB', used: 28, fs: 'tmpfs', mount: '/data', status: 'mounted' },
]

export default function Storage({ navigate: _navigate }: StorageProps) {
  const [showModal, setShowModal] = useState(false)
  const [newVol, setNewVol] = useState({ name: '', size: 20, fs: 'ext4', mount: '' })

  const total = 780
  const usedGB = volumes.reduce((acc, v) => {
    const sizeNum = parseInt(v.size)
    return acc + (sizeNum * v.used / 100)
  }, 0)
  const usedPct = Math.round((usedGB / total) * 100)

  return (
    <div style={{ padding: '28px' }}>
      {/* Overview */}
      <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr' }}>
        <div className="vex-card" style={{ padding: '20px 22px' }}>
          <div className="flex items-center justify-between mb-3">
            <span style={{ fontSize: 13, fontWeight: 500, color: '#9ca3af' }}>Storage Pool</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#e4e4f0' }}>{Math.round(usedGB)} / {total} GB</span>
          </div>
          <div className="resource-bar-track" style={{ height: 8, marginBottom: 8, borderRadius: 4 }}>
            <div className="resource-bar-fill" style={{ width: `${usedPct}%`, background: 'linear-gradient(90deg,#7c3aed,#4f46e5)', borderRadius: 4 }}/>
          </div>
          <div className="flex justify-between">
            <span style={{ fontSize: 11.5, color: '#6b7280' }}>{usedPct}% used</span>
            <span style={{ fontSize: 11.5, color: '#6b7280' }}>{total - Math.round(usedGB)} GB available</span>
          </div>
        </div>
        {[
          { label: 'Total Capacity', value: `${total} GB`, color: '#8b5cf6' },
          { label: 'Volumes', value: volumes.length, color: '#3b82f6' },
          { label: 'Mounted', value: volumes.filter(v => v.status === 'mounted').length, color: '#10b981' },
        ].map(s => (
          <div key={s.label} className="vex-card" style={{ padding: '16px 18px' }}>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Volumes Table */}
      <div className="vex-card" style={{ overflow: 'hidden' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e4e4f0', margin: 0 }}>Volumes</h3>
          <button className="vex-btn vex-btn-primary" style={{ height: 32, fontSize: 12.5 }} onClick={() => setShowModal(true)}>
            + Create Volume
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {['Name', 'VPS', 'Size', 'Usage', 'Filesystem', 'Mount Point', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#4b4b6a', textAlign: 'left', whiteSpace: 'nowrap', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {volumes.map((vol, i) => (
                <tr key={vol.id} className="table-row" style={{ borderBottom: i < volumes.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <td style={{ padding: '13px 16px' }}>
                    <div className="flex items-center gap-2">
                      <div style={{ width: 30, height: 30, borderRadius: 7, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        💾
                      </div>
                      <span style={{ fontSize: 13.5, fontWeight: 600, color: '#e4e4f0' }}>{vol.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{ fontSize: 13, color: vol.vps !== '—' ? '#9ca3af' : '#4b4b6a' }}>{vol.vps}</span>
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <span className="mono" style={{ fontSize: 13, color: '#9ca3af', fontWeight: 500 }}>{vol.size}</span>
                  </td>
                  <td style={{ padding: '13px 16px', minWidth: 120 }}>
                    <div className="flex items-center gap-2">
                      <div className="resource-bar-track" style={{ width: 70 }}>
                        <div className="resource-bar-fill" style={{ width: `${vol.used}%`, background: vol.used > 85 ? '#ef4444' : vol.used > 70 ? '#f59e0b' : '#10b981' }}/>
                      </div>
                      <span className="mono" style={{ fontSize: 11.5, color: '#6b7280' }}>{vol.used}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <span className="badge badge-info mono" style={{ fontSize: 11 }}>{vol.fs}</span>
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <span className="mono" style={{ fontSize: 12, color: vol.mount !== '—' ? '#c4c4d4' : '#4b4b6a' }}>{vol.mount}</span>
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <span className={`badge ${vol.status === 'mounted' ? 'badge-running' : 'badge-stopped'}`}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: vol.status === 'mounted' ? '#10b981' : '#6b7280' }}/>
                      {vol.status === 'mounted' ? 'Mounted' : 'Detached'}
                    </span>
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <div className="action-group">
                      <button className="action-icon-btn" title="Attach/Detach"><PlugIcon size={13}/></button>
                      <button className="action-icon-btn" title="Snapshot"><CameraIcon size={13}/></button>
                      <button className="action-icon-btn" title="Resize"><ResizeIcon size={13}/></button>
                      <button className="action-icon-btn danger" title="Delete"><TrashIcon size={13}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Volume Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="vex-card-elevated fade-in" style={{ width: '100%', maxWidth: 460, padding: '28px' }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#e4e4f0', margin: '0 0 20px' }}>Create Volume</h3>
            <div className="flex flex-col gap-4">
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: '#9ca3af', marginBottom: 6 }}>Volume Name</label>
                <input className="vex-input" placeholder="my-data-vol" value={newVol.name} onChange={e => setNewVol(v => ({ ...v, name: e.target.value }))} />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <label style={{ fontSize: 12.5, fontWeight: 500, color: '#9ca3af' }}>Size</label>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#8b5cf6' }}>{newVol.size} GB</span>
                </div>
                <input type="range" min={5} max={1000} step={5} value={newVol.size} onChange={e => setNewVol(v => ({ ...v, size: Number(e.target.value) }))} style={{ width: '100%', accentColor: '#7c3aed', cursor: 'pointer' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: '#9ca3af', marginBottom: 6 }}>Filesystem</label>
                <select className="vex-input" value={newVol.fs} onChange={e => setNewVol(v => ({ ...v, fs: e.target.value }))}>
                  {['ext4', 'xfs', 'btrfs', 'zfs'].map(fs => <option key={fs}>{fs}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: '#9ca3af', marginBottom: 6 }}>Attach to VPS (optional)</label>
                <select className="vex-input">
                  <option value="">— Detached —</option>
                  {['web-prod-01', 'db-primary', 'mail-server'].map(v => <option key={v}>{v}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button className="vex-btn vex-btn-ghost flex-1 justify-center" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="vex-btn vex-btn-primary flex-1 justify-center" onClick={() => setShowModal(false)}>Create Volume</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PlugIcon({ size = 16 }) { return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 2v4M6 2v4M4 6h8v2a4 4 0 01-4 4v2M8 12v2"/></svg> }
function CameraIcon({ size = 16 }) { return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 11.5a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 012 11.5V6a1.5 1.5 0 011.5-1.5H5L6.5 3h3L11 4.5h1.5A1.5 1.5 0 0114 6v5.5z"/><circle cx="8" cy="8" r="2"/></svg> }
function ResizeIcon({ size = 16 }) { return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 9.5V14h4.5"/><path d="M14 6.5V2h-4.5"/><path d="M2 14l5-5M14 2l-5 5"/></svg> }
function TrashIcon({ size = 16 }) { return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4h12"/><path d="M5 4V2.5a.5.5 0 01.5-.5h5a.5.5 0 01.5.5V4"/><path d="M3 4l1 9.5a1 1 0 001 .5h6a1 1 0 001-.5L13 4"/></svg> }
