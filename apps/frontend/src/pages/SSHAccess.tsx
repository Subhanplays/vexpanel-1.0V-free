import { useState } from 'react'

interface SSHAccessProps {
  navigate: (p: string) => void
}

const sshKeys = [
  { id: 'key-1', name: 'MacBook Pro', fingerprint: 'SHA256:xK9mP3...Qr7nT', created: '2024-07-12', lastUsed: '2 min ago', type: 'ED25519' },
  { id: 'key-2', name: 'Work Desktop', fingerprint: 'SHA256:mN4qR8...Yz2wV', created: '2024-06-01', lastUsed: '3 days ago', type: 'RSA 4096' },
  { id: 'key-3', name: 'GitHub Actions', fingerprint: 'SHA256:bC6fL1...Kx9dA', created: '2024-08-01', lastUsed: 'Never', type: 'ED25519' },
  { id: 'key-4', name: 'Deploy Bot', fingerprint: 'SHA256:pE2hJ5...Wv4sQ', created: '2024-05-20', lastUsed: '1 hour ago', type: 'RSA 2048' },
]

export default function SSHAccess({ navigate: _navigate }: SSHAccessProps) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [keyName, setKeyName] = useState('')
  const [pubKey, setPubKey] = useState('')
  const [copied, setCopied] = useState(false)
  const selectedVPS = 'db-primary'
  const ip = '45.67.89.13'

  const copy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div style={{ padding: '28px' }}>
      {/* Connection Card */}
      <div className="vex-card" style={{ padding: '22px 24px', marginBottom: 20 }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e4e4f0', margin: 0 }}>Quick Connect</h3>
            <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>Connect to <span style={{ color: '#a78bfa' }}>{selectedVPS}</span> via SSH</p>
          </div>
          <select className="vex-input" style={{ width: 180, height: 34, fontSize: 13 }}>
            {['db-primary', 'web-prod-01', 'mail-server', 'cache-redis'].map(s => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <div style={{ background: '#020209', borderRadius: 9, padding: '14px 18px', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-between">
            <div>
              <div style={{ fontSize: 11, color: '#4b4b6a', fontFamily: 'monospace', marginBottom: 6 }}>
                # Connect using password or SSH key
              </div>
              <span className="mono" style={{ fontSize: 14, color: '#a78bfa' }}>ssh root@{ip}</span>
            </div>
            <div className="flex items-center gap-2">
              <button className="vex-btn vex-btn-ghost" style={{ height: 30, fontSize: 12 }} onClick={() => copy(`ssh root@${ip}`)}>
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div className="mono" style={{ fontSize: 12, color: '#6b7280' }}>
              # With specific key: ssh -i ~/.ssh/id_ed25519 root@{ip}
            </div>
            <div className="mono" style={{ fontSize: 12, color: '#6b7280' }}>
              # Port forwarding: ssh -L 8080:localhost:80 root@{ip}
            </div>
            <div className="mono" style={{ fontSize: 12, color: '#6b7280' }}>
              # Config entry: Host {selectedVPS} HostName {ip} User root
            </div>
          </div>
        </div>
      </div>

      {/* SSH Keys Table */}
      <div className="vex-card" style={{ overflow: 'hidden' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e4e4f0', margin: 0 }}>SSH Keys</h3>
            <p style={{ fontSize: 12.5, color: '#6b7280', margin: '2px 0 0' }}>Public keys authorized to connect to your VPS instances</p>
          </div>
          <button className="vex-btn vex-btn-primary" style={{ height: 32, fontSize: 12.5 }} onClick={() => setShowAddModal(true)}>
            + Add SSH Key
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {['Name', 'Type', 'Fingerprint', 'Created', 'Last Used', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 18px', fontSize: 11, fontWeight: 600, color: '#4b4b6a', textAlign: 'left', whiteSpace: 'nowrap', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sshKeys.map((key, i) => (
                <tr key={key.id} className="table-row" style={{ borderBottom: i < sshKeys.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <td style={{ padding: '14px 18px' }}>
                    <div className="flex items-center gap-3">
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <KeyIcon size={14} style={{ color: '#a78bfa' }}/>
                      </div>
                      <span style={{ fontSize: 13.5, fontWeight: 600, color: '#e4e4f0' }}>{key.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span className="badge badge-purple mono" style={{ fontSize: 11 }}>{key.type}</span>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span className="mono" style={{ fontSize: 12, color: '#9ca3af' }}>{key.fingerprint}</span>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span style={{ fontSize: 13, color: '#6b7280' }}>{key.created}</span>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span style={{ fontSize: 13, color: key.lastUsed === 'Never' ? '#4b4b6a' : '#6b7280' }}>{key.lastUsed}</span>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <div className="action-group">
                      <button className="action-icon-btn" title="Edit name"><EditIcon size={13}/></button>
                      <button className="action-icon-btn danger" title="Delete"><TrashIcon size={13}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security tips */}
      <div className="vex-card" style={{ padding: '16px 20px', marginTop: 16, borderColor: 'rgba(59,130,246,0.15)', background: 'rgba(59,130,246,0.04)' }}>
        <div className="flex items-start gap-3">
          <div style={{ color: '#60a5fa', flexShrink: 0, marginTop: 2 }}>
            <InfoIcon size={16}/>
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#e4e4f0', margin: '0 0 6px' }}>Security Recommendations</p>
            <ul style={{ fontSize: 12.5, color: '#9ca3af', margin: 0, paddingLeft: 18, lineHeight: 1.8 }}>
              <li>Use ED25519 keys — they are faster and more secure than RSA</li>
              <li>Protect your private key with a passphrase</li>
              <li>Disable root password authentication when using SSH keys</li>
              <li>Rotate keys regularly and remove unused ones</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Add SSH Key Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowAddModal(false)}>
          <div className="vex-card-elevated fade-in" style={{ width: '100%', maxWidth: 520, padding: '28px' }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#e4e4f0', margin: '0 0 6px' }}>Add SSH Key</h3>
            <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 20px' }}>Add your public key to authorize SSH access</p>
            <div className="flex flex-col gap-4">
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: '#9ca3af', marginBottom: 6 }}>Key Name</label>
                <input className="vex-input" placeholder="e.g. My Laptop" value={keyName} onChange={e => setKeyName(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: '#9ca3af', marginBottom: 6 }}>Public Key</label>
                <textarea
                  className="vex-input mono"
                  rows={5}
                  placeholder="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAA... user@host"
                  value={pubKey}
                  onChange={e => setPubKey(e.target.value)}
                  style={{ resize: 'vertical', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, lineHeight: 1.5 }}
                />
              </div>
            </div>
            <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: '10px 14px', marginTop: 14 }}>
              <p style={{ fontSize: 12.5, color: '#fbbf24', margin: 0 }}>
                ⚠ Add your <strong>public</strong> key only (~/.ssh/id_ed25519.pub). Never share your private key.
              </p>
            </div>
            <div className="flex gap-3 mt-6">
              <button className="vex-btn vex-btn-ghost flex-1 justify-center" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="vex-btn vex-btn-primary flex-1 justify-center" onClick={() => setShowAddModal(false)} disabled={!keyName || !pubKey}>
                Add Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function KeyIcon({ size = 16, style = {} }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={style}><circle cx="6.5" cy="6.5" r="3"/><path d="M8.5 8.5l5 5"/><path d="M11.5 11.5l1.5-1.5"/></svg>
}
function EditIcon({ size = 16 }) { return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11.5 2.5a2 2 0 012 2L5 13H2v-3L11.5 2.5z"/></svg> }
function TrashIcon({ size = 16 }) { return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4h12"/><path d="M5 4V2.5a.5.5 0 01.5-.5h5a.5.5 0 01.5.5V4"/><path d="M3 4l1 9.5a1 1 0 001 .5h6a1 1 0 001-.5L13 4"/></svg> }
function InfoIcon({ size = 16 }) { return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6"/><line x1="8" y1="7" x2="8" y2="11"/><circle cx="8" cy="5" r="0.5" fill="currentColor" stroke="none"/></svg> }
