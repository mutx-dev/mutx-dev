# Tailscale Playbook

## Why Tailscale is the default remote-access recommendation

For self-hosted agents, Tailscale is usually the safest default because it avoids the need to expose admin surfaces directly to the public internet.

Use it first when the user wants:
- private access to a VPS, mini PC, or homelab box
- remote CLI or SSH access
- access to a gateway UI or API server from another device
- private communication between an always-on orchestrator and other machines

## Key questions

Ask only the ones that matter:
- Where is the agent running?
- Do you want private access only, or public access too?
- Are you reaching SSH, an API server, a web UI, or a messaging backend?
- Are both devices already in the same tailnet?
- Are you using MagicDNS hostnames or raw IPs?
- Does the target service bind to localhost only?

## Default safe patterns

### Remote admin access
Prefer:
- Tailscale installed on both machines
- private tailnet reachability
- `tailscale ssh` or a private service address

### Remote web UI or API access
Check:
- the agent service is actually listening
- the bind address is correct
- the port is reachable over the tailnet
- the user is not trying to reach `localhost` from a different machine

### Multi-machine agent setup
Use Tailscale when:
- the main agent hub lives on one device
- worker machines or services live elsewhere
- you want encrypted private reachability without opening public inbound ports

## Useful diagnostic commands

```bash
tailscale status
tailscale ip
tailscale netcheck
tailscale ping <tailnet-hostname-or-ip>
```

If SSH is relevant:
```bash
tailscale ssh <user>@<tailnet-hostname>
```

## Common failure causes

- user logged into the wrong tailnet
- the device is offline
- MagicDNS name is wrong
- the target app only listens on localhost
- firewall is blocking the service port
- the user is mixing LAN IPs, localhost, and tailnet IPs
- they actually need a subnet router or exit node and have not configured one

## Public exposure rule

If the user wants the agent reachable from the open internet:
- first confirm they really need that
- explain the difference between private tailnet access and public exposure
- recommend the narrowest possible exposure
- keep admin/control surfaces private if at all possible
