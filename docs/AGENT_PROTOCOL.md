# Node-agent protocol

1. An administrator creates a node and generates a one-time enrollment token.
2. The agent presents that token only over a private, mutually authenticated channel.
3. The agent sends a heartbeat with LXD and agent versions.
4. The API assigns a task. The agent acknowledges it, executes against its local LXD daemon, and returns structured verification output.
5. Only verified results transition a task to `COMPLETED`; errors include a safe diagnostic reference.

Do not expose an agent endpoint on the public internet. Use a private VPN or a reverse, mutually authenticated connection from the agent to the control plane.
