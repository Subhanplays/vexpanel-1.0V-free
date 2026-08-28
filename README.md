# VexPanel

VexPanel is a self-hosted control plane for managing LXD system-container VPS instances through authenticated node agents. User containers are never Docker containers and the LXD socket is never exposed to the browser.

## Included application domains

- TypeScript Fastify API with cookie authentication, CSRF enforcement, RBAC and request validation.
- PostgreSQL/Prisma domain schema for users, plans, OS images, nodes, VPSes, IPv4, RDP state, tasks, snapshots, backups, notifications, UI versions, settings and audit logs.
- Redis/BullMQ worker boundary for long-running operations.
- Node-agent service contract with mutual token authentication; LXD commands remain node-side.
- Responsive dark panel for VPSes, tasks, nodes, IPv4, images, plans, users, audit history and settings—with no demo infrastructure data.
- Docker Compose for panel infrastructure only. LXD stays on each node host.

## Run locally

1. Copy `.env.example` to `.env` and replace every placeholder secret.
2. Start PostgreSQL and Redis: `docker compose up -d postgres redis`.
3. Install dependencies: `npm install`.
4. Generate and migrate the schema: `npm run db:generate` then `npm run db:migrate`.
5. Start the API: `npm run dev`.

The API refuses to report infrastructure success directly. Creation, lifecycle actions, snapshots and exports are queued and must be executed by an enrolled node agent, which reports verified results back to the API.

## Production activation

The application is intentionally inert until a real PostgreSQL database, Redis service, TLS-enabled panel URL, and Linux LXD node are configured. Run `npm run db:migrate` only against the intended database. Copy `apps/node-agent/.env.example` to the LXD host, configure it, and run `npm run agent`. The agent uses fixed LXC argument arrays and does not open a public listener.
