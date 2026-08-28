import { useState, useRef, useEffect } from 'react'

interface TerminalProps {
  navigate: (p: string) => void
}

type ConnState = 'connected' | 'reconnecting' | 'disconnected'

const BOOT_OUTPUT = `[    0.000000] Linux version 6.5.0-35-generic
[    0.000000] BIOS-provided physical RAM map:
[    0.000000] BIOS-e820: [mem 0x0000000000000000-0x000000000009fbff] usable

Ubuntu 22.04.4 LTS db-primary ttyS0

db-primary login: root (automatic login)
Last login: Thu Aug 28 09:14:22 UTC 2026 from 195.20.14.10 on pts/1

Welcome to Ubuntu 22.04.4 LTS (GNU/Linux 6.5.0-35-generic x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/advantage

  System information as of Thu Aug 28 10:30:01 UTC 2026

  System load:  0.68              Processes:             112
  Usage of /:   67.2% of 49.09GB  Users logged in:       0
  Memory usage: 84%               IPv4 address for eth0: 45.67.89.13
  Swap usage:   0%

root@db-primary:~# `

interface CmdLine {
  type: 'prompt' | 'output' | 'error' | 'success' | 'info'
  text: string
}

const cmdResponses: Record<string, string[]> = {
  'ls': ['bin  boot  dev  etc  home  lib  lib64  media  mnt  opt  proc  root  run  sbin  srv  sys  tmp  usr  var'],
  'ls -la': [
    'total 64',
    'drwx------  6 root root 4096 Aug 28 10:30 .',
    'drwxr-xr-x 20 root root 4096 Aug 28 09:12 ..',
    '-rw-------  1 root root 3421 Aug 28 10:28 .bash_history',
    '-rw-r--r--  1 root root  571 Apr  4  2018 .bashrc',
    'drwxr-xr-x  3 root root 4096 Jul 15 12:00 .config',
    '-rw-r--r--  1 root root  148 Aug 17  2015 .profile',
  ],
  'pwd': ['/root'],
  'whoami': ['root'],
  'uname -a': ['Linux db-primary 6.5.0-35-generic #35-Ubuntu SMP PREEMPT_DYNAMIC Tue May  7 09:00:52 UTC 2024 x86_64 x86_64 x86_64 GNU/Linux'],
  'df -h': [
    'Filesystem      Size  Used Avail Use% Mounted on',
    '/dev/sda1        49G   33G   14G  70% /',
    'tmpfs           3.9G     0  3.9G   0% /dev/shm',
    '/dev/sda15      105M  6.1M   99M   6% /boot/efi',
  ],
  'free -h': [
    '               total        used        free      shared  buff/cache   available',
    'Mem:           7.8Gi       6.4Gi       412Mi       2.0Mi       1.0Gi       1.1Gi',
    'Swap:             0B          0B          0B',
  ],
  'uptime': [' 10:30:01 up 12 days,  4:22,  1 user,  load average: 0.68, 0.72, 0.81'],
  'ps aux | head -10': [
    'USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND',
    'root         1  0.0  0.1 167972 11680 ?        Ss   Jul16   0:28 /sbin/init',
    'root         2  0.0  0.0      0     0 ?        S    Jul16   0:00 [kthreadd]',
    'root       427  0.0  0.0  15428  2304 ?        Ss   Jul16   0:00 /sbin/udevd',
    'postgres  1042  2.1  8.4 546972 68340 ?        Ss   Jul16  14:32 postgres: checkpointer',
    'postgres  1043  0.0  2.1 546712 17356 ?        Ss   Jul16   0:02 postgres: background writer',
  ],
  'htop': ['[ERROR] htop is not installed. Run: apt install htop'],
  'help': [
    'Available commands: ls, ls -la, pwd, whoami, uname -a, df -h, free -h, uptime, ps aux | head -10, htop, help, clear',
  ],
  'clear': ['__CLEAR__'],
}

