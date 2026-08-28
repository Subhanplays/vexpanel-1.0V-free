import { useMemo, useState } from 'react'
import { apiJson, type SessionUser } from '../lib/api'

interface CreateVPSProps {
  navigate: (p: string) => void
  user: SessionUser
  area: 'user' | 'admin'
}

const defaultConfig = {
  name: '',
  hostname: '',
  imageAlias: 'ubuntu:24.04',
  cpu: 2,
  ramMiB: 4096,
  diskGiB: 40,
  ipv4: true,
  ipv6: false,
  rdp: false,
  sshx: true,
  tailscale: false,
}

export default function CreateVPS({ navigate, user, area }: CreateVPSProps) {
  const privileged = useMemo(() => area === 'admin' || user.role === 'SUPPORT' || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN', [area, user.role])
  const [form, setForm] = useState(defaultConfig)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const update = <K extends keyof typeof defaultConfig>(key: K, value: (typeof defaultConfig)[K]) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const submit = async () => {
    setLoading(true)
    setError('')
    setMessage('')
    try {
      const hostname = form.hostname || form.name.toLowerCase().replace(/[^a-z0-9-]/g, '-')
      const result = await apiJson<{ vpsId: string; taskId: string; status: string }>('/api/vps', {
        userId: user.id,
        name: form.name,
        hostname,
        imageAlias: form.imageAlias,
        cpu: Number(form.cpu),
        ramMiB: Number(form.ramMiB),
        diskGiB: Number(form.diskGiB),
        ipv4: form.ipv4,
        ipv6: form.ipv6,
        rdp: form.rdp,
        sshx: form.sshx,
        tailscale: form.tailscale,
      })
      setMessage(`VPS queued successfully. Task ${result.taskId} is ${result.status}.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to queue VPS')
    } finally {
      setLoading(false)
    }
  }

  if (!privileged) {
    return (
      <div style={{ padding: '28px 28px 48px' }}>
        <div className="vex-card" style={{ padding: '28px' }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#e4e4f0', margin: 0 }}>Create VPS</h1>
          <p style={{ color: '#6b7280', marginTop: 10, maxWidth: 680 }}>
            VPS provisioning is locked to the admin console in this build. Use the access button to switch into admin mode, then create or manage instances from there.
          </p>
          <div className="flex items-center gap-3 mt-6">
            <button className="vex-btn vex-btn-secondary" onClick={() => navigate('dashboard')}>
              Back to dashboard
            </button>
            <button className="vex-btn vex-btn-primary" onClick={() => navigate('dashboard')}>
              Open admin from dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '28px 28px 48px' }}>
      <div className="vex-card" style={{ padding: '26px', marginBottom: 20 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: '#e4e4f0', margin: 0 }}>Create VPS</h1>
        <p style={{ color: '#6b7280', marginTop: 8 }}>Premium provisioning form connected to the backend create endpoint.</p>
      </div>

      <div className="vex-card" style={{ padding: '24px' }}>
        <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: '#9ca3af', marginBottom: 6 }}>Name</label>
            <input className="vex-input" value={form.name} onChange={e => update('name', e.target.value)} placeholder="web-prod-01" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: '#9ca3af', marginBottom: 6 }}>Hostname</label>
            <input className="vex-input" value={form.hostname} onChange={e => update('hostname', e.target.value)} placeholder="web-prod-01" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: '#9ca3af', marginBottom: 6 }}>Image alias</label>
            <input className="vex-input" value={form.imageAlias} onChange={e => update('imageAlias', e.target.value)} placeholder="ubuntu:24.04" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: '#9ca3af', marginBottom: 6 }}>CPU cores</label>
            <input className="vex-input" type="number" min={1} max={64} value={form.cpu} onChange={e => update('cpu', Number(e.target.value))} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: '#9ca3af', marginBottom: 6 }}>RAM MiB</label>
            <input className="vex-input" type="number" min={512} max={524288} value={form.ramMiB} onChange={e => update('ramMiB', Number(e.target.value))} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: '#9ca3af', marginBottom: 6 }}>Disk GiB</label>
            <input className="vex-input" type="number" min={5} max={4096} value={form.diskGiB} onChange={e => update('diskGiB', Number(e.target.value))} />
          </div>
        </div>

        <div className="grid gap-3 mt-6" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
          {[
            ['IPv4', 'ipv4'],
            ['IPv6', 'ipv6'],
            ['RDP', 'rdp'],
            ['SSHX', 'sshx'],
            ['Tailscale', 'tailscale'],
          ].map(([label, key]) => (
            <label key={key} className="flex items-center justify-between" style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 10 }}>
              <span style={{ color: '#e4e4f0' }}>{label}</span>
              <input
                type="checkbox"
                checked={(form as any)[key]}
                onChange={e => update(key as keyof typeof defaultConfig, e.target.checked as never)}
              />
            </label>
          ))}
        </div>

        {message && <div style={{ marginTop: 16, color: '#34d399', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, padding: '10px 12px' }}>{message}</div>}
        {error && <div style={{ marginTop: 16, color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 10, padding: '10px 12px' }}>{error}</div>}

        <div className="flex items-center justify-between mt-6">
          <button className="vex-btn vex-btn-ghost" onClick={() => navigate('vps')}>Cancel</button>
          <button className="vex-btn vex-btn-primary" disabled={loading || !form.name} onClick={submit}>
            {loading ? 'Queuing…' : 'Deploy VPS'}
          </button>
        </div>
      </div>
    </div>
  )
}

