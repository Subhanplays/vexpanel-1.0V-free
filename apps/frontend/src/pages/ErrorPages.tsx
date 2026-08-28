interface ErrorProps {
  navigate: (p: string) => void
}

export function Error404({ navigate }: ErrorProps) {
  return (
    <div className="flex items-center justify-center h-full" style={{ background: '#07070f', minHeight: '80vh' }}>
      <div style={{ textAlign: 'center', maxWidth: 480, padding: '0 24px', position: 'relative', zIndex: 1 }}>
        {/* Background glow */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 400, height: 300,
          background: 'radial-gradient(ellipse,rgba(124,58,237,0.08) 0%,transparent 70%)',
          pointerEvents: 'none', zIndex: -1,
        }}/>
        <div className="mono" style={{ fontSize: 96, fontWeight: 700, color: 'rgba(255,255,255,0.04)', letterSpacing: '-0.05em', lineHeight: 1, marginBottom: -20, userSelect: 'none' }}>
          404
        </div>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 28 }}>
          🔍
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e4e4f0', margin: '0 0 10px', letterSpacing: '-0.02em' }}>Page Not Found</h1>
        <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 28px', lineHeight: 1.6 }}>
          The page you are looking for does not exist or has been moved.
          Check the URL or navigate back to the dashboard.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button className="vex-btn vex-btn-ghost" onClick={() => window.history.back()}>← Go Back</button>
          <button className="vex-btn vex-btn-primary" onClick={() => navigate('dashboard')}>Dashboard</button>
        </div>
        <div style={{ marginTop: 24 }}>
          <p style={{ fontSize: 12.5, color: '#4b4b6a', margin: '0 0 10px' }}>Try one of these:</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {[
              { label: 'VPS Instances', page: 'vps' },
              { label: 'Terminal', page: 'terminal' },
              { label: 'Activity Log', page: 'activity' },
            ].map(link => (
              <button
                key={link.page}
                onClick={() => navigate(link.page)}
                style={{ fontSize: 12.5, color: '#8b5cf6', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function Error500({ navigate }: ErrorProps) {
  return (
    <div className="flex items-center justify-center h-full" style={{ background: '#07070f', minHeight: '80vh' }}>
      <div style={{ textAlign: 'center', maxWidth: 480, padding: '0 24px', position: 'relative', zIndex: 1 }}>
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 400, height: 300,
          background: 'radial-gradient(ellipse,rgba(239,68,68,0.06) 0%,transparent 70%)',
          pointerEvents: 'none', zIndex: -1,
        }}/>
        <div className="mono" style={{ fontSize: 96, fontWeight: 700, color: 'rgba(255,255,255,0.04)', letterSpacing: '-0.05em', lineHeight: 1, marginBottom: -20, userSelect: 'none' }}>
          500
        </div>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 28 }}>
          ⚡
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e4e4f0', margin: '0 0 10px', letterSpacing: '-0.02em' }}>Internal Server Error</h1>
        <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 12px', lineHeight: 1.6 }}>
          Something went wrong on our end. Our team has been notified and is investigating the issue.
        </p>
        <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 8, padding: '10px 16px', marginBottom: 24 }}>
          <p className="mono" style={{ fontSize: 12, color: '#f87171', margin: 0 }}>
            Error: ECONNREFUSED connect ECONNREFUSED 127.0.0.1:8080
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <button className="vex-btn vex-btn-ghost" onClick={() => window.location.reload()}>
            ↺ Retry
          </button>
          <button className="vex-btn vex-btn-primary" onClick={() => navigate('dashboard')}>Dashboard</button>
        </div>
        <p style={{ fontSize: 12, color: '#4b4b6a', marginTop: 20 }}>Error ID: 8f3a-9d2e-vex-500</p>
      </div>
    </div>
  )
}

export function VPSDeployError({ navigate }: ErrorProps) {
  return (
    <div className="flex items-center justify-center h-full" style={{ background: '#07070f', minHeight: '80vh' }}>
      <div style={{ textAlign: 'center', maxWidth: 500, padding: '0 24px' }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 28 }}>
          🖥️
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e4e4f0', margin: '0 0 10px' }}>VPS Deployment Failed</h1>
        <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 18px', lineHeight: 1.6 }}>
          We could not deploy your VPS instance. The provisioning process encountered an error.
        </p>
        <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 8, padding: '14px 18px', marginBottom: 24, textAlign: 'left' }}>
          <p style={{ fontSize: 12.5, fontWeight: 600, color: '#f87171', margin: '0 0 8px' }}>Deployment Error Details</p>
          <div className="mono" style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.8 }}>
            <div>Step: Starting services</div>
            <div>Error: Failed to start systemd-networkd.service</div>
            <div>Code: EXIT_FAILURE (1)</div>
            <div>Time: 2026-08-28 10:32:14 UTC</div>
          </div>
        </div>
        <div className="flex items-center justify-center gap-3">
          <button className="vex-btn vex-btn-ghost" onClick={() => navigate('vps')}>Cancel</button>
          <button className="vex-btn vex-btn-primary" onClick={() => navigate('create-vps')}>
            ↺ Retry Deployment
          </button>
        </div>
      </div>
    </div>
  )
}
