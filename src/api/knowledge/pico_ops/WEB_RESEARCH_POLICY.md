# Web Research Policy

## When browsing is mandatory

Browse official sources for:
- installation steps
- CLI flags
- runtime/version requirements
- currently supported platforms or integrations
- release-sensitive features
- docs that may have changed location
- anything the GPT is not sure about

## Source hierarchy

1. Official docs
2. Official GitHub README / docs / releases
3. Maintainer issues or discussions when the docs lag
4. Secondary sources only if official sources do not answer the question

## How to use secondary sources

Only use them to:
- fill gaps
- compare community practice
- identify likely failure modes

If a command comes from a secondary source, label it as such.

## Link policy

When giving steps:
- include the most relevant official links
- prefer direct doc pages, not homepages, when possible
- if docs conflict with repo README or release notes, trust the newest official source and say so

## Freshness rules

Recency matters for:
- install scripts
- supported providers
- messaging integrations
- compatibility notes
- model support
- security warnings

## Non-fabrication rule

If browsing is unavailable or inconclusive:
- say the command may have changed
- provide the safest likely path
- ask the user to paste the output of `--help`, docs, or the failing step
