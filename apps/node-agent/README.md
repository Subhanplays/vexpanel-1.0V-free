# VexPanel Node Agent

Run this service on an LXD host, never in an unprivileged user VPS. It owns the local LXD client and accepts only authenticated, signed control-plane jobs over a private network.

The agent must use argument arrays/API calls (never `exec` with interpolated strings), report LXD verification results, and clean up IP/tunnel state on failures. It must never expose `/var/snap/lxd/common/lxd/unix.socket` to users or the panel browser.

Required job handlers: `vps.create`, `vps.lifecycle`, `vps.delete`, `rdp.enable`, `snapshot.*`, `backup.*`, and metrics collection. Before production enrollment, implement mTLS plus short-lived node credentials and a durable task acknowledgement protocol.
