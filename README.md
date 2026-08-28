<div align="center">

```
 ██╗   ██╗██╗██████╗ ███████╗
 ██║   ██║██║██╔══██╗██╔════╝
 ██║   ██║██║██████╔╝█████╗  
 ╚██╗ ██╔╝██║██╔══██╗██╔══╝  
  ╚████╔╝ ██║██████╔╝███████╗
   ╚═══╝  ╚═╝╚═════╝ ╚══════╝
```

# **VexPanel**

### The Complete Self-Hosted VPS Hosting Control Panel

**Built with love by [SubhanPlays](https://github.com/Subhanplays)** ❤️

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://typescriptlang.org)
[![Node.js](https://img.shields.io/badge/Node.js-24-green.svg)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-blue.svg)](https://postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://docker.com)

---

</div>

## What is VexPanel?

VexPanel is a **production-ready, self-hosted VPS management platform** that lets administrators create and manage real **LXD/LXC system-container VPS instances** for users. It feels like a professional cloud hosting control panel but remains lightweight enough to run on a modest VPS.

> **Your users get real VPS instances, not Docker containers.**

---

## Features

### Core Infrastructure
| Feature | Status |
|---------|--------|
| LXD/LXC System Containers | ✅ Full lifecycle management |
| Multi-Node Support | ✅ Scale across multiple servers |
| Real-time Monitoring | ✅ CPU, RAM, Disk, Network from LXD |
| Task Queue System | ✅ Redis-backed BullMQ workers |
| RBAC Permissions | ✅ 5 roles with granular controls |

### VPS Management
| Feature | Status |
|---------|--------|
| Create / Delete / Rebuild | ✅ |
| Start / Stop / Restart | ✅ |
| Clone / Move / Resize | ✅ |
| Snapshots & Backups | ✅ LXD-native operations |
| Expiration System | ✅ Auto-suspend/stop |
| Resource Quotas | ✅ Plan-based enforcement |

### Remote Access
| Feature | Status |
|---------|--------|
| SSHX Browser Terminal | ✅ Per-VPS isolated sessions |
| RDP (XFCE + xrdp) | ✅ Desktop inside VPS |
| Public IPv4 RDP | ✅ Direct connection |
| Tailscale RDP | ✅ Mesh VPN access |
| Pinggy RDP | ✅ Free tunnel fallback |

### Networking
| Feature | Status |
|---------|--------|
| IPv4 Pool Management | ✅ Assign / Release / Reserve |
| IPv6 Support | ✅ |
| Private Networking | ✅ LXD bridges |
| Tailscale Integration | ✅ Auto-setup in containers |
| Pinggy Tunneling | ✅ With endpoint detection |

### Integrations
| Feature | Status |
|---------|--------|
| Discord Bot | ✅ `/status` `/vps` `/panel` `/help` |
| Discord OAuth2 | ✅ Login with Discord |
| Discord Notifications | ✅ VPS events |
| Gemini AI UI Builder | ✅ Customize dashboard with AI |

### Panel
| Feature | Status |
|---------|--------|
| Dark Theme UI | ✅ Modern responsive design |
| VPS Detail Dashboard | ✅ 9 management tabs |
| Notification System | ✅ Panel + Discord |
| Audit Logging | ✅ All sensitive actions |
| Settings Management | ✅ Non-secret config |
| AI UI Customization | ✅ Gemini-powered |

---

## Architecture

```
                    VexPanel
                       │
              ┌────────┴────────┐
              │                 │
          Web Panel          API Server
          (HTML/JS)        (Fastify/TS)
              │                 │
              └────────┬────────┘
                       │
                  Node Agent
                  (per host)
                       │
                      LXD
                       │
        ┌──────────────┼──────────────┐
        │              │              │
       VPS 1          VPS 2          VPS 3
    (LXC)           (LXC)           (LXC)
```

**Key principle:** The LXD socket is never exposed to the frontend. All communication flows through authenticated API → Node Agent → LXD.

---

## Quick Start

### One-Line Install

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/Subhanplays/vexpanel-1.0V-free/main/deploy/install.sh)
```

### Manual Install

```bash
# Clone the repository
git clone git@github.com:Subhanplays/vexpanel-1.0V-free.git
cd vexpanel-1.0V-free

# Run the installer
bash deploy/install.sh
```

The installer will:
- Generate random secrets
- Build and start all services
- Run database migrations
- Open the panel for first-time admin setup

### First-Time Setup

| Field | Value |
|-------|-------|
| URL | `http://localhost:3000` |
| Action | Create the first admin account in the browser |

---

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Required
DATABASE_URL=postgresql://vexpanel:password@localhost:5432/vexpanel
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
PANEL_URL=https://panel.yourdomain.com

# Discord (optional)
DISCORD_CLIENT_ID=your-client-id
DISCORD_CLIENT_SECRET=your-client-secret
DISCORD_TOKEN=your-bot-token

# Tailscale (optional - for node containers)
TAILSCALE_AUTH_KEY=tskey-auth-xxx

# Pinggy (optional - for free tunneling)
PINGGY_TOKEN=your-pinggy-token
```

### Node Agent Setup

On each LXD host node:

```bash
# Copy the agent config
cp apps/node-agent/.env.example apps/node-agent/.env

# Edit with your API URL and node credentials
vim apps/node-agent/.env

# Start the agent
npm run agent
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Vanilla HTML/CSS/JS (SPA) |
| **API** | Fastify + TypeScript |
| **Database** | PostgreSQL 17 + Prisma ORM |
| **Queue** | Redis 7 + BullMQ |
| **Auth** | JWT (jose) + Argon2id |
| **Virtualization** | LXD/LXC Containers |
| **Bot** | discord.js |
| **AI** | Gemini API |
| **Deploy** | Docker Compose |

---

## Project Structure

```
vexpanel/
├── apps/
│   ├── api/
│   │   └── src/
│   │       ├── server.ts          # Main API server
│   │       ├── auth.ts            # JWT + RBAC
│   │       ├── worker.ts          # Background jobs
│   │       ├── discord.ts         # Discord bot
│   │       ├── lib/               # Shared utilities
│   │       └── routes/            # 17 API route modules
│   ├── node-agent/
│   │   └── src/agent.ts           # LXD node agent
│   └── web/
│       └── index.html             # Frontend SPA
├── prisma/
│   └── schema.prisma              # 14 models, 7 enums
├── deploy/
│   ├── install.sh
│   ├── update.sh
│   ├── uninstall.sh
│   └── backup.sh
├── docker-compose.yml
├── Dockerfile
└── package.json
```

---

## API Endpoints

| Category | Endpoints |
|----------|-----------|
| **Auth** | `GET /api/auth/bootstrap`, `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/me`, `PUT /api/me`, `PUT /api/me/password` |
| **VPS** | `GET /api/vps`, `GET /api/vps/:id`, `POST /api/vps`, `PUT /api/vps/:id`, `POST /api/vps/:id/actions`, `POST /api/vps/:id/ip`, `GET /api/vps/:id/metrics` |
| **Nodes** | `GET /api/nodes`, `POST /api/nodes`, `PUT /api/nodes/:id`, `DELETE /api/nodes/:id` |
| **IPv4** | `GET /api/ipv4`, `POST /api/ipv4`, `POST /api/ipv4/bulk`, `POST /api/ipv4/:id/reservation` |
| **Plans** | `GET /api/plans`, `POST /api/plans`, `PUT /api/plans/:id`, `DELETE /api/plans/:id` |
| **Users** | `GET /api/users`, `POST /api/users`, `PUT /api/users/:id`, `DELETE /api/users/:id` |
| **Backups** | `GET /api/vps/:id/backups`, `POST /api/vps/:id/backups`, `POST /api/vps/:id/backups/:id/restore` |
| **Snapshots** | `GET /api/vps/:id/snapshots`, `POST /api/vps/:id/snapshots`, `POST /api/vps/:id/snapshots/:id/restore` |
| **Settings** | `GET /api/settings`, `PUT /api/settings/:key`, `DELETE /api/settings/:key` |
| **UI** | `GET /api/ui/active`, `POST /api/ui/generate`, `GET /api/ui/versions` |
| **Agent** | `POST /api/agent/heartbeat`, `GET /api/agent/tasks/:nodeId`, `POST /api/agent/tasks/:id/result` |

---

## Discord Commands

| Command | Description |
|---------|-------------|
| `/status` | Show system health, node count, VPS stats |
| `/vps` | List your VPS instances |
| `/myvps` | Show VPS details |
| `/panel` | Get dashboard link |
| `/help` | Show available commands |

---

## Security

- **Argon2id** password hashing
- **JWT** httpOnly cookie sessions
- **CSRF** token validation on all mutations
- **RBAC** with 5 roles (User → Super Admin)
- **Rate limiting** (120/min global, 5/min login)
- **Audit logging** for all sensitive actions
- **Input validation** via Zod schemas
- **No LXD socket exposure** to frontend
- **Encrypted secrets** via environment variables

---

## Deployment

### Docker Compose (Recommended)

```bash
# Install
bash deploy/install.sh

# Update
bash deploy/update.sh

# Backup
bash deploy/backup.sh

# Uninstall
bash deploy/uninstall.sh
```

### Services

| Service | Port | Purpose |
|---------|------|---------|
| `vexpanel-api` | 3000 | API + Web Panel |
| `vexpanel-worker` | - | Background jobs |
| `vexpanel-discord` | - | Discord bot |
| `postgres` | 5432 | Database |
| `redis` | 6379 | Queue + Cache |

---

## Supported Operating Systems

### VPS Images
- Ubuntu 22.04 / 24.04 / 26.04
- Debian 11 / 12 / 13

### Panel Host
- Any Linux with Docker
- Ubuntu 22.04+ recommended

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

### Made with ❤️ by [SubhanPlays](https://github.com/Subhanplays)

**VexPanel** - The Complete VPS Hosting Control Panel

[![GitHub](https://img.shields.io/badge/GitHub-Subhanplays-181717?style=for-the-badge&logo=github)](https://github.com/Subhanplays)

</div>
