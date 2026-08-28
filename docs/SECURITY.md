# Security model

The browser communicates only with the panel API. The API authorizes every action and dispatches asynchronous jobs. A node agent, placed on each LXD host, is the only component that can access LXD.

- Store node credentials only as SHA-256 hashes; replace bootstrap tokens with mTLS and short-lived credentials before production use.
- Use Argon2id password hashes, secure HTTP-only cookies, CSRF checks, rate limits and server-side ownership checks.
- Encrypt third-party integration secrets at rest with a managed key; never return or log them.
- The agent must call LXD using its API or fixed argument arrays. It must reject arbitrary command parameters.
- RDP, XFCE, xrdp, Tailscale and Pinggy run inside the target LXD container only. The agent must report verified status rather than inferred success.
