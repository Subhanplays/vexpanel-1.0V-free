import { useState } from 'react'

interface RDPDesktopProps {
  navigate: (p: string) => void
}

const desktops = [
  { id: 'rdp-1', name: 'Ubuntu Desktop Dev', status: 'running', cpu: 28, ram: 42, disk: 35, port: 3389, ip: '45.67.89.13', resolution: '1920x1080', uptime: '3d 14h' },
  { id: 'rdp-2', name: 'Design Workstation', status: 'stopped', cpu: 0, ram: 0, disk: 52, port: 3390, ip: '45.67.89.14', resolution: '2560x1440', uptime: '—' },
]

export default function RDPDesktop({ navigate: _navigate }: RDPDesktopProps) {
  const [selected, setSelected] = useState(desktops[0])
  const [pinggyUrl] = useState('tcp://rtc-fra1.pinggy.io:44821')
  const [cloudflareUrl] = useState('https://db-primary-rdp.trycloudflare.com')
  const [settings, setSettings] = useState({
    name: 'Ubuntu Desktop Dev',
    resolution: '1920x1080',
    username: 'vexuser',
    password: '',
    autoStart: true,
    port: '3389',
  })
  const [showSettings, setShowSettings] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <div style={{ padding: '28px 28px 48px' }}>
      <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 380px' }}>
        {/* Left column */}
        <div className="flex flex-col gap-5">
          {/* Desktop selector */}
          <div className="vex-card" style={{ padding: '0', overflow: 'hidden' }}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e4e4f0', margin: 0 }}>Desktop Instances</h3>
            </div>
            <div>
              {desktops.map(desktop => (
                <div
                  key={desktop.id}
                  onClick={() => setSelected(desktop)}
                  style={{
                    padding: '16px 20px',
                    cursor: 'pointer',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    background: selected.id === desktop.id ? 'rgba(124,58,237,0.07)' : 'transparent',
                    borderLeft: selected.id === desktop.id ? '2px solid #7c3aed' : '2px solid transparent',
                    transition: 'all 0.15s',
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                        🖥️
                      </div>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: '#e4e4f0' }}>{desktop.name}</div>
                        <div style={{ fontSize: 11.5, color: '#6b7280', marginTop: 1 }}>{desktop.resolution} · Port {desktop.port}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`badge ${desktop.status === 'running' ? 'badge-running' : 'badge-stopped'}`}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: desktop.status === 'running' ? '#10b981' : '#6b7280' }}/>
                        {desktop.status.charAt(0).toUpperCase() + desktop.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  {desktop.status === 'running' && (
                    <div className="flex gap-4">
                      {[
                        { label: 'CPU', value: desktop.cpu, color: '#8b5cf6' },
                        { label: 'RAM', value: desktop.ram, color: '#3b82f6' },
                        { label: 'Disk', value: desktop.disk, color: '#10b981' },
                      ].map(r => (
                        <div key={r.label} className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span style={{ fontSize: 11, color: '#6b7280' }}>{r.label}</span>
                            <span className="mono" style={{ fontSize: 11, color: '#6b7280' }}>{r.value}%</span>
                          </div>
                          <div className="resource-bar-track">
                            <div className="resource-bar-fill" style={{ width: `${r.value}%`, background: r.color }}/>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="px-5 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button className="vex-btn vex-btn-primary" style={{ height: 32, fontSize: 12.5 }}>
                    <MonitorIcon size={13}/> Open Desktop
                  </button>
                  {selected.status === 'running' ? (
                    <button className="vex-btn vex-btn-ghost" style={{ height: 32, fontSize: 12.5 }}>
                      <StopIcon size={13}/> Stop
                    </button>
                  ) : (
                    <button className="vex-btn vex-btn-success" style={{ height: 32, fontSize: 12.5 }}>
                      <PlayIcon size={13}/> Start
                    </button>
                  )}
                  <button className="vex-btn vex-btn-ghost" style={{ height: 32, fontSize: 12.5 }}>
                    <RefreshIcon size={13}/> Restart
                  </button>
                </div>
                <span style={{ fontSize: 11.5, color: '#4b4b6a' }}>Uptime: <span className="mono">{selected.uptime}</span></span>
              </div>
            </div>
          </div>

          {/* Connection Methods */}
          <div className="vex-card" style={{ padding: '0', overflow: 'hidden' }}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e4e4f0', margin: 0 }}>Public Connection URLs</h3>
              <p style={{ fontSize: 12.5, color: '#6b7280', margin: '4px 0 0' }}>Connect to your desktop remotely via any RDP client</p>
            </div>
            <div style={{ padding: '16px 20px' }}>
              {/* Pinggy */}
              <div className="vex-card" style={{ padding: '16px 18px', marginBottom: 14, borderColor: 'rgba(139,92,246,0.2)', background: 'rgba(124,58,237,0.04)' }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      ⚡
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#e4e4f0' }}>Pinggy</div>
                      <div style={{ fontSize: 11, color: '#6b7280' }}>TCP tunnel · Low latency</div>
                    </div>
                  </div>
                  <span className="badge badge-running">Active</span>
                </div>
                <div className="flex items-center gap-2" style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 7, padding: '8px 12px' }}>
                  <span className="mono flex-1" style={{ fontSize: 12, color: '#c4c4d4', overflowX: 'auto', whiteSpace: 'nowrap' }}>{pinggyUrl}</span>
                  <div className="flex items-center gap-1.5">
                    <button className="vex-btn vex-btn-ghost" style={{ height: 26, fontSize: 11.5, padding: '0 8px' }} onClick={() => copy(pinggyUrl, 'pinggy')}>
                      {copied === 'pinggy' ? '✓' : 'Copy'}
                    </button>
                    <button className="vex-btn vex-btn-ghost" style={{ height: 26, fontSize: 11.5, padding: '0 8px' }}>
                      Open
                    </button>
                    <button className="vex-btn vex-btn-ghost" style={{ height: 26, fontSize: 11.5, padding: '0 8px' }}>
                      ↺ Regen
                    </button>
                  </div>
                </div>
                <p style={{ fontSize: 11.5, color: '#6b7280', margin: '8px 0 0' }}>Use any RDP client: <span className="mono" style={{ color: '#9ca3af' }}>mstsc /v:{pinggyUrl.replace('tcp://', '')}</span></p>
              </div>

              {/* Cloudflare */}
              <div className="vex-card" style={{ padding: '16px 18px', borderColor: 'rgba(245,158,11,0.15)', background: 'rgba(245,158,11,0.03)' }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      ☁️
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#e4e4f0' }}>Cloudflare TryCloudflare</div>
                      <div style={{ fontSize: 11, color: '#6b7280' }}>HTTPS tunnel · No account needed</div>
                    </div>
                  </div>
                  <span className="badge badge-running">Active</span>
                </div>
                <div className="flex items-center gap-2" style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 7, padding: '8px 12px' }}>
                  <span className="mono flex-1" style={{ fontSize: 12, color: '#c4c4d4', overflowX: 'auto', whiteSpace: 'nowrap' }}>{cloudflareUrl}</span>
                  <div className="flex items-center gap-1.5">
                    <button className="vex-btn vex-btn-ghost" style={{ height: 26, fontSize: 11.5, padding: '0 8px' }} onClick={() => copy(cloudflareUrl, 'cf')}>
                      {copied === 'cf' ? '✓' : 'Copy'}
                    </button>
                    <button className="vex-btn vex-btn-ghost" style={{ height: 26, fontSize: 11.5, padding: '0 8px' }}>
                      Open
                    </button>
                    <button className="vex-btn vex-btn-ghost" style={{ height: 26, fontSize: 11.5, padding: '0 8px' }}>
                      ↺ Regen
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Settings */}
        <div className="vex-card" style={{ overflow: 'hidden', alignSelf: 'start' }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e4e4f0', margin: 0 }}>Desktop Settings</h3>
            <button className="vex-btn vex-btn-ghost" style={{ height: 28, fontSize: 12 }} onClick={() => setShowSettings(!showSettings)}>
              {showSettings ? 'Cancel' : 'Edit'}
            </button>
          </div>
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'Desktop Name', key: 'name', type: 'text', value: settings.name },
              { label: 'Resolution', key: 'resolution', type: 'select', value: settings.resolution, options: ['1280x720', '1920x1080', '2560x1440', '3840x2160'] },
              { label: 'Username', key: 'username', type: 'text', value: settings.username },
              { label: 'Password', key: 'password', type: 'password', value: settings.password },
              { label: 'Port', key: 'port', type: 'text', value: settings.port },
            ].map(field => (
              <div key={field.key}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#6b7280', marginBottom: 5 }}>{field.label}</label>
                {field.type === 'select' ? (
                  <select
                    className="vex-input"
                    disabled={!showSettings}
                    value={field.value}
                    onChange={e => setSettings(s => ({ ...s, [field.key]: e.target.value }))}
                    style={{ height: 34, fontSize: 13, cursor: showSettings ? 'pointer' : 'default', opacity: showSettings ? 1 : 0.7 }}
                  >
                    {field.options?.map(o => <option key={o}>{o}</option>)}
                  </select>
                ) : (
                  <input
                    className="vex-input"
                    type={field.type}
                    disabled={!showSettings}
                    value={field.value}
                    onChange={e => setSettings(s => ({ ...s, [field.key]: e.target.value }))}
                    style={{ height: 34, fontSize: 13, opacity: showSettings ? 1 : 0.7, cursor: showSettings ? 'text' : 'default' }}
                  />
                )}
              </div>
            ))}

            {/* Auto-start toggle */}
            <div className="flex items-center justify-between" style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.07)' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#e4e4f0' }}>Auto-Start</div>
                <div style={{ fontSize: 11.5, color: '#6b7280', marginTop: 2 }}>Start desktop with VPS</div>
              </div>
              <div
                onClick={() => showSettings && setSettings(s => ({ ...s, autoStart: !s.autoStart }))}
                style={{
                  width: 38, height: 22, borderRadius: 11, cursor: showSettings ? 'pointer' : 'default',
                  background: settings.autoStart ? '#7c3aed' : 'rgba(255,255,255,0.1)',
                  position: 'relative', transition: 'background 0.2s', opacity: showSettings ? 1 : 0.7,
                }}
              >
                <div style={{ position: 'absolute', top: 3, left: settings.autoStart ? 19 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}/>
              </div>
            </div>

            {showSettings && (
              <button className="vex-btn vex-btn-primary w-full justify-center" style={{ height: 36 }} onClick={() => setShowSettings(false)}>
                Save Settings
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function MonitorIcon({ size = 16 }) { return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1.5" y="2" width="13" height="9" rx="1.5"/><path d="M5.5 14h5M8 11v3"/></svg> }
function PlayIcon({ size = 16 }) { return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="4,2.5 13.5,8 4,13.5"/></svg> }
function StopIcon({ size = 16 }) { return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="10" height="10" rx="1.5"/></svg> }
function RefreshIcon({ size = 16 }) { return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M13.5 8A5.5 5.5 0 112.7 4.5"/><path d="M2.5 2v3h3"/></svg> }
