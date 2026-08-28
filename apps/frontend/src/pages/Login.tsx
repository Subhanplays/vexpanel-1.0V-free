import { useState } from 'react'
import { apiJson } from '../lib/api'

interface LoginProps {
  navigate: (p: string) => void
  onLogin: (user: { role: string }, area?: 'user' | 'admin') => void
  area: 'user' | 'admin'
}

export default function Login({ navigate, onLogin, area }: LoginProps) {
  const [email, setEmail] = useState('admin@vexpanel.io')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSignIn = async () => {
    setLoading(true)
    setError('')
    try {
      const result = await apiJson<{ user: { role: string } }>('/api/auth/login', { email, password })
      const nextArea = result.user.role === 'SUPER_ADMIN' || result.user.role === 'ADMIN' ? area : 'user'
      onLogin(result.user, nextArea)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="flex items-center justify-center min-h-full auth-grid"
      style={{ background: '#07070f', position: 'relative', overflow: 'hidden' }}
    >
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 600,
        height: 400,
        background: 'radial-gradient(ellipse,rgba(124,58,237,0.12) 0%,transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: 420, padding: '24px 16px', position: 'relative', zIndex: 1 }}>
        <div className="flex flex-col items-center mb-8">
          <div
            className="flex items-center justify-center rounded-[14px] mb-4"
            style={{
              width: 52,
              height: 52,
              background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
              boxShadow: '0 0 28px rgba(124,58,237,0.45)',
            }}
          >
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
          <p style={{ fontSize: 13.5, color: '#6b7280', margin: 0 }}>Sign in to continue</p>
        </div>

        <div className="vex-card-elevated" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 17, fontWeight: 600, color: '#e4e4f0', margin: '0 0 6px' }}>Welcome back</h2>
          <p style={{ fontSize: 13.5, color: '#6b7280', margin: '0 0 24px' }}>
            {area === 'admin' ? 'Enter your admin account to open the control panel.' : 'Sign in to your account to continue.'}
          </p>

          <div className="flex flex-col gap-4">
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: '#9ca3af', marginBottom: 6 }}>Email address</label>
              <input
                className="vex-input"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label style={{ fontSize: 12.5, fontWeight: 500, color: '#9ca3af' }}>Password</label>
                <button style={{ fontSize: 12, color: '#7c3aed', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  Forgot password?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  className="vex-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{ paddingRight: 40 }}
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 2,
                  }}
                >
                  {showPassword ? <EyeOffIcon size={15}/> : <EyeIcon size={15}/>}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div
                onClick={() => setRemember(!remember)}
                style={{
                  width: 16, height: 16, borderRadius: 4, cursor: 'pointer', flexShrink: 0,
                  border: remember ? 'none' : '1.5px solid rgba(255,255,255,0.2)',
                  background: remember ? '#7c3aed' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.15s, border 0.15s',
                }}
              >
                {remember && <CheckIcon size={10} color="white"/>}
              </div>
              <span style={{ fontSize: 13, color: '#9ca3af', cursor: 'pointer', userSelect: 'none' }} onClick={() => setRemember(!remember)}>
                Keep me signed in
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
              onClick={handleSignIn}
              disabled={loading}
            >
              {loading ? (
                <><SpinnerIcon size={15} className="spin" /> Signing in...</>
              ) : (
                'Sign In'
              )}
            </button>
          </div>

          <div className="flex items-center gap-3 my-5">
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
            <span style={{ fontSize: 12, color: '#4b4b6a' }}>or continue with</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
          </div>

          <div className="flex gap-3">
            <button className="vex-btn vex-btn-ghost flex-1 justify-center" style={{ height: 38 }} onClick={() => setError('Discord login is configured from the backend. Use email/password for now.')}>
              <DiscordIcon size={16} />
              Discord
            </button>
            <button className="vex-btn vex-btn-ghost flex-1 justify-center" style={{ height: 38 }} onClick={() => setError('Google login is not wired yet.')}>
              <GoogleIcon size={16} />
              Google
            </button>
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: '#6b7280', marginTop: 16 }}>
          {"Need the first admin account? "}
          <button
            onClick={() => navigate('register')}
            style={{ color: '#8b5cf6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, padding: 0 }}
          >
            Register the panel owner
          </button>
        </p>

        <p style={{ textAlign: 'center', fontSize: 11, color: '#3a3a5a', marginTop: 8 }}>
          Vibe TO Vexpanel · Secure panel login
        </p>
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
function DiscordIcon({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor"><path d="M13.545 2.907a13.227 13.227 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.19 12.19 0 0 0-3.658 0 8.258 8.258 0 0 0-.412-.833.051.051 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.041.041 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032c.001.014.01.028.021.037a13.276 13.276 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019 9.278 9.278 0 0 0 .802-1.304.048.048 0 0 0-.01-.057 8.752 8.752 0 0 1-1.249-.595.049.049 0 0 1-.005-.083c.084-.063.168-.129.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.052.052 0 0 1 .053.007c.08.066.164.132.248.195a.049.049 0 0 1-.004.083 8.175 8.175 0 0 1-1.249.594.048.048 0 0 0-.03.057c.24.465.515.909.802 1.305a.05.05 0 0 0 .056.019 13.235 13.235 0 0 0 4.001-2.02.049.049 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.034.034 0 0 0-.02-.019zm-8.198 7.307c-.789 0-1.438-.724-1.438-1.612 0-.889.637-1.613 1.438-1.613.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612zm5.316 0c-.788 0-1.438-.724-1.438-1.612 0-.889.637-1.613 1.438-1.613.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612z"/></svg>
}
function GoogleIcon({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor"><path d="M8 6.545v3.09h4.364c-.182 1-1.364 2.91-4.364 2.91-2.618 0-4.727-2.182-4.727-4.545S5.382 3.455 8 3.455c1.49 0 2.49.636 3.064 1.181l2.09-2.009C11.727.927 10.036 0 8 0 3.582 0 0 3.582 0 8s3.582 8 8 8c4.618 0 7.673-3.236 7.673-7.782 0-.527-.055-1.036-.146-1.527L8 6.544z" opacity=".9"/></svg>
}
