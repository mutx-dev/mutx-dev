# TODAY.md — AI Engineer

- Ship the runtime health truth pass from `implementation-brief.md`: expose `background_monitor` and `schema_repairs_applied` in the dashboard monitoring surface so `/health` stops reading like a DB-only probe.
- Add contract coverage for `/health` vs `/ready` semantics across API tests, dashboard route tests, and a targeted monitoring UI render test.
- Update `docs/MONITORING.md` and troubleshooting docs so operators know whether they are looking at database readiness or broader control-plane/runtime degradation.
- Hold deeper self-heal and broader parity work until the health truth layer is honest; after that, resume issue #117 parity cleanup.