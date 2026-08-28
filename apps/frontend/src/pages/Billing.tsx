import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const usageData = [
  { month: 'Mar', cost: 38.4 },
  { month: 'Apr', cost: 42.1 },
  { month: 'May', cost: 40.8 },
  { month: 'Jun', cost: 45.2 },
  { month: 'Jul', cost: 44.9 },
  { month: 'Aug', cost: 29.7 },
]

const invoices = [
  { id: 'INV-2024-07', date: '2026-08-01', period: 'July 2026', amount: 44.90, status: 'paid' },
  { id: 'INV-2024-06', date: '2026-07-01', period: 'June 2026', amount: 45.20, status: 'paid' },
  { id: 'INV-2024-05', date: '2026-06-01', period: 'May 2026', amount: 40.80, status: 'paid' },
  { id: 'INV-2024-04', date: '2026-05-01', period: 'April 2026', amount: 42.10, status: 'paid' },
  { id: 'INV-2024-03', date: '2026-04-01', period: 'March 2026', amount: 38.40, status: 'paid' },
]

const lineItems = [
  { name: 'web-prod-01', type: 'VPS', spec: '2 vCPU · 4GB · 40GB', rate: '$0.011/hr', total: 8.04 },
  { name: 'db-primary', type: 'VPS', spec: '4 vCPU · 8GB · 50GB', rate: '$0.022/hr', total: 16.06 },
  { name: 'mail-server', type: 'VPS', spec: '1 vCPU · 2GB · 20GB', rate: '$0.006/hr', total: 4.38 },
  { name: 'cache-redis', type: 'VPS', spec: '1 vCPU · 2GB · 10GB', rate: '$0.005/hr', total: 3.65 },
  { name: 'backup-vol-01', type: 'Storage', spec: '500 GB block storage', rate: '$0.05/GB', total: 6.25 },
  { name: 'IPv4 Addresses', type: 'Network', spec: '4 × Public IPv4', rate: '$2.00/mo', total: 8.00 },
]