export default function Terminal({ navigate: _navigate }: TerminalProps) {
  const [connState, setConnState] = useState<ConnState>('connected')
  const [lines, setLines] = useState<CmdLine[]>(() =>
    BOOT_OUTPUT.split('\n').map(t => ({ type: 'output' as const, text: t }))
  )
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [historyIdx, setHistoryIdx] = useState(-1)
  const [fullscreen, setFullscreen] = useState(false)
  const [selectedServer, setSelectedServer] = useState('db-primary')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [lines])

  const handleCommand = () => {
    if (!input.trim()) return
    const cmd = input.trim()
    const newLines: CmdLine[] = [
      ...lines,
      { type: 'prompt', text: `root@${selectedServer}:~# ${cmd}` },
    ]
    const resp = cmdResponses[cmd]
    if (resp) {
      if (resp[0] === '__CLEAR__') {
        setLines([{ type: 'prompt', text: `root@${selectedServer}:~# ` }])
        setInput('')
        setHistory(h => [cmd, ...h])
        setHistoryIdx(-1)
        return
      }
      resp.forEach(r => newLines.push({ type: 'output', text: r }))
    } else if (cmd.startsWith('echo ')) {
      newLines.push({ type: 'output', text: cmd.slice(5).replace(/["']/g, '') })
    } else if (cmd === 'exit' || cmd === 'logout') {
      newLines.push({ type: 'success', text: 'logout' })
      newLines.push({ type: 'info', text: 'Session ended. Connection closed.' })
    } else {
      newLines.push({ type: 'error', text: `bash: ${cmd.split(' ')[0]}: command not found` })
    }
    newLines.push({ type: 'prompt', text: `root@${selectedServer}:~# ` })
    setLines(newLines)
    setHistory(h => [cmd, ...h])
    setHistoryIdx(-1)
    setInput('')
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleCommand()
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      const newIdx = Math.min(historyIdx + 1, history.length - 1)
      setHistoryIdx(newIdx)
      if (history[newIdx]) setInput(history[newIdx])
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const newIdx = Math.max(historyIdx - 1, -1)
      setHistoryIdx(newIdx)
      setInput(newIdx === -1 ? '' : history[newIdx] || '')
    }
  }

  const reconnect = () => {
    setConnState('reconnecting')
    setTimeout(() => setConnState('connected'), 1500)
  }

  const containerStyle: React.CSSProperties = fullscreen ? {
    position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', background: '#02020a',
  } : {
    display: 'flex', flexDirection: 'column', height: '100%',
  }

  return (
    <div style={containerStyle}>
      {/* Toolbar */}
      <div style={{
        height: 50,
        background: '#0a0a14',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '0 16px',
        flexShrink: 0,
      }}>
        {/* Traffic lights */}
        <div className="flex items-center gap-1.5">
          <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#ef4444', opacity: 0.8 }}/>
          <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#f59e0b', opacity: 0.8 }}/>
          <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#10b981', opacity: 0.8 }}/>
        </div>

        {/* Server selector */}
        <select
          className="vex-input mono"
          style={{ width: 200, height: 32, fontSize: 12.5, paddingLeft: 10 }}
          value={selectedServer}
          onChange={e => setSelectedServer(e.target.value)}
        >
          {['db-primary', 'web-prod-01', 'mail-server', 'cache-redis'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {/* Status */}
        <div className="flex items-center gap-1.5">
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: connState === 'connected' ? '#10b981' : connState === 'reconnecting' ? '#f59e0b' : '#ef4444',
          }}/>
          <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>
            {connState === 'connected' ? 'Connected' : connState === 'reconnecting' ? 'Reconnecting...' : 'Disconnected'}
          </span>
        </div>

        <div style={{ flex: 1 }}/>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button className="vex-btn vex-btn-ghost" style={{ height: 30, fontSize: 12 }}
            onClick={() => setLines([{ type: 'output', text: '' }])}>
            Clear
          </button>
          <button className="vex-btn vex-btn-ghost" style={{ height: 30, fontSize: 12 }}
            onClick={() => {
              const text = lines.map(l => l.text).join('\n')
              navigator.clipboard.writeText(text)
            }}>
            Copy
          </button>
          {connState !== 'connected' && (
            <button className="vex-btn vex-btn-success" style={{ height: 30, fontSize: 12 }} onClick={reconnect}>
              Reconnect
            </button>
          )}
          <button className="vex-btn vex-btn-secondary" style={{ height: 30, fontSize: 12 }} onClick={() => setFullscreen(!fullscreen)}>
            {fullscreen ? '⤡ Exit' : '⤢ Fullscreen'}
          </button>
        </div>
      </div>

      {/* Terminal screen */}
      {connState === 'disconnected' ? (
        <div style={{ flex: 1, background: '#020209', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚡</div>
            <p style={{ fontSize: 15, color: '#ef4444', margin: '0 0 8px', fontFamily: "'JetBrains Mono', monospace" }}>Connection lost</p>
            <p style={{ fontSize: 12.5, color: '#4b4b6a', margin: '0 0 20px', fontFamily: "'JetBrains Mono', monospace" }}>The terminal session was disconnected.</p>
            <button className="vex-btn vex-btn-primary" onClick={reconnect}>Reconnect</button>
          </div>
        </div>
      ) : connState === 'reconnecting' ? (
        <div style={{ flex: 1, background: '#020209', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: '#f59e0b', fontFamily: "'JetBrains Mono', monospace", marginBottom: 8 }}>Reconnecting to {selectedServer}...</div>
            <div style={{ width: 200, height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden', margin: '0 auto' }}>
              <div style={{ width: '60%', height: '100%', background: '#f59e0b', borderRadius: 2, animation: 'progress-indeterminate 1.2s linear infinite' }}/>
            </div>
          </div>
        </div>
      ) : (
        <div
          className="terminal-screen"
          style={{ flex: 1, cursor: 'text' }}
          onClick={() => inputRef.current?.focus()}
        >
          {lines.map((line, i) => (
            <div key={i} className={
              line.type === 'prompt' ? 'terminal-prompt' :
              line.type === 'error' ? 'terminal-error' :
              line.type === 'success' ? 'terminal-success' :
              line.type === 'info' ? 'terminal-info' :
              'terminal-output'
            }>
              {line.text}
            </div>
          ))}
          {/* Input line */}
          <div className="flex items-center" style={{ marginTop: 2 }}>
            <span className="terminal-prompt">root@{selectedServer}:~# </span>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#d4d4e0',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 13,
                flex: 1,
                caretColor: '#a78bfa',
              }}
              autoFocus
              spellCheck={false}
              autoComplete="off"
            />
            <span className="cursor-blink" style={{ display: 'inline-block', width: 8, height: 15, background: '#a78bfa', verticalAlign: 'middle' }}/>
          </div>
          <div ref={bottomRef}/>
        </div>
      )}

      {/* Status bar */}
      <div style={{
        height: 26,
        background: '#7c3aed',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 16,
        flexShrink: 0,
      }}>
        {[
          `SSH: root@${selectedServer}`,
          'bash',
          `${lines.length} lines`,
          'UTF-8',
          connState === 'connected' ? '●' : '○',
        ].map((item, i) => (
          <span key={i} style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontFamily: "'JetBrains Mono', monospace" }}>{item}</span>
        ))}
        <div style={{ flex: 1 }}/>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: "'JetBrains Mono', monospace" }}>VexPanel Terminal v2.4</span>
      </div>
    </div>
  )
}
