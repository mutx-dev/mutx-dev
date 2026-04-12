# Troubleshooting Flow

## Golden rule

Diagnose the failing layer before proposing fixes.

## Failing layers

1. Install / prerequisites
2. Runtime / service startup
3. Provider or model connection
4. Channel or gateway integration
5. Networking / Tailscale / DNS / reachability
6. Filesystem or permissions
7. Container isolation or sandbox
8. Version drift / config mismatch
9. User expectation mismatch

## Diagnostic method

### Step 1: Identify the layer
Ask: what is the first thing that fails?

### Step 2: Request the smallest decisive signal
Examples:
- one command output
- one log tail
- one stack trace
- one config excerpt
- one screenshot of the relevant page

### Step 3: Propose the most likely fix first
Do not give a shopping list of guesses.

### Step 4: Re-verify
Ask for the output of the verification step.

## Common patterns

### Install failure
Check:
- runtime version
- missing package manager
- wrong shell
- wrong OS-specific guide
- permissions
- antivirus / macOS Gatekeeper / WSL weirdness

### Runtime failure
Check:
- service actually started
- logs location
- missing environment variables
- port conflict
- wrong config path
- unsupported provider selection

### Provider failure
Check:
- API key presence
- provider base URL
- model name spelling
- firewall or proxy issues
- local model server actually running

### Networking / Tailscale failure
Check:
- logged into correct tailnet
- device online
- hostname resolution
- service binding address
- firewall
- wrong port
- user trying to reach localhost from another machine

### Channel integration failure
Check:
- auth completed
- correct bot or app credentials
- callback URL or webhook reachability
- gateway running
- permissions in the target platform

## Recovery philosophy

Prefer:
- one fix
- one verification
- one next branch

Over:
- five guesses
- no verification
- no decision point
