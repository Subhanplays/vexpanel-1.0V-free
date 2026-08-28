import { useState } from 'react'

const apiKeys = [
  { id: 'key-1', name: 'Deploy Bot v2', key: 'vex_live_a3f...k9d2', created: '2026-08-01', lastUsed: '2 min ago', status: 'active', perms: ['vps', 'network', 'storage'] },
  { id: 'key-2', name: 'Monitoring Script', key: 'vex_live_b7e...m4p1', created: '2026-07-15', lastUsed: '1 hour ago', status: 'active', perms: ['vps'] },
  { id: 'key-3', name: 'Backup Service', key: 'vex_live_c2h...n8q3', created: '2026-06-20', lastUsed: '5 days ago', status: 'active', perms: ['storage'] },
  { id: 'key-4', name: 'Legacy Deploy', key: 'vex_live_d5k...p1s6', created: '2026-05-01', lastUsed: '47 days ago', status: 'inactive', perms: ['vps', 'network'] },
]

const allPerms = [
  { id: 'vps', label: 'VPS', desc: 'Create, start, stop, delete VPS instances' },
  { id: 'network', label: 'Network', desc: 'Manage networks and IP addresses' },
  { id: 'storage', label: 'Storage', desc: 'Manage volumes and snapshots' },
  { id: 'rdp', label: 'RDP', desc: 'Manage desktop instances' },
  { id: 'account', label: 'Account', desc: 'Read account info and billing' },
]

const permColor = (p: string) => {
  const colors: Record<string, string> = { vps: 'badge-purple', network: 'badge-info', storage: 'badge-warning', rdp: 'badge-running', account: 'badge-stopped' }
  return colors[p] || 'badge-info'
}

