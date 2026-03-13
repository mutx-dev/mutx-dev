---
description: Default checklist for clear, reviewable, validation-backed pull requests.
icon: clipboard-check
---

# Pull Request Template

Use this template to keep PRs small, explicit, and easy to review.

### What changed?

*

### Why?

*

### Validation

* [ ] `npm run build`
* [ ] `ruff check src/api cli sdk`
* [ ] `black --check src/api cli sdk`
* [ ] `python -m compileall src/api cli sdk/mutx`
* [ ] targeted manual or automated verification

### Agent Ownership

* authoring agent:
* reviewer agent:
* primary area:
* risk: low / medium / high
* lane: safe auto-merge / staging-first / human-gated

### Docs

* [ ] no docs update needed
* [ ] updated the closest docs

### Notes

* breaking changes:
* follow-up work:
