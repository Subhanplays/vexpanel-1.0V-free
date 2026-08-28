import { useState } from 'react'

type SettingsTab = 'profile' | 'security' | 'preferences' | 'appearance'

const sessions = [
  { device: 'MacBook Pro 16"', location: 'Berlin, Germany', ip: '195.20.14.10', lastSeen: 'Active now', current: true },
  { device: 'iPhone 15 Pro', location: 'Berlin, Germany', ip: '195.20.14.11', lastSeen: '2 hours ago', current: false },
  { device: 'Chrome · Windows 11', location: 'Hamburg, Germany', ip: '195.20.17.55', lastSeen: '3 days ago', current: false },
]

export default function Settings({ navigate: _navigate }: { navigate: (p: string) => void }) {
  const [tab, setTab] = useState<SettingsTab>('profile')
  const [profile, setProfile] = useState({ username: 'admin', email: 'admin@vexpanel.io', bio: '' })
  const [twoFa, setTwoFa] = useState(false)
  const [appearance, setAppearance] = useState<'dark' | 'light' | 'system'>('dark')
  const [lang, setLang] = useState('English')
  const [tz, setTz] = useState('Europe/Berlin')
  const [notifications, setNotifications] = useState({ email: true, push: true, slack: false, vpsAlerts: true, securityAlerts: true, billing: true })

  const tabs: { id: SettingsTab; label: string; icon: string }[] = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'security', label: 'Security', icon: '🛡️' },
    { id: 'preferences', label: 'Preferences', icon: '⚙️' },
    { id: 'appearance', label: 'Appearance', icon: '🎨' },
  ]

  return (
    <div style={{ padding: '28px', maxWidth: 900 }}>
      <div className="flex gap-6">
        {/* Sidebar tabs */}
        <div style={{ width: 200, flexShrink: 0 }}>
          <div className="vex-card" style={{ padding: '8px' }}>
            {tabs.map(t => (
              <button
                key={t.id}
                className={`sidebar-item w-full ${tab === t.id ? 'active' : ''}`}
                onClick={() => setTab(t.id)}
              >
                <span>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {tab === 'profile' && (
            <div className="vex-card" style={{ padding: '24px 26px' }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#e4e4f0', margin: '0 0 6px' }}>Profile Settings</h3>
              <p style={{ fontSize: 13.5, color: '#6b7280', margin: '0 0 24px' }}>Manage your account details and public profile.</p>

              {/* Avatar */}
              <div className="flex items-center gap-4 mb-6 pb-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ width: 64, height: 64, borderRadius: 14, background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: '#fff', boxShadow: '0 0 20px rgba(124,58,237,0.3)' }}>
                  A
                </div>
                <div>
                  <button className="vex-btn vex-btn-secondary" style={{ height: 32, fontSize: 12.5 }}>Change Avatar</button>
                  <p style={{ fontSize: 11.5, color: '#4b4b6a', margin: '6px 0 0' }}>JPG, PNG or GIF. Max 2MB.</p>
                </div>
              </div>

              <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
                {[
                  { label: 'Username', key: 'username', type: 'text', placeholder: 'username' },
                  { label: 'Email Address', key: 'email', type: 'email', placeholder: 'email@example.com' },
                ].map(field => (
                  <div key={field.key}>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: '#9ca3af', marginBottom: 6 }}>{field.label}</label>
                    <input
                      className="vex-input"
                      type={field.type}
                      placeholder={field.placeholder}
                      value={profile[field.key as keyof typeof profile]}
                      onChange={e => setProfile(p => ({ ...p, [field.key]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-5 flex justify-end">
                <button className="vex-btn vex-btn-primary" style={{ height: 36 }}>Save Profile</button>
              </div>
            </div>
          )}

          {tab === 'security' && (
            <div className="flex flex-col gap-5">
              {/* Change Password */}
              <div className="vex-card" style={{ padding: '22px 24px' }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e4e4f0', margin: '0 0 18px' }}>Change Password</h3>
                <div className="flex flex-col gap-4">
                  {[
                    { label: 'Current Password', placeholder: 'Enter current password' },
                    { label: 'New Password', placeholder: 'Enter new password' },
                    { label: 'Confirm New Password', placeholder: 'Confirm new password' },
                  ].map(f => (
                    <div key={f.label}>
                      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: '#9ca3af', marginBottom: 6 }}>{f.label}</label>
                      <input className="vex-input" type="password" placeholder={f.placeholder}/>
                    </div>
                  ))}
                  <div className="flex justify-end">
                    <button className="vex-btn vex-btn-primary" style={{ height: 36 }}>Update Password</button>
                  </div>
                </div>
              </div>

              {/* 2FA */}
              <div className="vex-card" style={{ padding: '22px 24px' }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e4e4f0', margin: 0 }}>Two-Factor Authentication</h3>
                    <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>Add an extra layer of security to your account</p>
                  </div>
                  <div
                    onClick={() => setTwoFa(!twoFa)}
                    style={{ width: 44, height: 26, borderRadius: 13, cursor: 'pointer', background: twoFa ? '#7c3aed' : 'rgba(255,255,255,0.1)', position: 'relative', transition: 'background 0.2s' }}
                  >
                    <div style={{ position: 'absolute', top: 3, left: twoFa ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }}/>
                  </div>
                </div>
                {twoFa ? (
                  <div style={{ padding: '12px 14px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8 }}>
                    <p style={{ fontSize: 13, color: '#34d399', margin: 0 }}>✓ 2FA is enabled via Authenticator app</p>
                  </div>
                ) : (
                  <button className="vex-btn vex-btn-primary" style={{ height: 34 }}>Enable 2FA</button>
                )}
              </div>

              {/* Sessions */}
              <div className="vex-card" style={{ overflow: 'hidden' }}>
                <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e4e4f0', margin: 0 }}>Active Sessions</h3>
                  <button className="vex-btn vex-btn-danger" style={{ height: 30, fontSize: 12 }}>Revoke All Others</button>
                </div>
                <div>
                  {sessions.map((s, i) => (
                    <div key={i} className="flex items-center justify-between" style={{ padding: '14px 20px', borderBottom: i < sessions.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                      <div className="flex items-center gap-3">
                        <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                          {s.device.includes('iPhone') ? '📱' : s.device.includes('Chrome') ? '🌐' : '💻'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span style={{ fontSize: 13.5, fontWeight: 600, color: '#e4e4f0' }}>{s.device}</span>
                            {s.current && <span className="badge badge-running" style={{ fontSize: 10 }}>Current</span>}
                          </div>
                          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{s.location} · {s.ip}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span style={{ fontSize: 12, color: s.current ? '#34d399' : '#6b7280' }}>{s.lastSeen}</span>
                        {!s.current && <button className="vex-btn vex-btn-danger" style={{ height: 28, fontSize: 11.5 }}>Revoke</button>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'preferences' && (
            <div className="vex-card" style={{ padding: '22px 24px' }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#e4e4f0', margin: '0 0 24px' }}>Preferences</h3>
              <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: '#9ca3af', marginBottom: 6 }}>Language</label>
                  <select className="vex-input" value={lang} onChange={e => setLang(e.target.value)}>
                    {['English', 'German', 'French', 'Spanish', 'Japanese'].map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: '#9ca3af', marginBottom: 6 }}>Timezone</label>
                  <select className="vex-input" value={tz} onChange={e => setTz(e.target.value)}>
                    {['UTC', 'Europe/Berlin', 'America/New_York', 'Asia/Tokyo', 'Australia/Sydney'].map(z => <option key={z}>{z}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginTop: 24, borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 20 }}>
                <p style={{ fontSize: 13.5, fontWeight: 600, color: '#e4e4f0', margin: '0 0 14px' }}>Notifications</p>
                <div className="flex flex-col gap-3">
                  {Object.entries({ email: 'Email Notifications', push: 'Browser Push Notifications', slack: 'Slack Notifications', vpsAlerts: 'VPS Status Alerts', securityAlerts: 'Security Alerts', billing: 'Billing Notifications' }).map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between" style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.03)' }}>
                      <span style={{ fontSize: 13.5, color: '#c4c4d4' }}>{label}</span>
                      <div
                        onClick={() => setNotifications(n => ({ ...n, [key]: !n[key as keyof typeof n] }))}
                        style={{ width: 38, height: 22, borderRadius: 11, cursor: 'pointer', background: notifications[key as keyof typeof notifications] ? '#7c3aed' : 'rgba(255,255,255,0.1)', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}
                      >
                        <div style={{ position: 'absolute', top: 3, left: notifications[key as keyof typeof notifications] ? 19 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}/>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button className="vex-btn vex-btn-primary" style={{ height: 36 }}>Save Preferences</button>
              </div>
            </div>
          )}

          {tab === 'appearance' && (
            <div className="vex-card" style={{ padding: '22px 24px' }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#e4e4f0', margin: '0 0 6px' }}>Appearance</h3>
              <p style={{ fontSize: 13.5, color: '#6b7280', margin: '0 0 24px' }}>Customize how VexPanel looks for you.</p>
              <p style={{ fontSize: 13, fontWeight: 500, color: '#9ca3af', margin: '0 0 12px' }}>Color Scheme</p>
              <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 24 }}>
                {[
                  { id: 'dark', label: 'Dark', desc: 'Easy on the eyes', preview: ['#07070f', '#0d0d1a', '#8b5cf6'] },
                  { id: 'light', label: 'Light', desc: 'Classic interface', preview: ['#f8fafc', '#ffffff', '#7c3aed'] },
                  { id: 'system', label: 'System', desc: 'Follows OS setting', preview: ['#1e1e2e', '#12122a', '#a78bfa'] },
                ].map(theme => (
                  <div
                    key={theme.id}
                    onClick={() => setAppearance(theme.id as 'dark' | 'light' | 'system')}
                    style={{
                      borderRadius: 10, border: `2px solid ${appearance === theme.id ? '#7c3aed' : 'rgba(255,255,255,0.07)'}`,
                      background: appearance === theme.id ? 'rgba(124,58,237,0.1)' : 'rgba(255,255,255,0.02)',
                      padding: '16px', cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    <div className="flex gap-1 mb-3">
                      {theme.preview.map((c, i) => (
                        <div key={i} style={{ flex: 1, height: 36, borderRadius: 6, background: c }}/>
                      ))}
                    </div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: '#e4e4f0' }}>{theme.label}</div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{theme.desc}</div>
                    {appearance === theme.id && (
                      <div style={{ marginTop: 8, fontSize: 11.5, color: '#a78bfa', fontWeight: 500 }}>✓ Active</div>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 20 }}>
                <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
                  VexPanel defaults to Dark mode for optimal visibility in infrastructure environments.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
