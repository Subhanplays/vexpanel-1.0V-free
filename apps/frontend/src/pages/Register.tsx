import { useState } from 'react'
import { apiJson } from '../lib/api'

interface RegisterProps {
  navigate: (p: string) => void
  area: 'user' | 'admin'
  onSuccess?: (user: { role: string }) => void
}

function getStrength(pass: string): { level: number; label: string; color: string } {
  if (!pass) return { level: 0, label: '', color: '' }
  let score = 0
  if (pass.length >= 8) score++
  if (pass.length >= 12) score++
  if (/[A-Z]/.test(pass)) score++
  if (/[0-9]/.test(pass)) score++
  if (/[^A-Za-z0-9]/.test(pass)) score++
  if (score <= 1) return { level: 1, label: 'Weak', color: '#ef4444' }
  if (score <= 2) return { level: 2, label: 'Fair', color: '#f59e0b' }
  if (score <= 3) return { level: 3, label: 'Good', color: '#3b82f6' }
  return { level: 4, label: 'Strong', color: '#10b981' }
}

export default function Register({ navigate, area, onSuccess }: RegisterProps) {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' })
  const [showPass, setShowPass] = useState(false)
  const [agreed, setAgreed] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const strength = getStrength(form.password)

  const update = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async () => {
    setError('')
    if (form.password !== form.confirm) return setError('Passwords do not match.')
    if (!agreed) return setError('Please accept the setup confirmation to continue.')
    setLoading(true)
    try {
      await apiJson('/api/auth/register', {
        username: form.username,
        email: form.email,
        password: form.password,
      })
      onSuccess?.({ role: 'SUPER_ADMIN' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create admin account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-full auth-grid" style={{ background: '#07070f', position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: 600, height: 400,
        background: 'radial-gradient(ellipse,rgba(124,58,237,0.1) 0%,transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: 440, padding: '24px 16px', position: 'relative', zIndex: 1 }}>
        <div className="flex flex-col items-center mb-7">
          <div className="flex items-center justify-center rounded-[14px] mb-4" style={{ width: 52, height: 52, background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', boxShadow: '0 0 28px rgba(124,58,237,0.45)' }}>
            <svg width="24" height="24" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="2" width="5" height="5" rx="1" fill="white" opacity="0.9"/>
              <rect x="9" y="2" width="5" height="5" rx="1" fill="white" opacity="0.6"/>
              <rect x="2" y="9" width="5" height="5" rx="1" fill="white" opacity="0.6"/>
              <rect x="9" y="9" width="5" height="5" rx="1" fill="white" opacity="0.9"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e4e4f0', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
            Vibe TO <span style={{ color: '#8b5cf6' }}>Vexpanel</span>
          </h1>
          <p style={{ fontSize: 13.5, color: '#6b7280', margin: 0 }}>
            {area === 'admin' ? 'Create the first administrator account' : 'Create your account'}
          </p>
        </div>

        <div className="vex-card-elevated" style={{ padding: 28 }}>
          <div className="flex flex-col gap-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: '#9ca3af', marginBottom: 6 }}>Username</label>
                <input className="vex-input" placeholder="johndoe" value={form.username} onChange={update('username')} />
              </div>
              <div className="flex-1">
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: '#9ca3af', marginBottom: 6 }}>Email</label>
                <input className="vex-input" type="email" placeholder="john@example.com" value={form.email} onChange={update('email')} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label style={{ fontSize: 12.5, fontWeight: 500, color: '#9ca3af' }}>Password</label>
                {form.password && (
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: strength.color }}>{strength.label}</span>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  className="vex-input"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  value={form.password}
                  onChange={update('password')}
                  style={{ paddingRight: 40 }}
                />
                <button
                  onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}
                >
                  {showPass ? <EyeOffIcon size={15}/> : <EyeIcon size={15}/>}
                </button>
              </div>
              {form.password && (
                <div className="flex gap-1.5 mt-2">
                  {[1, 2, 3, 4].map(i => (
                    <div
                      key={i}
                      className="strength-bar"
                      style={{ background: i <= strength.level ? strength.color : 'rgba(255,255,255,0.07)' }}
                    />
                  ))}
                </div>
              )}
              <p style={{ fontSize: 11.5, color: '#4b4b6a', marginTop: 5 }}>
                Use a password you can keep for the lifetime of the panel.
              </p>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: '#9ca3af', marginBottom: 6 }}>Confirm Password</label>
              <input
                className="vex-input"
                type="password"
                placeholder="Repeat your password"
                value={form.confirm}
                onChange={update('confirm')}
                style={{ borderColor: form.confirm && form.confirm !== form.password ? 'rgba(239,68,68,0.5)' : undefined }}
              />
              {form.confirm && form.confirm !== form.password && (
                <p style={{ fontSize: 11.5, color: '#f87171', marginTop: 4 }}>Passwords do not match.</p>
              )}
            </div>

            <div className="flex items-start gap-2.5 mt-1">
              <div
                onClick={() => setAgreed(!agreed)}
                style={{
                  width: 16, height: 16, borderRadius: 4, cursor: 'pointer', flexShrink: 0, marginTop: 1,
                  border: agreed ? 'none' : '1.5px solid rgba(255,255,255,0.2)',
                  background: agreed ? '#7c3aed' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {agreed && <CheckIcon size={10} color="white"/>}
              </div>
              <span style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.5, cursor: 'pointer' }} onClick={() => setAgreed(!agreed)}>
                I confirm this will create the first admin account for the panel.
              </span>
            </div>

            {error && (
              <div style={{ color: '#f87171', fontSize: 12.5, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', padding: '10px 12px', borderRadius: 10 }}>
                {error}
              </div>
            )}

            <button
              className="vex-btn vex-btn-primary w-full justify-center"
              style={{ height: 40, fontSize: 14, fontWeight: 600, marginTop: 4 }}
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <><SpinnerIcon size={15} className="spin" /> Creating admin…</>
              ) : (
                'Create Administrator'
              )}
            </button>
          </div>

          <div className="flex items-center gap-3 my-5">
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
            <span style={{ fontSize: 12, color: '#4b4b6a' }}>panel bootstrap</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
          </div>

          <button className="vex-btn vex-btn-ghost w-full justify-center" style={{ height: 38 }} onClick={() => navigate('login')}>
            Back to login
          </button>
        </div>
      </div>
    </div>
  )
}

function EyeIcon({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2"/></svg>
}
function EyeOffIcon({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 2l12 12M6.5 6.6A2 2 0 0110 9.5M4.5 4.6C3 5.6 1.9 7 1.9 8s2.5 5 6.1 5c1.3 0 2.4-.4 3.4-1"/><path d="M13.5 11.4c1-1 1.6-2.2 1.6-3.4 0-1-2.5-5-7-5-.9 0-1.7.2-2.5.4"/></svg>
}
function CheckIcon({ size = 16, color = 'currentColor' }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="2.5"><polyline points="3,8 6.5,12 13,4"/></svg>
}
function SpinnerIcon({ size = 16, className = '' }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className={className}><circle cx="8" cy="8" r="6" strokeDasharray="25" strokeDashoffset="8" strokeLinecap="round"/></svg>
}
