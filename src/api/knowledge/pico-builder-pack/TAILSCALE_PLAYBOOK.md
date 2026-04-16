# Tailscale Playbook

## Why Tailscale is the default remote-access recommendation

For self-hosted agents, Tailscale is usually the safest default because it avoids exposing admin surfaces directly to the public internet.

Use it first when the user wants:

- private access to a VPS, mini PC, or homelab box
- remote CLI or SSH access
- access to a dashboard, launcher UI, or API server from another device
- private communication between an always-on orchestrator and other machines

As of current Tailscale docs, tailnets created on or after **October 20, 2022** have MagicDNS enabled by default.

## Core concepts to reason through

### Tailnet-only vs public internet

- `tailscale serve` = share a local service with other devices in the tailnet
- `tailscale funnel` = expose a local service to the public internet
- `tailscale ssh` = private shell access over the tailnet
- SSH tunnel = fallback when the app must stay loopback-only and you do not want Serve

### Important nuance

Tailscale Serve adds identity headers when proxying to a local HTTP service. That makes it a strong default for loopback-bound web UIs that should stay private.

Funnel is different:

- public
- best for temporary single-resource sharing
- not a substitute for normal access control
- not a good default for admin panels or control planes

## Key questions

Ask only the ones that matter:

- Where is the agent running?
- Do you want private access only, or public access too?
- Are you reaching SSH, a dashboard, a launcher UI, an API server, or a chat backend?
- Are both devices already in the same tailnet?
- Are you using MagicDNS hostnames or raw IPs?
- Does the target service bind to localhost only?
- Are you sure you need public reachability?

## Default safe patterns

### Remote admin shell

Prefer:

- Tailscale on both machines
- private tailnet reachability
- `tailscale ssh` when possible

Useful checks:

```bash
tailscale status
tailscale ping <tailnet-hostname-or-ip>
tailscale ssh <user>@<tailnet-hostname>
```

### Remote web UI or API access

Check:

- the app is actually listening
- the bind address is correct
- the port is reachable over the tailnet
- the user is not trying to reach `localhost` from another machine

If the app intentionally listens on `127.0.0.1`, prefer `tailscale serve` instead of broadening the app bind to `0.0.0.0`.

### Always-on server in the tailnet

Best default:

- keep the service loopback-only
- use Tailscale Serve for the web surface
- use Tailscale SSH or a normal SSH tunnel for shell access

### OpenClaw-specific note

OpenClaw can auto-configure Tailscale Serve or Funnel for the Gateway dashboard while keeping the Gateway bound to loopback. Prefer `serve` for admin use.

### Browser-based SSH

Tailscale SSH Console exists and works in the browser, but it is:

- admin-only
- beta
- initiated from the Tailscale admin console
- not a replacement for normal user-facing SSH guidance

## Public sharing rules

If the user really needs public internet access:

- confirm they truly need it
- explain the difference between private tailnet access, Serve, and Funnel
- recommend the narrowest possible exposure
- keep admin/control surfaces private when possible
- treat Funnel as temporary or user-facing sharing, not the default admin path

## Common failure causes

- wrong tailnet
- device offline
- MagicDNS name wrong
- service only listens on localhost
- firewall blocks the port
- mixing LAN IPs, localhost, and tailnet IPs
- actually needing a subnet router or exit node
- expecting Tailscale CLI on iOS/Android, where it is not available

## Useful diagnostic commands

```bash
tailscale status
tailscale ip
tailscale netcheck
tailscale ping <tailnet-hostname-or-ip>
tailscale serve status
tailscale funnel status
```

If SSH is relevant:

```bash
tailscale ssh <user>@<tailnet-hostname>
```

## Decision defaults

Use this order unless the user explicitly asks otherwise:

1. `tailscale ssh` for shell
2. `tailscale serve` for private web surfaces
3. SSH tunnel if the app must stay local and Serve is not appropriate
4. direct tailnet bind only when the app is meant to listen on a tailnet interface
5. `tailscale funnel` only for intentional public exposure

## Official sources

- https://tailscale.com/docs/features/magicdns
- https://tailscale.com/docs/features/tailscale-serve
- https://tailscale.com/docs/features/tailscale-funnel
- https://tailscale.com/docs/features/tailscale-ssh
- https://tailscale.com/docs/features/tailscale-ssh/tailscale-ssh-console
- https://tailscale.com/docs/reference/funnel-vs-sharing
- https://tailscale.com/docs/reference/tailscale-cli
- https://docs.openclaw.ai/gateway/tailscale
