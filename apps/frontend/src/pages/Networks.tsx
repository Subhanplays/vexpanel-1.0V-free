import { useState } from 'react'

interface NetworksProps {
  navigate: (p: string) => void
}

const networks = [
  { id: 'net-1', name: 'public-bridge', type: 'Bridge', ipv4: '45.67.89.0/24', ipv6: '2a01:4f8::/64', status: 'active', attached: 4, gateway: '45.67.89.1', dns: '8.8.8.8, 1.1.1.1' },
  { id: 'net-2', name: 'private-net-01', type: 'Private', ipv4: '10.0.1.0/24', ipv6: '—', status: 'active', attached: 3, gateway: '10.0.1.1', dns: '10.0.1.1' },
  { id: 'net-3', name: 'vpc-backend', type: 'Private', ipv4: '192.168.10.0/24', ipv6: '—', status: 'active', attached: 2, gateway: '192.168.10.1', dns: '192.168.10.1' },
  { id: 'net-4', name: 'dmz-network', type: 'Bridge', ipv4: '172.16.0.0/24', ipv6: '—', status: 'inactive', attached: 0, gateway: '172.16.0.1', dns: '8.8.8.8' },
]

export default function Networks({ navigate: _navigate }: NetworksProps) {
  const [showModal, setShowModal] = useState(false)
  const [newNet, setNewNet] = useState({ name: '', type: 'Bridge', subnet: '', gateway: '' })

  return (
    <div style={{ padding: '28px' }}>
      {/* Stats */}
      <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {[
          { label: 'Total Networks', value: '4', color: '#8b5cf6' },
          { label: 'Active', value: '3', color: '#10b981' },
          { label: 'Bridge Networks', value: '2', color: '#3b82f6' },
          { label: 'Private Networks', value: '2', color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} className="vex-card" style={{ padding: '16px 18px' }}>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Networks table */}
      <div className="vex-card" style={{ overflow: 'hidden', marginBottom: 20 }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e4e4f0', margin: 0 }}>All Networks</h3>
          <button className="vex-btn vex-btn-primary" style={{ height: 32, fontSize: 12.5 }} onClick={() => setShowModal(true)}>
            + Create Network
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {['Name', 'Type', 'IPv4 Subnet', 'IPv6', 'Gateway', 'Status', 'Attached VPS', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#4b4b6a', textAlign: 'left', whiteSpace: 'nowrap', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {networks.map((net, i) => (
                <tr key={net.id} className="table-row" style={{ borderBottom: i < networks.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: '#e4e4f0' }}>{net.name}</div>
                    <div style={{ fontSize: 11, color: '#4b4b6a', marginTop: 2 }}>DNS: {net.dns}</div>
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <span className={`badge ${net.type === 'Bridge' ? 'badge-info' : 'badge-purple'}`}>{net.type}</span>
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <span className="mono" style={{ fontSize: 12.5, color: '#9ca3af' }}>{net.ipv4}</span>
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <span className="mono" style={{ fontSize: 12, color: net.ipv6 !== '—' ? '#9ca3af' : '#3a3a5a' }}>{net.ipv6}</span>
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <span className="mono" style={{ fontSize: 12.5, color: '#9ca3af' }}>{net.gateway}</span>
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <span className={`badge ${net.status === 'active' ? 'badge-running' : 'badge-stopped'}`}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: net.status === 'active' ? '#10b981' : '#6b7280' }}/>
                      {net.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#e4e4f0' }}>{net.attached}</span>
                      {net.attached > 0 && (
                        <div className="flex">
                          {Array.from({ length: Math.min(net.attached, 3) }).map((_, i) => (
                            <div key={i} style={{ width: 18, height: 18, borderRadius: '50%', background: `hsl(${260 + i * 30},70%,60%)`, border: '2px solid #0d0d1a', marginLeft: i > 0 ? -6 : 0, fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                              {String.fromCharCode(65 + i)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <div className="action-group">
                      <button className="action-icon-btn" title="Edit"><EditIcon size={13}/></button>
                      <button className="action-icon-btn" title="Details"><InfoIcon size={13}/></button>
                      <button className="action-icon-btn danger" title="Delete" style={{ opacity: net.attached > 0 ? 0.3 : 1 }} disabled={net.attached > 0}>
                        <TrashIcon size={13}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Network Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="vex-card-elevated fade-in" style={{ width: '100%', maxWidth: 480, padding: '28px' }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#e4e4f0', margin: '0 0 20px' }}>Create Network</h3>
            <div className="flex flex-col gap-4">
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: '#9ca3af', marginBottom: 6 }}>Network Name</label>
                <input className="vex-input" placeholder="my-network" value={newNet.name} onChange={e => setNewNet(n => ({ ...n, name: e.target.value }))} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: '#9ca3af', marginBottom: 6 }}>Type</label>
                <select className="vex-input" value={newNet.type} onChange={e => setNewNet(n => ({ ...n, type: e.target.value }))}>
                  <option>Bridge</option>
                  <option>Private</option>
                  <option>NAT</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: '#9ca3af', marginBottom: 6 }}>IPv4 Subnet (CIDR)</label>
                <input className="vex-input mono" placeholder="192.168.100.0/24" value={newNet.subnet} onChange={e => setNewNet(n => ({ ...n, subnet: e.target.value }))} style={{ fontSize: 13 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: '#9ca3af', marginBottom: 6 }}>Gateway</label>
                <input className="vex-input mono" placeholder="192.168.100.1" value={newNet.gateway} onChange={e => setNewNet(n => ({ ...n, gateway: e.target.value }))} style={{ fontSize: 13 }} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button className="vex-btn vex-btn-ghost flex-1 justify-center" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="vex-btn vex-btn-primary flex-1 justify-center" onClick={() => setShowModal(false)}>Create Network</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function EditIcon({ size = 16 }) { return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11.5 2.5a2 2 0 012 2L5 13H2v-3L11.5 2.5z"/></svg> }
function InfoIcon({ size = 16 }) { return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6"/><line x1="8" y1="7" x2="8" y2="11"/><circle cx="8" cy="5" r="0.5" fill="currentColor" stroke="none"/></svg> }
function TrashIcon({ size = 16 }) { return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4h12"/><path d="M5 4V2.5a.5.5 0 01.5-.5h5a.5.5 0 01.5.5V4"/><path d="M3 4l1 9.5a1 1 0 001 .5h6a1 1 0 001-.5L13 4"/></svg> }
