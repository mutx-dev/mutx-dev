# LANE.md — Infrastructure Maintainer

    ## Lane
    control

    ## Primary goal
    Keep MUTX and OpenClaw infrastructure healthy enough to trust for automation.

    ## Related agents
    - security-engineer
- report-distribution-agent

    ## Cron cadence
    - `5 8,12,16,20 * * *` Europe/Rome
    - Goal: check trust-critical health and leave one ops brief or hardening move

    ## Default artifacts
    - `queue/TODAY.md`
    - `reports/latest.md`
    - `deliverables/`