export default function Billing({ navigate: _navigate }: { navigate: (p: string) => void }) {
  const currentTotal = lineItems.reduce((a, b) => a + b.total, 0)

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{ background: '#13132a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px' }}>
        <p style={{ fontSize: 11, color: '#6b7280', margin: '0 0 4px' }}>{label}</p>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#e4e4f0', margin: 0 }}>${payload[0].value.toFixed(2)}</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '28px 28px 48px' }}>
      {/* Top cards */}
      <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {[
          { label: 'This Month (so far)', value: `$${currentTotal.toFixed(2)}`, sub: 'Projected: $47.20', color: '#8b5cf6' },
          { label: 'Last Month', value: '$44.90', sub: 'July 2026', color: '#3b82f6' },
          { label: 'Active VPS', value: '4', sub: '1 stopped (free)', color: '#10b981' },
          { label: 'Storage Used', value: '780 GB', sub: '23.5% of pool', color: '#f59e0b' },
        ].map(c => (
          <div key={c.label} className="vex-card" style={{ padding: '18px 20px' }}>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>{c.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: c.color, letterSpacing: '-0.02em', marginBottom: 4 }}>{c.value}</div>
            <div style={{ fontSize: 12, color: '#4b4b6a' }}>{c.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 320px' }}>
        {/* Left column */}
        <div className="flex flex-col gap-5">
          {/* Usage Chart */}
          <div className="vex-card" style={{ padding: '0', overflow: 'hidden' }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e4e4f0', margin: 0 }}>Monthly Spend</h3>
              <span style={{ fontSize: 12.5, color: '#6b7280' }}>Last 6 months</span>
            </div>
            <div style={{ padding: '16px 20px 20px' }}>
              <div style={{ height: 160 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={usageData} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                    <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false}/>
                    <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`}/>
                    <Tooltip content={<CustomTooltip/>}/>
                    <Bar dataKey="cost" fill="#7c3aed" radius={[4, 4, 0, 0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Current usage breakdown */}
          <div className="vex-card" style={{ overflow: 'hidden' }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e4e4f0', margin: 0 }}>Current Billing Period</h3>
              <span className="badge badge-info">Aug 1–28</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  {['Resource', 'Type', 'Specification', 'Rate', 'Total'].map(h => (
                    <th key={h} style={{ padding: '10px 18px', fontSize: 11, fontWeight: 600, color: '#4b4b6a', textAlign: 'left', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item, i) => (
                  <tr key={item.name} className="table-row" style={{ borderBottom: i < lineItems.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <td style={{ padding: '11px 18px', fontSize: 13.5, fontWeight: 600, color: '#e4e4f0' }}>{item.name}</td>
                    <td style={{ padding: '11px 18px' }}><span className={`badge ${item.type === 'VPS' ? 'badge-purple' : item.type === 'Storage' ? 'badge-info' : 'badge-warning'}`} style={{ fontSize: 11 }}>{item.type}</span></td>
                    <td style={{ padding: '11px 18px', fontSize: 12.5, color: '#9ca3af' }}>{item.spec}</td>
                    <td style={{ padding: '11px 18px' }}><span className="mono" style={{ fontSize: 12, color: '#6b7280' }}>{item.rate}</span></td>
                    <td style={{ padding: '11px 18px', fontSize: 14, fontWeight: 600, color: '#e4e4f0' }}>${item.total.toFixed(2)}</td>
                  </tr>
                ))}
                <tr style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <td colSpan={4} style={{ padding: '12px 18px', textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#9ca3af' }}>Total</td>
                  <td style={{ padding: '12px 18px', fontSize: 16, fontWeight: 700, color: '#8b5cf6' }}>${currentTotal.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Invoices + Payment */}
        <div className="flex flex-col gap-5">
          {/* Payment Methods */}
          <div className="vex-card" style={{ padding: '0', overflow: 'hidden' }}>
            <div className="flex items-center justify-between px-4 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 style={{ fontSize: 13.5, fontWeight: 600, color: '#e4e4f0', margin: 0 }}>Payment Method</h3>
              <button className="vex-btn vex-btn-ghost" style={{ height: 28, fontSize: 12 }}>+ Add</button>
            </div>
            <div style={{ padding: '14px 16px' }}>
              <div className="vex-card" style={{ padding: '14px 16px', background: 'rgba(124,58,237,0.07)', borderColor: 'rgba(124,58,237,0.25)' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div style={{ width: 38, height: 26, background: 'linear-gradient(135deg,#1a56db,#0ea5e9)', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: 'white', fontWeight: 700 }}>VISA</div>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: '#e4e4f0' }}>•••• •••• •••• 4242</div>
                      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>Expires 09/27</div>
                    </div>
                  </div>
                  <span className="badge badge-running" style={{ fontSize: 10.5 }}>Primary</span>
                </div>
              </div>
            </div>
          </div>

          {/* Invoices */}
          <div className="vex-card" style={{ overflow: 'hidden' }}>
            <div className="flex items-center justify-between px-4 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 style={{ fontSize: 13.5, fontWeight: 600, color: '#e4e4f0', margin: 0 }}>Invoices</h3>
            </div>
            <div>
              {invoices.map((inv, i) => (
                <div key={inv.id} className="flex items-center justify-between" style={{ padding: '12px 16px', borderBottom: i < invoices.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#c4c4d4' }}>{inv.period}</div>
                    <div style={{ fontSize: 11, color: '#4b4b6a', marginTop: 2 }}>{inv.date} · {inv.id}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#e4e4f0' }}>${inv.amount.toFixed(2)}</span>
                    <span className="badge badge-running" style={{ fontSize: 10.5 }}>Paid</span>
                    <button className="action-icon-btn" title="Download PDF"><DownloadIcon size={13}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function DownloadIcon({ size = 16 }) { return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 2v7M5 6.5l3 3 3-3"/><path d="M2.5 11.5v1a1 1 0 001 1h9a1 1 0 001-1v-1"/></svg> }