export default function APIKeys({ navigate: _navigate }: { navigate: (p: string) => void }) {
  const [showModal, setShowModal] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [selectedPerms, setSelectedPerms] = useState<string[]>(['vps'])
  const [createdSecret, setCreatedSecret] = useState<string | null>(null)
  const [copiedSecret, setCopiedSecret] = useState(false)

  const togglePerm = (p: string) => {
    setSelectedPerms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])
  }

  const createKey = () => {
    const secret = `vex_live_${Math.random().toString(36).slice(2, 14)}${Math.random().toString(36).slice(2, 8)}`
    setCreatedSecret(secret)
  }

  const copySecret = () => {
    if (createdSecret) {
      navigator.clipboard.writeText(createdSecret)
      setCopiedSecret(true)
      setTimeout(() => setCopiedSecret(false), 1500)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setCreatedSecret(null)
    setNewKeyName('')
    setSelectedPerms(['vps'])
    setCopiedSecret(false)
  }

  return (
    <div style={{ padding: '28px' }}>
      {/* Stats */}
      <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {[
          { label: 'Total API Keys', value: apiKeys.length, color: '#8b5cf6' },
          { label: 'Active', value: apiKeys.filter(k => k.status === 'active').length, color: '#10b981' },
          { label: 'Inactive', value: apiKeys.filter(k => k.status === 'inactive').length, color: '#6b7280' },
        ].map(s => (
          <div key={s.label} className="vex-card" style={{ padding: '16px 18px' }}>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Keys Table */}
      <div className="vex-card" style={{ overflow: 'hidden', marginBottom: 20 }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e4e4f0', margin: 0 }}>API Keys</h3>
            <p style={{ fontSize: 12.5, color: '#6b7280', margin: '2px 0 0' }}>Manage programmatic access to the VexPanel API</p>
          </div>
          <button className="vex-btn vex-btn-primary" style={{ height: 32, fontSize: 12.5 }} onClick={() => setShowModal(true)}>
            + New API Key
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {['Name', 'Key', 'Permissions', 'Created', 'Last Used', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 18px', fontSize: 11, fontWeight: 600, color: '#4b4b6a', textAlign: 'left', whiteSpace: 'nowrap', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {apiKeys.map((key, i) => (
                <tr key={key.id} className="table-row" style={{ borderBottom: i < apiKeys.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: '#e4e4f0' }}>{key.name}</div>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <div className="flex items-center gap-2">
                      <span className="mono" style={{ fontSize: 12.5, color: '#9ca3af', background: 'rgba(255,255,255,0.04)', padding: '3px 8px', borderRadius: 5 }}>{key.key}</span>
                      <button className="action-icon-btn" title="Copy" onClick={() => navigator.clipboard.writeText(key.key)}>
                        <CopyIcon size={12}/>
                      </button>
                    </div>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {key.perms.map(p => (
                        <span key={p} className={`badge ${permColor(p)}`} style={{ fontSize: 10.5 }}>{p}</span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '14px 18px', fontSize: 13, color: '#6b7280' }}>{key.created}</td>
                  <td style={{ padding: '14px 18px', fontSize: 13, color: '#6b7280' }}>{key.lastUsed}</td>
                  <td style={{ padding: '14px 18px' }}>
                    <span className={`badge ${key.status === 'active' ? 'badge-running' : 'badge-stopped'}`}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: key.status === 'active' ? '#10b981' : '#6b7280' }}/>
                      {key.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <div className="action-group">
                      <button className="action-icon-btn" title="Rotate"><RefreshIcon size={13}/></button>
                      <button className="action-icon-btn danger" title="Revoke"><TrashIcon size={13}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Docs reminder */}
      <div className="vex-card" style={{ padding: '14px 18px', borderColor: 'rgba(59,130,246,0.15)', background: 'rgba(59,130,246,0.04)' }}>
        <div className="flex items-center gap-3">
          <span style={{ fontSize: 18 }}>📚</span>
          <div>
            <span style={{ fontSize: 13.5, fontWeight: 500, color: '#e4e4f0' }}>API Documentation</span>
            <span style={{ fontSize: 13, color: '#6b7280', marginLeft: 8 }}>Base URL:</span>
            <span className="mono" style={{ fontSize: 12.5, color: '#9ca3af', marginLeft: 6 }}>https://api.vexpanel.io/v2</span>
          </div>
        </div>
      </div>

      {/* Create API Key Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="vex-card-elevated fade-in" style={{ width: '100%', maxWidth: 500, padding: '28px' }}>
            {createdSecret ? (
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>✓</div>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: '#e4e4f0', margin: 0 }}>API Key Created</h3>
                    <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>"{newKeyName}" is ready to use</p>
                  </div>
                </div>
                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '12px 14px', marginBottom: 14 }}>
                  <p style={{ fontSize: 12.5, color: '#f87171', margin: 0, fontWeight: 500 }}>
                    ⚠ Copy your secret key now. You will not be able to see it again.
                  </p>
                </div>
                <div style={{ background: '#020209', borderRadius: 9, border: '1px solid rgba(255,255,255,0.08)', padding: '14px 16px', marginBottom: 20 }}>
                  <div style={{ fontSize: 11, color: '#4b4b6a', marginBottom: 6 }}>Secret API Key</div>
                  <div className="flex items-center gap-3">
                    <span className="mono flex-1" style={{ fontSize: 13, color: '#a78bfa', wordBreak: 'break-all' }}>{createdSecret}</span>
                    <button className="vex-btn vex-btn-primary" style={{ height: 30, fontSize: 12, flexShrink: 0 }} onClick={copySecret}>
                      {copiedSecret ? '✓' : <CopyIcon size={12}/>}
                      {copiedSecret ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
                <button className="vex-btn vex-btn-secondary w-full justify-center" onClick={closeModal} style={{ height: 38 }}>
                  Done
                </button>
              </div>
            ) : (
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#e4e4f0', margin: '0 0 20px' }}>Create API Key</h3>
                <div className="flex flex-col gap-4">
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: '#9ca3af', marginBottom: 6 }}>Key Name</label>
                    <input className="vex-input" placeholder="e.g. Deploy Script" value={newKeyName} onChange={e => setNewKeyName(e.target.value)}/>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: '#9ca3af', marginBottom: 10 }}>Permissions</label>
                    <div className="flex flex-col gap-2">
                      {allPerms.map(perm => (
                        <div
                          key={perm.id}
                          onClick={() => togglePerm(perm.id)}
                          className="flex items-center gap-3"
                          style={{ padding: '10px 13px', borderRadius: 8, border: `1.5px solid ${selectedPerms.includes(perm.id) ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.07)'}`, background: selectedPerms.includes(perm.id) ? 'rgba(124,58,237,0.08)' : 'rgba(255,255,255,0.02)', cursor: 'pointer', transition: 'all 0.15s' }}
                        >
                          <div style={{
                            width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                            border: selectedPerms.includes(perm.id) ? 'none' : '1.5px solid rgba(255,255,255,0.2)',
                            background: selectedPerms.includes(perm.id) ? '#7c3aed' : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            {selectedPerms.includes(perm.id) && (
                              <svg width="10" height="10" viewBox="0 0 10 10"><polyline points="2,5 4,7.5 8,2.5" fill="none" stroke="white" strokeWidth="1.5"/></svg>
                            )}
                          </div>
                          <div>
                            <span style={{ fontSize: 13.5, fontWeight: 500, color: '#e4e4f0' }}>{perm.label}</span>
                            <span style={{ fontSize: 12, color: '#6b7280', marginLeft: 8 }}>{perm.desc}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button className="vex-btn vex-btn-ghost flex-1 justify-center" onClick={closeModal}>Cancel</button>
                  <button className="vex-btn vex-btn-primary flex-1 justify-center" onClick={createKey} disabled={!newKeyName || selectedPerms.length === 0}>
                    Generate Key
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function CopyIcon({ size = 16 }) { return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="4" y="4" width="9" height="9" rx="1.5"/><path d="M4 4V3a1 1 0 00-1-1H3a1 1 0 00-1 1v9a1 1 0 001 1h1"/></svg> }
function RefreshIcon({ size = 16 }) { return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M13.5 8A5.5 5.5 0 112.7 4.5"/><path d="M2.5 2v3h3"/></svg> }
function TrashIcon({ size = 16 }) { return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4h12"/><path d="M5 4V2.5a.5.5 0 01.5-.5h5a.5.5 0 01.5.5V4"/><path d="M3 4l1 9.5a1 1 0 001 .5h6a1 1 0 001-.5L13 4"/></svg> }
