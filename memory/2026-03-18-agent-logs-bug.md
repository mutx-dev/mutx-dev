# Session: 2026-03-18 17:52:50 UTC

- **Session Key**: agent:main:main
- **Session ID**: 458f48e5-d10f-4594-b3dd-7b708d42ea10
- **Source**: webchat

## Conversation Summary

user: Continue where you left off. The previous model attempt failed or timed out.
user: System: [2026-03-18 15:13:29 GMT+1] Exec completed (fast-can, code 0) :: ==> Summary 🍺 /opt/homebrew/Cellar/postgresql@17/17.9: 3,824 files, 75.7MB ==> Running `brew cleanup postgresql@17`... Disable this behaviour by setting `HOMEBREW_NO_INSTALL_CLEA…
System: [2026-03-18 15:17:31 GMT+1] Exec completed (fresh-fj, code 0) :: Recent Deployments 81ea0adf-9c24-456b-aa87-ee652bd56cde | BUILDING | 2026-03-18 15:16:21 +01:00 07264905-52d7-495c-9616-977f0a4213d9 | SUCCESS | 2026-03-18 15:08:06 +01:00 15e045f…
System: [2026-03-18 15:18:39 GMT+1] Exec completed (marine-c, code 0) :: Recent Deployments 81ea0adf-9c24-456b-aa87-ee652bd56cde | SUCCESS | 2026-03-18 15:16:21 +01:00 07264905-52d7-495c-9616-977f0a4213d9 | REMOVED | 2026-03-18 15:08:06 +01:00 15e045ff…
System: [2026-03-18 15:22:24 GMT+1] Exec completed (briny-fo, code 0) :: Recent Deployments 2df21cd7-5c68-4018-853f-a528e84b2529 | SUCCESS | 2026-03-18 15:20:34 +01:00 81ea0adf-9c24-456b-aa87-ee652bd56cde | REMOVED | 2026-03-18 15:16:21 +01:00 07264905…

Sender (untrusted metadata):
```json
{
  "label": "openclaw-control-ui",
  "id": "openclaw-control-ui"
}
```

[Wed 2026-03-18 15:26 GMT+1] 2026-03-18T14:20:43.351676235Z [inf] 2026-03-18 14:20:33,787 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:20:43.351681566Z [inf] 2026-03-18 14:20:33,804 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:20:43.351686218Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:20:43.351690763Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:20:43.351695192Z [inf] [parameters: (UUID('2cdb7c12-f612-4c7e-8a6e-822a47a89691'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 20, 33, 655867, tzinfo=datetime.timezone.utc))]
2026-03-18T14:20:43.351699997Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:20:43.939422066Z [inf] 2026-03-18 14:20:43,937 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:20:43.954688766Z [inf] 2026-03-18 14:20:43,952 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:20:43.954693813Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:20:43.954699238Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:20:43.954704517Z [inf] [parameters: (UUID('687ad786-f5db-46ec-b2e7-a147fc6259a8'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 20, 43, 805553, tzinfo=datetime.timezone.utc))]
2026-03-18T14:20:43.954709078Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:20:53.550274681Z [err] 2026-03-18 14:20:43.925 UTC [54247] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:20:53.550286790Z [err] 2026-03-18 14:20:43.925 UTC [54247] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:20:54.081708852Z [err] 2026-03-18 14:20:54.079 UTC [54248] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:20:54.081712961Z [err] 2026-03-18 14:20:54.079 UTC [54248] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:21:03.951472616Z [inf] 2026-03-18 14:20:54,084 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:21:03.951532777Z [inf] 2026-03-18 14:20:54,110 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:21:03.951540369Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:21:03.951546883Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:21:03.951551735Z [inf] [parameters: (UUID('ffa64427-bea7-453b-ab04-cf3dac87283f'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 20, 53, 953234, tzinfo=datetime.timezone.utc))]
2026-03-18T14:21:03.951557711Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:21:04.247872821Z [inf] 2026-03-18 14:21:04,244 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:21:04.268569547Z [inf] 2026-03-18 14:21:04,262 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:21:04.268575177Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:21:04.268580473Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:21:04.268586089Z [inf] [parameters: (UUID('44194c32-26b9-4b9a-8a97-602ba2ccc1f6'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 21, 4, 112357, tzinfo=datetime.timezone.utc))]
2026-03-18T14:21:04.268591817Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:21:14.080569871Z [err] 2026-03-18 14:21:04.234 UTC [54249] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:21:14.080573971Z [err] 2026-03-18 14:21:04.234 UTC [54249] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:21:14.397409032Z [err] 2026-03-18 14:21:14.391 UTC [54250] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:21:14.397416002Z [err] 2026-03-18 14:21:14.391 UTC [54250] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:21:24.266195783Z [inf] 2026-03-18 14:21:14,400 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:21:24.266205146Z [inf] 2026-03-18 14:21:14,419 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:21:24.266211258Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:21:24.266216519Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:21:24.266221450Z [inf] [parameters: (UUID('23133f01-3b06-4086-a9a0-f45e1e389cbf'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 21, 14, 262012, tzinfo=datetime.timezone.utc))]
2026-03-18T14:21:24.266226919Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:21:24.859121124Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:21:24.859214049Z [inf] 2026-03-18 14:21:24,550 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:21:24.859218594Z [inf] 2026-03-18 14:21:24,565 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:21:24.859222880Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:21:24.859227557Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:21:24.859231914Z [inf] [parameters: (UUID('c9619176-e6a0-44fd-8eb9-107c9f5874ad'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 21, 24, 421437, tzinfo=datetime.timezone.utc))]
2026-03-18T14:21:34.397898743Z [err] 2026-03-18 14:21:24.538 UTC [54251] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:21:34.397902883Z [err] 2026-03-18 14:21:24.538 UTC [54251] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:21:34.969592983Z [err] 2026-03-18 14:21:34.685 UTC [54252] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:21:34.969596263Z [err] 2026-03-18 14:21:34.685 UTC [54252] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:21:44.529724806Z [inf] 2026-03-18 14:21:34,696 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:21:44.529734346Z [inf] 2026-03-18 14:21:34,712 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:21:44.529741213Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:21:44.529750232Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:21:44.529757249Z [inf] [parameters: (UUID('a1f1a335-9ec3-40ed-aaa5-f0157968b401'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 21, 34, 566939, tzinfo=datetime.timezone.utc))]
2026-03-18T14:21:44.529763635Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:21:44.923315073Z [inf] 2026-03-18 14:21:44,842 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:21:44.923320968Z [inf] 2026-03-18 14:21:44,858 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:21:44.923326648Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:21:44.923332476Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:21:44.923337459Z [inf] [parameters: (UUID('565edd89-b6b8-4832-8b52-d1a3c3cba7b8'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 21, 44, 713521, tzinfo=datetime.timezone.utc))]
2026-03-18T14:21:44.923342005Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:21:54.680698371Z [err] 2026-03-18 14:21:44.830 UTC [54254] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:21:54.680701961Z [err] 2026-03-18 14:21:44.830 UTC [54254] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:21:55.137540060Z [err] 2026-03-18 14:21:54.970 UTC [54255] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:21:55.137544230Z [err] 2026-03-18 14:21:54.970 UTC [54255] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:21:55.445344065Z [inf] Starting Container
2026-03-18T14:21:57.973187229Z [inf] 2026-03-18 14:21:57,501 - src.api.middleware.rate_limit - INFO - Rate limiting enabled: 100 requests per 60 seconds
2026-03-18T14:21:57.973196142Z [err] INFO: Started server process [1]
2026-03-18T14:21:57.973203909Z [err] INFO: Waiting for application startup.
2026-03-18T14:21:57.973210805Z [inf] 2026-03-18 14:21:57,635 - src.api.main - INFO - Starting up API...
2026-03-18T14:21:57.973219302Z [inf] 2026-03-18 14:21:57,636 - src.api.main - INFO - Environment variable validation completed
2026-03-18T14:21:57.973225564Z [inf] 2026-03-18 14:21:57,636 - src.api.main - INFO - Running in development mode
2026-03-18T14:21:57.973231618Z [inf] 2026-03-18 14:21:57,636 - src.api.main - INFO - Database initialization running in background
2026-03-18T14:21:57.973250404Z [err] INFO: Application startup complete.
2026-03-18T14:21:57.973256560Z [err] INFO: Uvicorn running on http://0.0.0.0:8080 (Press CTRL+C to quit)
2026-03-18T14:21:57.973261867Z [inf] 2026-03-18 14:21:57,925 - src.api.main - INFO - Database initialized
2026-03-18T14:21:58.647859225Z [inf] 2026-03-18 14:21:58,638 - src.api.main - INFO - Database ready; starting background monitor
2026-03-18T14:21:58.647863596Z [inf] 2026-03-18 14:21:58,639 - src.api.services.monitor - INFO - Starting background agent monitor...
2026-03-18T14:21:58.647869828Z [inf] 2026-03-18 14:21:58,639 - src.api.services.self_healer - INFO - Health check scheduler started
2026-03-18T14:21:58.647875648Z [inf] 2026-03-18 14:21:58,639 - src.api.services.self_healer - INFO - Self-healing service started
2026-03-18T14:21:58.647880694Z [inf] 2026-03-18 14:21:58,639 - src.api.services.self_healer - INFO - Registered recovery handler for restart
2026-03-18T14:21:58.647884563Z [inf] 2026-03-18 14:21:58,639 - src.api.services.self_healer - INFO - Registered recovery handler for rollback
2026-03-18T14:21:59.008429738Z [inf] 2026-03-18 14:21:58,815 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:21:59.008437751Z [inf] 2026-03-18 14:21:58,833 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:21:59.008445155Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:21:59.008451903Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:21:59.008458703Z [inf] [parameters: (UUID('193c9fa6-28ea-41fc-91ce-82ff0772da50'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 21, 58, 639404, tzinfo=datetime.timezone.utc))]
2026-03-18T14:21:59.008465749Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:21:59.149983317Z [err] 2026-03-18 14:21:58.804 UTC [54257] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:21:59.149986457Z [err] 2026-03-18 14:21:58.804 UTC [54257] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:22:04.966446886Z [inf] 2026-03-18 14:22:04,053 - src.api.services.self_healer - INFO - Self-healing service stopped
2026-03-18T14:22:04.966461267Z [err] INFO: Application shutdown complete.
2026-03-18T14:22:04.966474418Z [err] INFO: Finished server process [1]
2026-03-18T14:22:04.966547563Z [inf] 2026-03-18 14:21:54,981 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:04.966555176Z [inf] 2026-03-18 14:21:54,999 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:04.966561562Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:04.966565965Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:04.966570010Z [inf] [parameters: (UUID('b1ab2623-9b0e-47f8-86f8-5b9a0491ce47'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 21, 54, 859731, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:04.966573850Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:22:04.966577581Z [err] INFO: Shutting down
2026-03-18T14:22:04.966581059Z [err] INFO: Waiting for application shutdown.
2026-03-18T14:22:04.966585302Z [inf] 2026-03-18 14:22:04,053 - src.api.services.monitor - INFO - Background agent monitor cancellation requested
2026-03-18T14:22:04.966590256Z [inf] 2026-03-18 14:22:04,053 - src.api.services.self_healer - INFO - Health check scheduler stopped
2026-03-18T14:22:05.387941360Z [inf] Stopping Container
2026-03-18T14:22:18.709962177Z [inf] 2026-03-18 14:22:08,967 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:18.709966188Z [inf] 2026-03-18 14:22:08,985 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:18.709969952Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:18.709974339Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:18.709978285Z [inf] [parameters: (UUID('2f6b448b-1a6f-49a8-bc66-7a3b079ae4ba'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 22, 8, 833512, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:18.709983114Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:22:18.814792702Z [err] 2026-03-18 14:22:08.956 UTC [54258] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:22:18.814795641Z [err] 2026-03-18 14:22:08.956 UTC [54258] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:22:19.143633475Z [err] 2026-03-18 14:22:19.105 UTC [54259] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:22:19.143636245Z [err] 2026-03-18 14:22:19.105 UTC [54259] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:22:19.205597125Z [inf] 2026-03-18 14:22:19,114 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:19.205604013Z [inf] 2026-03-18 14:22:19,133 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:19.205610647Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:19.205616819Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:19.205624665Z [inf] [parameters: (UUID('34cb9d65-0e82-4382-bae3-f2e9d9fe229e'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 22, 18, 987246, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:19.205631595Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:22:38.857410936Z [err] 2026-03-18 14:22:29.262 UTC [54260] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:22:38.857414826Z [err] 2026-03-18 14:22:29.262 UTC [54260] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:22:38.867970214Z [inf] 2026-03-18 14:22:29,272 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:38.867978904Z [inf] 2026-03-18 14:22:29,291 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:38.867985046Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:38.867990159Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:38.867994894Z [inf] [parameters: (UUID('1ae76a28-8e25-4ad0-a835-721ae8df130a'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 22, 29, 134379, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:38.867999427Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:22:39.409808468Z [err] 2026-03-18 14:22:39.408 UTC [54261] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:22:39.409813198Z [err] 2026-03-18 14:22:39.408 UTC [54261] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:22:39.425850201Z [inf] 2026-03-18 14:22:39,420 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:39.438257407Z [inf] 2026-03-18 14:22:39,435 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:39.438262717Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:39.438268823Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:39.438272983Z [inf] [parameters: (UUID('e20b1faf-c437-4297-a1c1-9d75631da225'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 22, 39, 292243, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:39.438278275Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:22:59.440850684Z [inf] 2026-03-18 14:22:49,566 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:59.440855242Z [inf] 2026-03-18 14:22:49,582 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:59.440860506Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:59.440866982Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:59.440871398Z [inf] [parameters: (UUID('a2b7d3a3-ba75-4fc7-a835-23fc670d90bf'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 22, 49, 436567, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:59.440875823Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:22:59.699771521Z [err] 2026-03-18 14:22:59.695 UTC [54264] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:22:59.699776591Z [err] 2026-03-18 14:22:59.695 UTC [54264] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:22:59.707160120Z [inf] 2026-03-18 14:22:59,706 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:59.733508340Z [inf] 2026-03-18 14:22:59,723 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:59.733511825Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:59.733515164Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:59.733518756Z [inf] [parameters: (UUID('e2fd175a-c3af-49f1-a19d-2e016f0c0308'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 22, 59, 582728, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:59.733522747Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:23:19.698742285Z [err] 2026-03-18 14:23:09.831 UTC [54265] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:23:19.698748704Z [err] 2026-03-18 14:23:09.831 UTC [54265] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:23:19.736743921Z [inf] 2026-03-18 14:23:09,843 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:23:19.736750006Z [inf] 2026-03-18 14:23:09,860 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:23:19.736753873Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:23:19.736757692Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:23:19.736761290Z [inf] [parameters: (UUID('3e583acc-6bb4-46eb-be3a-317444d73b6e'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 23, 9, 723803, tzinfo=datetime.timezone.utc))]
2026-03-18T14:23:19.736764883Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:23:19.985818572Z [inf] 2026-03-18 14:23:19,980 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:23:20.002627016Z [inf] 2026-03-18 14:23:19,996 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:23:20.002633861Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:23:20.002640032Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:23:20.002646173Z [inf] [parameters: (UUID('e0d5def4-c391-4302-8a7d-76d97bbe8c99'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 23, 19, 861569, tzinfo=datetime.timezone.utc))]
2026-03-18T14:23:20.002652306Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:23:20.354844729Z [err] 2026-03-18 14:23:19.968 UTC [54266] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:23:20.354850979Z [err] 2026-03-18 14:23:19.968 UTC [54266] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:23:30.343348431Z [err] 2026-03-18 14:23:30.103 UTC [54267] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:23:30.343354951Z [err] 2026-03-18 14:23:30.103 UTC [54267] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:23:40.014576448Z [inf] 2026-03-18 14:23:30,115 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:23:40.014581701Z [inf] 2026-03-18 14:23:30,130 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:23:40.014589933Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:23:40.014595420Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:23:40.014600405Z [inf] [parameters: (UUID('60412b47-e088-4b3e-8bbf-3a591c5bccf2'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 23, 29, 997335, tzinfo=datetime.timezone.utc))]
2026-03-18T14:23:40.014604662Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:23:40.430177034Z [inf] 2026-03-18 14:23:40,265 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:23:40.430183746Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:23:40.430189630Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:23:40.430194665Z [inf] [parameters: (UUID('fc791d07-ac8a-42e1-9ac7-d15411e7ccfd'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 23, 40, 131645, tzinfo=datetime.timezone.utc))]
2026-03-18T14:23:40.430199892Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:23:40.430284862Z [inf] 2026-03-18 14:23:40,252 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:23:50.396682591Z [err] 2026-03-18 14:23:50.393 UTC [54270] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:23:50.396688001Z [err] 2026-03-18 14:23:50.393 UTC [54270] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:24:00.157565671Z [inf] 2026-03-18 14:23:50,404 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:00.157573890Z [inf] 2026-03-18 14:23:50,425 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:24:00.157579184Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:24:00.157584446Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:24:00.157589488Z [inf] [parameters: (UUID('9f65267a-ad5b-485f-a374-f2efa59e37cb'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 23, 50, 267470, tzinfo=datetime.timezone.utc))]
2026-03-18T14:24:00.157596302Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:24:00.572777052Z [inf] 2026-03-18 14:24:00,553 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:00.580703808Z [inf] 2026-03-18 14:24:00,575 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:24:00.580710339Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:24:00.580714983Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:24:00.580719613Z [inf] [parameters: (UUID('0fc4e393-5eac-4a80-bf25-fb78221e43e7'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 24, 0, 424886, tzinfo=datetime.timezone.utc))]
2026-03-18T14:24:00.580733681Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:24:10.031067600Z [err] 2026-03-18 14:24:00.541 UTC [54271] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:24:10.031070100Z [err] 2026-03-18 14:24:00.541 UTC [54271] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:24:10.719957821Z [err] 2026-03-18 14:24:10.696 UTC [54272] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:24:10.719967051Z [err] 2026-03-18 14:24:10.696 UTC [54272] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:24:20.606456814Z [inf] [parameters: (UUID('0dc304b6-194d-40a5-8141-edf1ebb0bc59'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 24, 10, 576068, tzinfo=datetime.timezone.utc))]
2026-03-18T14:24:20.606467880Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:24:20.606484214Z [inf] 2026-03-18 14:24:10,728 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:24:20.606492548Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:24:20.606499252Z [inf] 2026-03-18 14:24:10,707 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:20.606502916Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:24:20.857924156Z [inf] 2026-03-18 14:24:20,857 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:20.875277172Z [inf] 2026-03-18 14:24:20,872 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:24:20.875282294Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:24:20.875287115Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:24:20.875294676Z [inf] [parameters: (UUID('12a73175-abcf-430a-ab99-8ede6bddf6bb'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 24, 20, 728467, tzinfo=datetime.timezone.utc))]
2026-03-18T14:24:20.875300476Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:24:30.702041109Z [err] 2026-03-18 14:24:20.845 UTC [54273] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:24:30.702048388Z [err] 2026-03-18 14:24:20.845 UTC [54273] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:24:31.006561396Z [err] 2026-03-18 14:24:31.002 UTC [54274] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:24:31.006567076Z [err] 2026-03-18 14:24:31.002 UTC [54274] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:24:40.887791994Z [inf] 2026-03-18 14:24:31,011 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:40.887796027Z [inf] 2026-03-18 14:24:31,030 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:24:40.887799545Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:24:40.887804034Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:24:40.887807591Z [inf] [parameters: (UUID('dc2e25c7-dbae-457c-85fb-7284a79f6ad7'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 24, 30, 873197, tzinfo=datetime.timezone.utc))]
2026-03-18T14:24:40.887811214Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:24:41.162024031Z [inf] 2026-03-18 14:24:41,160 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:41.176635221Z [inf] 2026-03-18 14:24:41,175 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:24:41.176641255Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:24:41.176644725Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:24:41.176648680Z [inf] [parameters: (UUID('01d4b0f8-57d7-413d-a8f7-7afa3fc99842'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 24, 41, 31748, tzinfo=datetime.timezone.utc))]
2026-03-18T14:24:41.176652422Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:24:51.006723698Z [err] 2026-03-18 14:24:41.147 UTC [54276] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:24:51.006729828Z [err] 2026-03-18 14:24:41.147 UTC [54276] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:24:51.559502221Z [err] 2026-03-18 14:24:51.292 UTC [54277] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:24:51.559507280Z [err] 2026-03-18 14:24:51.292 UTC [54277] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:25:01.180459418Z [inf] 2026-03-18 14:24:51,304 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:25:01.180467244Z [inf] 2026-03-18 14:24:51,321 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:25:01.180472823Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:25:01.180478353Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:25:01.180483182Z [inf] [parameters: (UUID('044e5d76-d02b-4d14-b080-f0a56301b73c'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 24, 51, 175539, tzinfo=datetime.timezone.utc))]
2026-03-18T14:25:01.180487888Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:25:01.771946949Z [inf] 2026-03-18 14:25:01,447 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:25:01.771953608Z [inf] 2026-03-18 14:25:01,462 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:25:01.771961468Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:25:01.771969954Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:25:01.771977797Z [inf] [parameters: (UUID('34704bbc-1db9-4dcf-8754-23c93a4a59c5'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 25, 1, 321327, tzinfo=datetime.timezone.utc))]
2026-03-18T14:25:01.771984486Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:25:10.916749804Z [inf] Starting Container
2026-03-18T14:25:11.193287543Z [err] 2026-03-18 14:25:01.434 UTC [54278] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:25:11.193363981Z [err] 2026-03-18 14:25:01.434 UTC [54278] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:25:11.623222324Z [err] 2026-03-18 14:25:11.577 UTC [54279] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:25:11.623227294Z [err] 2026-03-18 14:25:11.577 UTC [54279] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:25:13.358611759Z [err] INFO: Started server process [1]
2026-03-18T14:25:13.358615245Z [inf] 2026-03-18 14:25:13,090 - src.api.main - INFO - Database initialized
2026-03-18T14:25:13.358622624Z [err] INFO: Waiting for application startup.
2026-03-18T14:25:13.358630770Z [inf] 2026-03-18 14:25:12,524 - src.api.main - INFO - Starting up API...
2026-03-18T14:25:13.358639133Z [inf] 2026-03-18 14:25:12,525 - src.api.main - INFO - Environment variable validation completed
2026-03-18T14:25:13.358647089Z [inf] 2026-03-18 14:25:12,525 - src.api.main - INFO - Running in development mode
2026-03-18T14:25:13.358653999Z [inf] 2026-03-18 14:25:12,525 - src.api.main - INFO - Database initialization running in background
2026-03-18T14:25:13.358661044Z [err] INFO: Application startup complete.
2026-03-18T14:25:13.358669947Z [err] INFO: Uvicorn running on http://0.0.0.0:8080 (Press CTRL+C to quit)
2026-03-18T14:25:13.358701249Z [inf] 2026-03-18 14:25:12,369 - src.api.middleware.rate_limit - INFO - Rate limiting enabled: 100 requests per 60 seconds
2026-03-18T14:25:13.530866974Z [inf] 2026-03-18 14:25:13,528 - src.api.main - INFO - Database ready; starting background monitor
2026-03-18T14:25:13.530873695Z [inf] 2026-03-18 14:25:13,528 - src.api.services.monitor - INFO - Starting background agent monitor...
2026-03-18T14:25:13.530878388Z [inf] 2026-03-18 14:25:13,528 - src.api.services.self_healer - INFO - Health check scheduler started
2026-03-18T14:25:13.530883113Z [inf] 2026-03-18 14:25:13,528 - src.api.services.self_healer - INFO - Self-healing service started
2026-03-18T14:25:13.530887732Z [inf] 2026-03-18 14:25:13,528 - src.api.services.self_healer - INFO - Registered recovery handler for restart
2026-03-18T14:25:13.530891851Z [inf] 2026-03-18 14:25:13,528 - src.api.services.self_healer - INFO - Registered recovery handler for rollback
2026-03-18T14:25:13.755833206Z [inf] 2026-03-18 14:25:13,753 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:25:13.793813065Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:25:13.793822399Z [inf] [parameters: (UUID('fe196b05-faf8-49c1-b5c7-0089f456c694'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 25, 13, 529025, tzinfo=datetime.timezone.utc))]
2026-03-18T14:25:13.793828332Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:25:13.793984687Z [inf] 2026-03-18 14:25:13,791 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:25:13.793990321Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:25:19.421851748Z [inf] Stopping Container
2026-03-18T14:25:21.483214131Z [inf] 2026-03-18 14:25:11,589 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:25:21.483229925Z [inf] 2026-03-18 14:25:11,607 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:25:21.483239854Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:25:21.483246373Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:25:21.483251724Z [inf] [parameters: (UUID('7db49892-bcd4-4746-948d-bbe754e1bf3e'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 25, 11, 462942, tzinfo=datetime.timezone.utc))]
2026-03-18T14:25:21.483258109Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:25:21.483269014Z [err] INFO: Shutting down
2026-03-18T14:25:21.483274791Z [err] INFO: Waiting for application shutdown.
2026-03-18T14:25:21.483284262Z [inf] 2026-03-18 14:25:18,723 - src.api.services.monitor - INFO - Background agent monitor cancellation requested
2026-03-18T14:25:21.483290575Z [inf] 2026-03-18 14:25:18,723 - src.api.services.self_healer - INFO - Health check scheduler stopped
2026-03-18T14:25:21.483297660Z [inf] 2026-03-18 14:25:18,723 - src.api.services.self_healer - INFO - Self-healing service stopped
2026-03-18T14:25:21.483302500Z [err] INFO: Application shutdown complete.
2026-03-18T14:25:21.483308471Z [err] INFO: Finished server process [1]
2026-03-18T14:25:33.761291509Z [err] 2026-03-18 14:25:23.966 UTC [54282] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:25:33.761295569Z [err] 2026-03-18 14:25:23.966 UTC [54282] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:25:33.780527614Z [inf] [parameters: (UUID('d161631e-2c57-4d08-98e2-653fb9a97f83'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 25, 23, 792011, tzinfo=datetime.timezone.utc))]
2026-03-18T14:25:33.780540648Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:25:33.780627440Z [inf] 2026-03-18 14:25:23,972 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:25:33.780633817Z [inf] 2026-03-18 14:25:23,998 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:25:33.780647198Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:25:33.780654733Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:25:34.149271709Z [err] 2026-03-18 14:25:34.138 UTC [54283] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:25:34.149284248Z [err] 2026-03-18 14:25:34.138 UTC [54283] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:25:34.150612504Z [inf] 2026-03-18 14:25:34,142 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:25:34.177331606Z [inf] 2026-03-18 14:25:34,171 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:25:34.177339680Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:25:34.177346375Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:25:34.177351685Z [inf] [parameters: (UUID('41085f97-edbe-4ec1-be88-c367df80f96c'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 25, 33, 998843, tzinfo=datetime.timezone.utc))]
2026-03-18T14:25:34.177356676Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)



2026-03-18T14:21:55.445344065Z [inf] Starting Container
2026-03-18T14:21:57.973187229Z [inf] 2026-03-18 14:21:57,501 - src.api.middleware.rate_limit - INFO - Rate limiting enabled: 100 requests per 60 seconds
2026-03-18T14:21:57.973196142Z [err] INFO: Started server process [1]
2026-03-18T14:21:57.973203909Z [err] INFO: Waiting for application startup.
2026-03-18T14:21:57.973210805Z [inf] 2026-03-18 14:21:57,635 - src.api.main - INFO - Starting up API...
2026-03-18T14:21:57.973219302Z [inf] 2026-03-18 14:21:57,636 - src.api.main - INFO - Environment variable validation completed
2026-03-18T14:21:57.973225564Z [inf] 2026-03-18 14:21:57,636 - src.api.main - INFO - Running in development mode
2026-03-18T14:21:57.973231618Z [inf] 2026-03-18 14:21:57,636 - src.api.main - INFO - Database initialization running in background
2026-03-18T14:21:57.973250404Z [err] INFO: Application startup complete.
2026-03-18T14:21:57.973256560Z [err] INFO: Uvicorn running on http://0.0.0.0:8080 (Press CTRL+C to quit)
2026-03-18T14:21:57.973261867Z [inf] 2026-03-18 14:21:57,925 - src.api.main - INFO - Database initialized
2026-03-18T14:21:58.647859225Z [inf] 2026-03-18 14:21:58,638 - src.api.main - INFO - Database ready; starting background monitor
2026-03-18T14:21:58.647863596Z [inf] 2026-03-18 14:21:58,639 - src.api.services.monitor - INFO - Starting background agent monitor...
2026-03-18T14:21:58.647869828Z [inf] 2026-03-18 14:21:58,639 - src.api.services.self_healer - INFO - Health check scheduler started
2026-03-18T14:21:58.647875648Z [inf] 2026-03-18 14:21:58,639 - src.api.services.self_healer - INFO - Self-healing service started
2026-03-18T14:21:58.647880694Z [inf] 2026-03-18 14:21:58,639 - src.api.services.self_healer - INFO - Registered recovery handler for restart
2026-03-18T14:21:58.647884563Z [inf] 2026-03-18 14:21:58,639 - src.api.services.self_healer - INFO - Registered recovery handler for rollback
2026-03-18T14:21:59.008429738Z [inf] 2026-03-18 14:21:58,815 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:21:59.008437751Z [inf] 2026-03-18 14:21:58,833 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:21:59.008445155Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:21:59.008451903Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:21:59.008458703Z [inf] [parameters: (UUID('193c9fa6-28ea-41fc-91ce-82ff0772da50'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 21, 58, 639404, tzinfo=datetime.timezone.utc))]
2026-03-18T14:21:59.008465749Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:22:18.709962177Z [inf] 2026-03-18 14:22:08,967 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:18.709966188Z [inf] 2026-03-18 14:22:08,985 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:18.709969952Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:18.709974339Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:18.709978285Z [inf] [parameters: (UUID('2f6b448b-1a6f-49a8-bc66-7a3b079ae4ba'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 22, 8, 833512, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:18.709983114Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:22:19.205597125Z [inf] 2026-03-18 14:22:19,114 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:19.205604013Z [inf] 2026-03-18 14:22:19,133 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:19.205610647Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:19.205616819Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:19.205624665Z [inf] [parameters: (UUID('34cb9d65-0e82-4382-bae3-f2e9d9fe229e'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 22, 18, 987246, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:19.205631595Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:22:38.867970214Z [inf] 2026-03-18 14:22:29,272 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:38.867978904Z [inf] 2026-03-18 14:22:29,291 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:38.867985046Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:38.867990159Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:38.867994894Z [inf] [parameters: (UUID('1ae76a28-8e25-4ad0-a835-721ae8df130a'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 22, 29, 134379, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:38.867999427Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:22:39.425850201Z [inf] 2026-03-18 14:22:39,420 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:39.438257407Z [inf] 2026-03-18 14:22:39,435 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:39.438262717Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:39.438268823Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:39.438272983Z [inf] [parameters: (UUID('e20b1faf-c437-4297-a1c1-9d75631da225'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 22, 39, 292243, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:39.438278275Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:22:59.440850684Z [inf] 2026-03-18 14:22:49,566 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:59.440855242Z [inf] 2026-03-18 14:22:49,582 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:59.440860506Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:59.440866982Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:59.440871398Z [inf] [parameters: (UUID('a2b7d3a3-ba75-4fc7-a835-23fc670d90bf'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 22, 49, 436567, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:59.440875823Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:22:59.707160120Z [inf] 2026-03-18 14:22:59,706 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:59.733508340Z [inf] 2026-03-18 14:22:59,723 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:59.733511825Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:59.733515164Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:59.733518756Z [inf] [parameters: (UUID('e2fd175a-c3af-49f1-a19d-2e016f0c0308'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 22, 59, 582728, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:59.733522747Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:23:19.736743921Z [inf] 2026-03-18 14:23:09,843 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:23:19.736750006Z [inf] 2026-03-18 14:23:09,860 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:23:19.736753873Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:23:19.736757692Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:23:19.736761290Z [inf] [parameters: (UUID('3e583acc-6bb4-46eb-be3a-317444d73b6e'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 23, 9, 723803, tzinfo=datetime.timezone.utc))]
2026-03-18T14:23:19.736764883Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:23:19.985818572Z [inf] 2026-03-18 14:23:19,980 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:23:20.002627016Z [inf] 2026-03-18 14:23:19,996 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:23:20.002633861Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:23:20.002640032Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:23:20.002646173Z [inf] [parameters: (UUID('e0d5def4-c391-4302-8a7d-76d97bbe8c99'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 23, 19, 861569, tzinfo=datetime.timezone.utc))]
2026-03-18T14:23:20.002652306Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:23:40.014576448Z [inf] 2026-03-18 14:23:30,115 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:23:40.014581701Z [inf] 2026-03-18 14:23:30,130 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:23:40.014589933Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:23:40.014595420Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:23:40.014600405Z [inf] [parameters: (UUID('60412b47-e088-4b3e-8bbf-3a591c5bccf2'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 23, 29, 997335, tzinfo=datetime.timezone.utc))]
2026-03-18T14:23:40.014604662Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:23:40.430177034Z [inf] 2026-03-18 14:23:40,265 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:23:40.430183746Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:23:40.430189630Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:23:40.430194665Z [inf] [parameters: (UUID('fc791d07-ac8a-42e1-9ac7-d15411e7ccfd'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 23, 40, 131645, tzinfo=datetime.timezone.utc))]
2026-03-18T14:23:40.430199892Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:23:40.430284862Z [inf] 2026-03-18 14:23:40,252 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:00.157565671Z [inf] 2026-03-18 14:23:50,404 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:00.157573890Z [inf] 2026-03-18 14:23:50,425 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:24:00.157579184Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:24:00.157584446Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:24:00.157589488Z [inf] [parameters: (UUID('9f65267a-ad5b-485f-a374-f2efa59e37cb'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 23, 50, 267470, tzinfo=datetime.timezone.utc))]
2026-03-18T14:24:00.157596302Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:24:00.572777052Z [inf] 2026-03-18 14:24:00,553 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:00.580703808Z [inf] 2026-03-18 14:24:00,575 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:24:00.580710339Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:24:00.580714983Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:24:00.580719613Z [inf] [parameters: (UUID('0fc4e393-5eac-4a80-bf25-fb78221e43e7'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 24, 0, 424886, tzinfo=datetime.timezone.utc))]
2026-03-18T14:24:00.580733681Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:24:20.606456814Z [inf] [parameters: (UUID('0dc304b6-194d-40a5-8141-edf1ebb0bc59'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 24, 10, 576068, tzinfo=datetime.timezone.utc))]
2026-03-18T14:24:20.606467880Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:24:20.606484214Z [inf] 2026-03-18 14:24:10,728 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:24:20.606492548Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:24:20.606499252Z [inf] 2026-03-18 14:24:10,707 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:20.606502916Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:24:20.857924156Z [inf] 2026-03-18 14:24:20,857 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:20.875277172Z [inf] 2026-03-18 14:24:20,872 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:24:20.875282294Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:24:20.875287115Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:24:20.875294676Z [inf] [parameters: (UUID('12a73175-abcf-430a-ab99-8ede6bddf6bb'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 24, 20, 728467, tzinfo=datetime.timezone.utc))]
2026-03-18T14:24:20.875300476Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:24:40.887791994Z [inf] 2026-03-18 14:24:31,011 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:40.887796027Z [inf] 2026-03-18 14:24:31,030 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:24:40.887799545Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:24:40.887804034Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:24:40.887807591Z [inf] [parameters: (UUID('dc2e25c7-dbae-457c-85fb-7284a79f6ad7'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 24, 30, 873197, tzinfo=datetime.timezone.utc))]
2026-03-18T14:24:40.887811214Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:24:41.162024031Z [inf] 2026-03-18 14:24:41,160 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:41.176635221Z [inf] 2026-03-18 14:24:41,175 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:24:41.176641255Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:24:41.176644725Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:24:41.176648680Z [inf] [parameters: (UUID('01d4b0f8-57d7-413d-a8f7-7afa3fc99842'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 24, 41, 31748, tzinfo=datetime.timezone.utc))]
2026-03-18T14:24:41.176652422Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:25:01.180459418Z [inf] 2026-03-18 14:24:51,304 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:25:01.180467244Z [inf] 2026-03-18 14:24:51,321 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:25:01.180472823Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:25:01.180478353Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:25:01.180483182Z [inf] [parameters: (UUID('044e5d76-d02b-4d14-b080-f0a56301b73c'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 24, 51, 175539, tzinfo=datetime.timezone.utc))]
2026-03-18T14:25:01.180487888Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:25:01.771946949Z [inf] 2026-03-18 14:25:01,447 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:25:01.771953608Z [inf] 2026-03-18 14:25:01,462 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:25:01.771961468Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:25:01.771969954Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:25:01.771977797Z [inf] [parameters: (UUID('34704bbc-1db9-4dcf-8754-23c93a4a59c5'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 25, 1, 321327, tzinfo=datetime.timezone.utc))]
2026-03-18T14:25:01.771984486Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:25:19.421851748Z [inf] Stopping Container
user: Continue where you left off. The previous model attempt failed or timed out.
user: System: [2026-03-18 15:13:29 GMT+1] Exec completed (fast-can, code 0) :: ==> Summary 🍺 /opt/homebrew/Cellar/postgresql@17/17.9: 3,824 files, 75.7MB ==> Running `brew cleanup postgresql@17`... Disable this behaviour by setting `HOMEBREW_NO_INSTALL_CLEA…
System: [2026-03-18 15:17:31 GMT+1] Exec completed (fresh-fj, code 0) :: Recent Deployments 81ea0adf-9c24-456b-aa87-ee652bd56cde | BUILDING | 2026-03-18 15:16:21 +01:00 07264905-52d7-495c-9616-977f0a4213d9 | SUCCESS | 2026-03-18 15:08:06 +01:00 15e045f…
System: [2026-03-18 15:18:39 GMT+1] Exec completed (marine-c, code 0) :: Recent Deployments 81ea0adf-9c24-456b-aa87-ee652bd56cde | SUCCESS | 2026-03-18 15:16:21 +01:00 07264905-52d7-495c-9616-977f0a4213d9 | REMOVED | 2026-03-18 15:08:06 +01:00 15e045ff…
System: [2026-03-18 15:22:24 GMT+1] Exec completed (briny-fo, code 0) :: Recent Deployments 2df21cd7-5c68-4018-853f-a528e84b2529 | SUCCESS | 2026-03-18 15:20:34 +01:00 81ea0adf-9c24-456b-aa87-ee652bd56cde | REMOVED | 2026-03-18 15:16:21 +01:00 07264905…

Sender (untrusted metadata):
```json
{
  "label": "openclaw-control-ui",
  "id": "openclaw-control-ui"
}
```

[Wed 2026-03-18 15:26 GMT+1] 2026-03-18T14:20:43.351676235Z [inf] 2026-03-18 14:20:33,787 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:20:43.351681566Z [inf] 2026-03-18 14:20:33,804 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:20:43.351686218Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:20:43.351690763Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:20:43.351695192Z [inf] [parameters: (UUID('2cdb7c12-f612-4c7e-8a6e-822a47a89691'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 20, 33, 655867, tzinfo=datetime.timezone.utc))]
2026-03-18T14:20:43.351699997Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:20:43.939422066Z [inf] 2026-03-18 14:20:43,937 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:20:43.954688766Z [inf] 2026-03-18 14:20:43,952 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:20:43.954693813Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:20:43.954699238Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:20:43.954704517Z [inf] [parameters: (UUID('687ad786-f5db-46ec-b2e7-a147fc6259a8'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 20, 43, 805553, tzinfo=datetime.timezone.utc))]
2026-03-18T14:20:43.954709078Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:20:53.550274681Z [err] 2026-03-18 14:20:43.925 UTC [54247] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:20:53.550286790Z [err] 2026-03-18 14:20:43.925 UTC [54247] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:20:54.081708852Z [err] 2026-03-18 14:20:54.079 UTC [54248] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:20:54.081712961Z [err] 2026-03-18 14:20:54.079 UTC [54248] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:21:03.951472616Z [inf] 2026-03-18 14:20:54,084 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:21:03.951532777Z [inf] 2026-03-18 14:20:54,110 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:21:03.951540369Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:21:03.951546883Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:21:03.951551735Z [inf] [parameters: (UUID('ffa64427-bea7-453b-ab04-cf3dac87283f'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 20, 53, 953234, tzinfo=datetime.timezone.utc))]
2026-03-18T14:21:03.951557711Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:21:04.247872821Z [inf] 2026-03-18 14:21:04,244 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:21:04.268569547Z [inf] 2026-03-18 14:21:04,262 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:21:04.268575177Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:21:04.268580473Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:21:04.268586089Z [inf] [parameters: (UUID('44194c32-26b9-4b9a-8a97-602ba2ccc1f6'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 21, 4, 112357, tzinfo=datetime.timezone.utc))]
2026-03-18T14:21:04.268591817Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:21:14.080569871Z [err] 2026-03-18 14:21:04.234 UTC [54249] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:21:14.080573971Z [err] 2026-03-18 14:21:04.234 UTC [54249] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:21:14.397409032Z [err] 2026-03-18 14:21:14.391 UTC [54250] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:21:14.397416002Z [err] 2026-03-18 14:21:14.391 UTC [54250] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:21:24.266195783Z [inf] 2026-03-18 14:21:14,400 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:21:24.266205146Z [inf] 2026-03-18 14:21:14,419 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:21:24.266211258Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:21:24.266216519Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:21:24.266221450Z [inf] [parameters: (UUID('23133f01-3b06-4086-a9a0-f45e1e389cbf'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 21, 14, 262012, tzinfo=datetime.timezone.utc))]
2026-03-18T14:21:24.266226919Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:21:24.859121124Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:21:24.859214049Z [inf] 2026-03-18 14:21:24,550 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:21:24.859218594Z [inf] 2026-03-18 14:21:24,565 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:21:24.859222880Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:21:24.859227557Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:21:24.859231914Z [inf] [parameters: (UUID('c9619176-e6a0-44fd-8eb9-107c9f5874ad'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 21, 24, 421437, tzinfo=datetime.timezone.utc))]
2026-03-18T14:21:34.397898743Z [err] 2026-03-18 14:21:24.538 UTC [54251] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:21:34.397902883Z [err] 2026-03-18 14:21:24.538 UTC [54251] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:21:34.969592983Z [err] 2026-03-18 14:21:34.685 UTC [54252] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:21:34.969596263Z [err] 2026-03-18 14:21:34.685 UTC [54252] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:21:44.529724806Z [inf] 2026-03-18 14:21:34,696 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:21:44.529734346Z [inf] 2026-03-18 14:21:34,712 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:21:44.529741213Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:21:44.529750232Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:21:44.529757249Z [inf] [parameters: (UUID('a1f1a335-9ec3-40ed-aaa5-f0157968b401'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 21, 34, 566939, tzinfo=datetime.timezone.utc))]
2026-03-18T14:21:44.529763635Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:21:44.923315073Z [inf] 2026-03-18 14:21:44,842 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:21:44.923320968Z [inf] 2026-03-18 14:21:44,858 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:21:44.923326648Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:21:44.923332476Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:21:44.923337459Z [inf] [parameters: (UUID('565edd89-b6b8-4832-8b52-d1a3c3cba7b8'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 21, 44, 713521, tzinfo=datetime.timezone.utc))]
2026-03-18T14:21:44.923342005Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:21:54.680698371Z [err] 2026-03-18 14:21:44.830 UTC [54254] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:21:54.680701961Z [err] 2026-03-18 14:21:44.830 UTC [54254] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:21:55.137540060Z [err] 2026-03-18 14:21:54.970 UTC [54255] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:21:55.137544230Z [err] 2026-03-18 14:21:54.970 UTC [54255] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:21:55.445344065Z [inf] Starting Container
2026-03-18T14:21:57.973187229Z [inf] 2026-03-18 14:21:57,501 - src.api.middleware.rate_limit - INFO - Rate limiting enabled: 100 requests per 60 seconds
2026-03-18T14:21:57.973196142Z [err] INFO: Started server process [1]
2026-03-18T14:21:57.973203909Z [err] INFO: Waiting for application startup.
2026-03-18T14:21:57.973210805Z [inf] 2026-03-18 14:21:57,635 - src.api.main - INFO - Starting up API...
2026-03-18T14:21:57.973219302Z [inf] 2026-03-18 14:21:57,636 - src.api.main - INFO - Environment variable validation completed
2026-03-18T14:21:57.973225564Z [inf] 2026-03-18 14:21:57,636 - src.api.main - INFO - Running in development mode
2026-03-18T14:21:57.973231618Z [inf] 2026-03-18 14:21:57,636 - src.api.main - INFO - Database initialization running in background
2026-03-18T14:21:57.973250404Z [err] INFO: Application startup complete.
2026-03-18T14:21:57.973256560Z [err] INFO: Uvicorn running on http://0.0.0.0:8080 (Press CTRL+C to quit)
2026-03-18T14:21:57.973261867Z [inf] 2026-03-18 14:21:57,925 - src.api.main - INFO - Database initialized
2026-03-18T14:21:58.647859225Z [inf] 2026-03-18 14:21:58,638 - src.api.main - INFO - Database ready; starting background monitor
2026-03-18T14:21:58.647863596Z [inf] 2026-03-18 14:21:58,639 - src.api.services.monitor - INFO - Starting background agent monitor...
2026-03-18T14:21:58.647869828Z [inf] 2026-03-18 14:21:58,639 - src.api.services.self_healer - INFO - Health check scheduler started
2026-03-18T14:21:58.647875648Z [inf] 2026-03-18 14:21:58,639 - src.api.services.self_healer - INFO - Self-healing service started
2026-03-18T14:21:58.647880694Z [inf] 2026-03-18 14:21:58,639 - src.api.services.self_healer - INFO - Registered recovery handler for restart
2026-03-18T14:21:58.647884563Z [inf] 2026-03-18 14:21:58,639 - src.api.services.self_healer - INFO - Registered recovery handler for rollback
2026-03-18T14:21:59.008429738Z [inf] 2026-03-18 14:21:58,815 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:21:59.008437751Z [inf] 2026-03-18 14:21:58,833 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:21:59.008445155Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:21:59.008451903Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:21:59.008458703Z [inf] [parameters: (UUID('193c9fa6-28ea-41fc-91ce-82ff0772da50'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 21, 58, 639404, tzinfo=datetime.timezone.utc))]
2026-03-18T14:21:59.008465749Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:21:59.149983317Z [err] 2026-03-18 14:21:58.804 UTC [54257] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:21:59.149986457Z [err] 2026-03-18 14:21:58.804 UTC [54257] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:22:04.966446886Z [inf] 2026-03-18 14:22:04,053 - src.api.services.self_healer - INFO - Self-healing service stopped
2026-03-18T14:22:04.966461267Z [err] INFO: Application shutdown complete.
2026-03-18T14:22:04.966474418Z [err] INFO: Finished server process [1]
2026-03-18T14:22:04.966547563Z [inf] 2026-03-18 14:21:54,981 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:04.966555176Z [inf] 2026-03-18 14:21:54,999 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:04.966561562Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:04.966565965Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:04.966570010Z [inf] [parameters: (UUID('b1ab2623-9b0e-47f8-86f8-5b9a0491ce47'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 21, 54, 859731, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:04.966573850Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:22:04.966577581Z [err] INFO: Shutting down
2026-03-18T14:22:04.966581059Z [err] INFO: Waiting for application shutdown.
2026-03-18T14:22:04.966585302Z [inf] 2026-03-18 14:22:04,053 - src.api.services.monitor - INFO - Background agent monitor cancellation requested
2026-03-18T14:22:04.966590256Z [inf] 2026-03-18 14:22:04,053 - src.api.services.self_healer - INFO - Health check scheduler stopped
2026-03-18T14:22:05.387941360Z [inf] Stopping Container
2026-03-18T14:22:18.709962177Z [inf] 2026-03-18 14:22:08,967 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:18.709966188Z [inf] 2026-03-18 14:22:08,985 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:18.709969952Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:18.709974339Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:18.709978285Z [inf] [parameters: (UUID('2f6b448b-1a6f-49a8-bc66-7a3b079ae4ba'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 22, 8, 833512, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:18.709983114Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:22:18.814792702Z [err] 2026-03-18 14:22:08.956 UTC [54258] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:22:18.814795641Z [err] 2026-03-18 14:22:08.956 UTC [54258] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:22:19.143633475Z [err] 2026-03-18 14:22:19.105 UTC [54259] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:22:19.143636245Z [err] 2026-03-18 14:22:19.105 UTC [54259] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:22:19.205597125Z [inf] 2026-03-18 14:22:19,114 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:19.205604013Z [inf] 2026-03-18 14:22:19,133 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:19.205610647Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:19.205616819Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:19.205624665Z [inf] [parameters: (UUID('34cb9d65-0e82-4382-bae3-f2e9d9fe229e'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 22, 18, 987246, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:19.205631595Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:22:38.857410936Z [err] 2026-03-18 14:22:29.262 UTC [54260] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:22:38.857414826Z [err] 2026-03-18 14:22:29.262 UTC [54260] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:22:38.867970214Z [inf] 2026-03-18 14:22:29,272 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:38.867978904Z [inf] 2026-03-18 14:22:29,291 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:38.867985046Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:38.867990159Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:38.867994894Z [inf] [parameters: (UUID('1ae76a28-8e25-4ad0-a835-721ae8df130a'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 22, 29, 134379, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:38.867999427Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:22:39.409808468Z [err] 2026-03-18 14:22:39.408 UTC [54261] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:22:39.409813198Z [err] 2026-03-18 14:22:39.408 UTC [54261] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:22:39.425850201Z [inf] 2026-03-18 14:22:39,420 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:39.438257407Z [inf] 2026-03-18 14:22:39,435 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:39.438262717Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:39.438268823Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:39.438272983Z [inf] [parameters: (UUID('e20b1faf-c437-4297-a1c1-9d75631da225'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 22, 39, 292243, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:39.438278275Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:22:59.440850684Z [inf] 2026-03-18 14:22:49,566 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:59.440855242Z [inf] 2026-03-18 14:22:49,582 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:59.440860506Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:59.440866982Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:59.440871398Z [inf] [parameters: (UUID('a2b7d3a3-ba75-4fc7-a835-23fc670d90bf'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 22, 49, 436567, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:59.440875823Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:22:59.699771521Z [err] 2026-03-18 14:22:59.695 UTC [54264] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:22:59.699776591Z [err] 2026-03-18 14:22:59.695 UTC [54264] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:22:59.707160120Z [inf] 2026-03-18 14:22:59,706 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:59.733508340Z [inf] 2026-03-18 14:22:59,723 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:59.733511825Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:59.733515164Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:59.733518756Z [inf] [parameters: (UUID('e2fd175a-c3af-49f1-a19d-2e016f0c0308'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 22, 59, 582728, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:59.733522747Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:23:19.698742285Z [err] 2026-03-18 14:23:09.831 UTC [54265] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:23:19.698748704Z [err] 2026-03-18 14:23:09.831 UTC [54265] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:23:19.736743921Z [inf] 2026-03-18 14:23:09,843 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:23:19.736750006Z [inf] 2026-03-18 14:23:09,860 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:23:19.736753873Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:23:19.736757692Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:23:19.736761290Z [inf] [parameters: (UUID('3e583acc-6bb4-46eb-be3a-317444d73b6e'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 23, 9, 723803, tzinfo=datetime.timezone.utc))]
2026-03-18T14:23:19.736764883Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:23:19.985818572Z [inf] 2026-03-18 14:23:19,980 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:23:20.002627016Z [inf] 2026-03-18 14:23:19,996 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:23:20.002633861Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:23:20.002640032Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:23:20.002646173Z [inf] [parameters: (UUID('e0d5def4-c391-4302-8a7d-76d97bbe8c99'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 23, 19, 861569, tzinfo=datetime.timezone.utc))]
2026-03-18T14:23:20.002652306Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:23:20.354844729Z [err] 2026-03-18 14:23:19.968 UTC [54266] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:23:20.354850979Z [err] 2026-03-18 14:23:19.968 UTC [54266] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:23:30.343348431Z [err] 2026-03-18 14:23:30.103 UTC [54267] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:23:30.343354951Z [err] 2026-03-18 14:23:30.103 UTC [54267] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:23:40.014576448Z [inf] 2026-03-18 14:23:30,115 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:23:40.014581701Z [inf] 2026-03-18 14:23:30,130 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:23:40.014589933Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:23:40.014595420Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:23:40.014600405Z [inf] [parameters: (UUID('60412b47-e088-4b3e-8bbf-3a591c5bccf2'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 23, 29, 997335, tzinfo=datetime.timezone.utc))]
2026-03-18T14:23:40.014604662Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:23:40.430177034Z [inf] 2026-03-18 14:23:40,265 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:23:40.430183746Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:23:40.430189630Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:23:40.430194665Z [inf] [parameters: (UUID('fc791d07-ac8a-42e1-9ac7-d15411e7ccfd'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 23, 40, 131645, tzinfo=datetime.timezone.utc))]
2026-03-18T14:23:40.430199892Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:23:40.430284862Z [inf] 2026-03-18 14:23:40,252 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:23:50.396682591Z [err] 2026-03-18 14:23:50.393 UTC [54270] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:23:50.396688001Z [err] 2026-03-18 14:23:50.393 UTC [54270] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:24:00.157565671Z [inf] 2026-03-18 14:23:50,404 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:00.157573890Z [inf] 2026-03-18 14:23:50,425 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:24:00.157579184Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:24:00.157584446Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:24:00.157589488Z [inf] [parameters: (UUID('9f65267a-ad5b-485f-a374-f2efa59e37cb'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 23, 50, 267470, tzinfo=datetime.timezone.utc))]
2026-03-18T14:24:00.157596302Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:24:00.572777052Z [inf] 2026-03-18 14:24:00,553 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:00.580703808Z [inf] 2026-03-18 14:24:00,575 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:24:00.580710339Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:24:00.580714983Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:24:00.580719613Z [inf] [parameters: (UUID('0fc4e393-5eac-4a80-bf25-fb78221e43e7'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 24, 0, 424886, tzinfo=datetime.timezone.utc))]
2026-03-18T14:24:00.580733681Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:24:10.031067600Z [err] 2026-03-18 14:24:00.541 UTC [54271] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:24:10.031070100Z [err] 2026-03-18 14:24:00.541 UTC [54271] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:24:10.719957821Z [err] 2026-03-18 14:24:10.696 UTC [54272] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:24:10.719967051Z [err] 2026-03-18 14:24:10.696 UTC [54272] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:24:20.606456814Z [inf] [parameters: (UUID('0dc304b6-194d-40a5-8141-edf1ebb0bc59'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 24, 10, 576068, tzinfo=datetime.timezone.utc))]
2026-03-18T14:24:20.606467880Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:24:20.606484214Z [inf] 2026-03-18 14:24:10,728 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:24:20.606492548Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:24:20.606499252Z [inf] 2026-03-18 14:24:10,707 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:20.606502916Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:24:20.857924156Z [inf] 2026-03-18 14:24:20,857 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:20.875277172Z [inf] 2026-03-18 14:24:20,872 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:24:20.875282294Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:24:20.875287115Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:24:20.875294676Z [inf] [parameters: (UUID('12a73175-abcf-430a-ab99-8ede6bddf6bb'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 24, 20, 728467, tzinfo=datetime.timezone.utc))]
2026-03-18T14:24:20.875300476Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:24:30.702041109Z [err] 2026-03-18 14:24:20.845 UTC [54273] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:24:30.702048388Z [err] 2026-03-18 14:24:20.845 UTC [54273] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:24:31.006561396Z [err] 2026-03-18 14:24:31.002 UTC [54274] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:24:31.006567076Z [err] 2026-03-18 14:24:31.002 UTC [54274] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:24:40.887791994Z [inf] 2026-03-18 14:24:31,011 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:40.887796027Z [inf] 2026-03-18 14:24:31,030 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:24:40.887799545Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:24:40.887804034Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:24:40.887807591Z [inf] [parameters: (UUID('dc2e25c7-dbae-457c-85fb-7284a79f6ad7'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 24, 30, 873197, tzinfo=datetime.timezone.utc))]
2026-03-18T14:24:40.887811214Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:24:41.162024031Z [inf] 2026-03-18 14:24:41,160 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:41.176635221Z [inf] 2026-03-18 14:24:41,175 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:24:41.176641255Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:24:41.176644725Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:24:41.176648680Z [inf] [parameters: (UUID('01d4b0f8-57d7-413d-a8f7-7afa3fc99842'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 24, 41, 31748, tzinfo=datetime.timezone.utc))]
2026-03-18T14:24:41.176652422Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:24:51.006723698Z [err] 2026-03-18 14:24:41.147 UTC [54276] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:24:51.006729828Z [err] 2026-03-18 14:24:41.147 UTC [54276] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:24:51.559502221Z [err] 2026-03-18 14:24:51.292 UTC [54277] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:24:51.559507280Z [err] 2026-03-18 14:24:51.292 UTC [54277] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:25:01.180459418Z [inf] 2026-03-18 14:24:51,304 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:25:01.180467244Z [inf] 2026-03-18 14:24:51,321 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:25:01.180472823Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:25:01.180478353Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:25:01.180483182Z [inf] [parameters: (UUID('044e5d76-d02b-4d14-b080-f0a56301b73c'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 24, 51, 175539, tzinfo=datetime.timezone.utc))]
2026-03-18T14:25:01.180487888Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:25:01.771946949Z [inf] 2026-03-18 14:25:01,447 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:25:01.771953608Z [inf] 2026-03-18 14:25:01,462 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:25:01.771961468Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:25:01.771969954Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:25:01.771977797Z [inf] [parameters: (UUID('34704bbc-1db9-4dcf-8754-23c93a4a59c5'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 25, 1, 321327, tzinfo=datetime.timezone.utc))]
2026-03-18T14:25:01.771984486Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:25:10.916749804Z [inf] Starting Container
2026-03-18T14:25:11.193287543Z [err] 2026-03-18 14:25:01.434 UTC [54278] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:25:11.193363981Z [err] 2026-03-18 14:25:01.434 UTC [54278] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:25:11.623222324Z [err] 2026-03-18 14:25:11.577 UTC [54279] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:25:11.623227294Z [err] 2026-03-18 14:25:11.577 UTC [54279] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:25:13.358611759Z [err] INFO: Started server process [1]
2026-03-18T14:25:13.358615245Z [inf] 2026-03-18 14:25:13,090 - src.api.main - INFO - Database initialized
2026-03-18T14:25:13.358622624Z [err] INFO: Waiting for application startup.
2026-03-18T14:25:13.358630770Z [inf] 2026-03-18 14:25:12,524 - src.api.main - INFO - Starting up API...
2026-03-18T14:25:13.358639133Z [inf] 2026-03-18 14:25:12,525 - src.api.main - INFO - Environment variable validation completed
2026-03-18T14:25:13.358647089Z [inf] 2026-03-18 14:25:12,525 - src.api.main - INFO - Running in development mode
2026-03-18T14:25:13.358653999Z [inf] 2026-03-18 14:25:12,525 - src.api.main - INFO - Database initialization running in background
2026-03-18T14:25:13.358661044Z [err] INFO: Application startup complete.
2026-03-18T14:25:13.358669947Z [err] INFO: Uvicorn running on http://0.0.0.0:8080 (Press CTRL+C to quit)
2026-03-18T14:25:13.358701249Z [inf] 2026-03-18 14:25:12,369 - src.api.middleware.rate_limit - INFO - Rate limiting enabled: 100 requests per 60 seconds
2026-03-18T14:25:13.530866974Z [inf] 2026-03-18 14:25:13,528 - src.api.main - INFO - Database ready; starting background monitor
2026-03-18T14:25:13.530873695Z [inf] 2026-03-18 14:25:13,528 - src.api.services.monitor - INFO - Starting background agent monitor...
2026-03-18T14:25:13.530878388Z [inf] 2026-03-18 14:25:13,528 - src.api.services.self_healer - INFO - Health check scheduler started
2026-03-18T14:25:13.530883113Z [inf] 2026-03-18 14:25:13,528 - src.api.services.self_healer - INFO - Self-healing service started
2026-03-18T14:25:13.530887732Z [inf] 2026-03-18 14:25:13,528 - src.api.services.self_healer - INFO - Registered recovery handler for restart
2026-03-18T14:25:13.530891851Z [inf] 2026-03-18 14:25:13,528 - src.api.services.self_healer - INFO - Registered recovery handler for rollback
2026-03-18T14:25:13.755833206Z [inf] 2026-03-18 14:25:13,753 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:25:13.793813065Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:25:13.793822399Z [inf] [parameters: (UUID('fe196b05-faf8-49c1-b5c7-0089f456c694'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 25, 13, 529025, tzinfo=datetime.timezone.utc))]
2026-03-18T14:25:13.793828332Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:25:13.793984687Z [inf] 2026-03-18 14:25:13,791 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:25:13.793990321Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:25:19.421851748Z [inf] Stopping Container
2026-03-18T14:25:21.483214131Z [inf] 2026-03-18 14:25:11,589 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:25:21.483229925Z [inf] 2026-03-18 14:25:11,607 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:25:21.483239854Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:25:21.483246373Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:25:21.483251724Z [inf] [parameters: (UUID('7db49892-bcd4-4746-948d-bbe754e1bf3e'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 25, 11, 462942, tzinfo=datetime.timezone.utc))]
2026-03-18T14:25:21.483258109Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:25:21.483269014Z [err] INFO: Shutting down
2026-03-18T14:25:21.483274791Z [err] INFO: Waiting for application shutdown.
2026-03-18T14:25:21.483284262Z [inf] 2026-03-18 14:25:18,723 - src.api.services.monitor - INFO - Background agent monitor cancellation requested
2026-03-18T14:25:21.483290575Z [inf] 2026-03-18 14:25:18,723 - src.api.services.self_healer - INFO - Health check scheduler stopped
2026-03-18T14:25:21.483297660Z [inf] 2026-03-18 14:25:18,723 - src.api.services.self_healer - INFO - Self-healing service stopped
2026-03-18T14:25:21.483302500Z [err] INFO: Application shutdown complete.
2026-03-18T14:25:21.483308471Z [err] INFO: Finished server process [1]
2026-03-18T14:25:33.761291509Z [err] 2026-03-18 14:25:23.966 UTC [54282] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:25:33.761295569Z [err] 2026-03-18 14:25:23.966 UTC [54282] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:25:33.780527614Z [inf] [parameters: (UUID('d161631e-2c57-4d08-98e2-653fb9a97f83'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 25, 23, 792011, tzinfo=datetime.timezone.utc))]
2026-03-18T14:25:33.780540648Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:25:33.780627440Z [inf] 2026-03-18 14:25:23,972 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:25:33.780633817Z [inf] 2026-03-18 14:25:23,998 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:25:33.780647198Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:25:33.780654733Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:25:34.149271709Z [err] 2026-03-18 14:25:34.138 UTC [54283] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:25:34.149284248Z [err] 2026-03-18 14:25:34.138 UTC [54283] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:25:34.150612504Z [inf] 2026-03-18 14:25:34,142 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:25:34.177331606Z [inf] 2026-03-18 14:25:34,171 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:25:34.177339680Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:25:34.177346375Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:25:34.177351685Z [inf] [parameters: (UUID('41085f97-edbe-4ec1-be88-c367df80f96c'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 25, 33, 998843, tzinfo=datetime.timezone.utc))]
2026-03-18T14:25:34.177356676Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)



2026-03-18T14:21:55.445344065Z [inf] Starting Container
2026-03-18T14:21:57.973187229Z [inf] 2026-03-18 14:21:57,501 - src.api.middleware.rate_limit - INFO - Rate limiting enabled: 100 requests per 60 seconds
2026-03-18T14:21:57.973196142Z [err] INFO: Started server process [1]
2026-03-18T14:21:57.973203909Z [err] INFO: Waiting for application startup.
2026-03-18T14:21:57.973210805Z [inf] 2026-03-18 14:21:57,635 - src.api.main - INFO - Starting up API...
2026-03-18T14:21:57.973219302Z [inf] 2026-03-18 14:21:57,636 - src.api.main - INFO - Environment variable validation completed
2026-03-18T14:21:57.973225564Z [inf] 2026-03-18 14:21:57,636 - src.api.main - INFO - Running in development mode
2026-03-18T14:21:57.973231618Z [inf] 2026-03-18 14:21:57,636 - src.api.main - INFO - Database initialization running in background
2026-03-18T14:21:57.973250404Z [err] INFO: Application startup complete.
2026-03-18T14:21:57.973256560Z [err] INFO: Uvicorn running on http://0.0.0.0:8080 (Press CTRL+C to quit)
2026-03-18T14:21:57.973261867Z [inf] 2026-03-18 14:21:57,925 - src.api.main - INFO - Database initialized
2026-03-18T14:21:58.647859225Z [inf] 2026-03-18 14:21:58,638 - src.api.main - INFO - Database ready; starting background monitor
2026-03-18T14:21:58.647863596Z [inf] 2026-03-18 14:21:58,639 - src.api.services.monitor - INFO - Starting background agent monitor...
2026-03-18T14:21:58.647869828Z [inf] 2026-03-18 14:21:58,639 - src.api.services.self_healer - INFO - Health check scheduler started
2026-03-18T14:21:58.647875648Z [inf] 2026-03-18 14:21:58,639 - src.api.services.self_healer - INFO - Self-healing service started
2026-03-18T14:21:58.647880694Z [inf] 2026-03-18 14:21:58,639 - src.api.services.self_healer - INFO - Registered recovery handler for restart
2026-03-18T14:21:58.647884563Z [inf] 2026-03-18 14:21:58,639 - src.api.services.self_healer - INFO - Registered recovery handler for rollback
2026-03-18T14:21:59.008429738Z [inf] 2026-03-18 14:21:58,815 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:21:59.008437751Z [inf] 2026-03-18 14:21:58,833 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:21:59.008445155Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:21:59.008451903Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:21:59.008458703Z [inf] [parameters: (UUID('193c9fa6-28ea-41fc-91ce-82ff0772da50'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 21, 58, 639404, tzinfo=datetime.timezone.utc))]
2026-03-18T14:21:59.008465749Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:22:18.709962177Z [inf] 2026-03-18 14:22:08,967 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:18.709966188Z [inf] 2026-03-18 14:22:08,985 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:18.709969952Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:18.709974339Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:18.709978285Z [inf] [parameters: (UUID('2f6b448b-1a6f-49a8-bc66-7a3b079ae4ba'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 22, 8, 833512, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:18.709983114Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:22:19.205597125Z [inf] 2026-03-18 14:22:19,114 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:19.205604013Z [inf] 2026-03-18 14:22:19,133 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:19.205610647Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:19.205616819Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:19.205624665Z [inf] [parameters: (UUID('34cb9d65-0e82-4382-bae3-f2e9d9fe229e'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 22, 18, 987246, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:19.205631595Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:22:38.867970214Z [inf] 2026-03-18 14:22:29,272 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:38.867978904Z [inf] 2026-03-18 14:22:29,291 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:38.867985046Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:38.867990159Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:38.867994894Z [inf] [parameters: (UUID('1ae76a28-8e25-4ad0-a835-721ae8df130a'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 22, 29, 134379, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:38.867999427Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:22:39.425850201Z [inf] 2026-03-18 14:22:39,420 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:39.438257407Z [inf] 2026-03-18 14:22:39,435 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:39.438262717Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:39.438268823Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:39.438272983Z [inf] [parameters: (UUID('e20b1faf-c437-4297-a1c1-9d75631da225'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 22, 39, 292243, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:39.438278275Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:22:59.440850684Z [inf] 2026-03-18 14:22:49,566 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:59.440855242Z [inf] 2026-03-18 14:22:49,582 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:59.440860506Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:59.440866982Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:59.440871398Z [inf] [parameters: (UUID('a2b7d3a3-ba75-4fc7-a835-23fc670d90bf'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 22, 49, 436567, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:59.440875823Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:22:59.707160120Z [inf] 2026-03-18 14:22:59,706 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:59.733508340Z [inf] 2026-03-18 14:22:59,723 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:59.733511825Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:59.733515164Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:59.733518756Z [inf] [parameters: (UUID('e2fd175a-c3af-49f1-a19d-2e016f0c0308'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 22, 59, 582728, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:59.733522747Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:23:19.736743921Z [inf] 2026-03-18 14:23:09,843 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:23:19.736750006Z [inf] 2026-03-18 14:23:09,860 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:23:19.736753873Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:23:19.736757692Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:23:19.736761290Z [inf] [parameters: (UUID('3e583acc-6bb4-46eb-be3a-317444d73b6e'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 23, 9, 723803, tzinfo=datetime.timezone.utc))]
2026-03-18T14:23:19.736764883Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:23:19.985818572Z [inf] 2026-03-18 14:23:19,980 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:23:20.002627016Z [inf] 2026-03-18 14:23:19,996 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:23:20.002633861Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:23:20.002640032Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:23:20.002646173Z [inf] [parameters: (UUID('e0d5def4-c391-4302-8a7d-76d97bbe8c99'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 23, 19, 861569, tzinfo=datetime.timezone.utc))]
2026-03-18T14:23:20.002652306Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:23:40.014576448Z [inf] 2026-03-18 14:23:30,115 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:23:40.014581701Z [inf] 2026-03-18 14:23:30,130 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:23:40.014589933Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:23:40.014595420Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:23:40.014600405Z [inf] [parameters: (UUID('60412b47-e088-4b3e-8bbf-3a591c5bccf2'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 23, 29, 997335, tzinfo=datetime.timezone.utc))]
2026-03-18T14:23:40.014604662Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:23:40.430177034Z [inf] 2026-03-18 14:23:40,265 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:23:40.430183746Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:23:40.430189630Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:23:40.430194665Z [inf] [parameters: (UUID('fc791d07-ac8a-42e1-9ac7-d15411e7ccfd'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 23, 40, 131645, tzinfo=datetime.timezone.utc))]
2026-03-18T14:23:40.430199892Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:23:40.430284862Z [inf] 2026-03-18 14:23:40,252 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:00.157565671Z [inf] 2026-03-18 14:23:50,404 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:00.157573890Z [inf] 2026-03-18 14:23:50,425 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:24:00.157579184Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:24:00.157584446Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:24:00.157589488Z [inf] [parameters: (UUID('9f65267a-ad5b-485f-a374-f2efa59e37cb'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 23, 50, 267470, tzinfo=datetime.timezone.utc))]
2026-03-18T14:24:00.157596302Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:24:00.572777052Z [inf] 2026-03-18 14:24:00,553 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:00.580703808Z [inf] 2026-03-18 14:24:00,575 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:24:00.580710339Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:24:00.580714983Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:24:00.580719613Z [inf] [parameters: (UUID('0fc4e393-5eac-4a80-bf25-fb78221e43e7'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 24, 0, 424886, tzinfo=datetime.timezone.utc))]
2026-03-18T14:24:00.580733681Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:24:20.606456814Z [inf] [parameters: (UUID('0dc304b6-194d-40a5-8141-edf1ebb0bc59'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 24, 10, 576068, tzinfo=datetime.timezone.utc))]
2026-03-18T14:24:20.606467880Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:24:20.606484214Z [inf] 2026-03-18 14:24:10,728 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:24:20.606492548Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:24:20.606499252Z [inf] 2026-03-18 14:24:10,707 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:20.606502916Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:24:20.857924156Z [inf] 2026-03-18 14:24:20,857 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:20.875277172Z [inf] 2026-03-18 14:24:20,872 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:24:20.875282294Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:24:20.875287115Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:24:20.875294676Z [inf] [parameters: (UUID('12a73175-abcf-430a-ab99-8ede6bddf6bb'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 24, 20, 728467, tzinfo=datetime.timezone.utc))]
2026-03-18T14:24:20.875300476Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:24:40.887791994Z [inf] 2026-03-18 14:24:31,011 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:40.887796027Z [inf] 2026-03-18 14:24:31,030 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:24:40.887799545Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:24:40.887804034Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:24:40.887807591Z [inf] [parameters: (UUID('dc2e25c7-dbae-457c-85fb-7284a79f6ad7'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 24, 30, 873197, tzinfo=datetime.timezone.utc))]
2026-03-18T14:24:40.887811214Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:24:41.162024031Z [inf] 2026-03-18 14:24:41,160 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:41.176635221Z [inf] 2026-03-18 14:24:41,175 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:24:41.176641255Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:24:41.176644725Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:24:41.176648680Z [inf] [parameters: (UUID('01d4b0f8-57d7-413d-a8f7-7afa3fc99842'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 24, 41, 31748, tzinfo=datetime.timezone.utc))]
2026-03-18T14:24:41.176652422Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:25:01.180459418Z [inf] 2026-03-18 14:24:51,304 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:25:01.180467244Z [inf] 2026-03-18 14:24:51,321 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:25:01.180472823Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:25:01.180478353Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:25:01.180483182Z [inf] [parameters: (UUID('044e5d76-d02b-4d14-b080-f0a56301b73c'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 24, 51, 175539, tzinfo=datetime.timezone.utc))]
2026-03-18T14:25:01.180487888Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:25:01.771946949Z [inf] 2026-03-18 14:25:01,447 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:25:01.771953608Z [inf] 2026-03-18 14:25:01,462 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:25:01.771961468Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:25:01.771969954Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:25:01.771977797Z [inf] [parameters: (UUID('34704bbc-1db9-4dcf-8754-23c93a4a59c5'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 25, 1, 321327, tzinfo=datetime.timezone.utc))]
2026-03-18T14:25:01.771984486Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:25:19.421851748Z [inf] Stopping Container
user: Continue where you left off. The previous model attempt failed or timed out.
user: System: [2026-03-18 15:13:29 GMT+1] Exec completed (fast-can, code 0) :: ==> Summary 🍺 /opt/homebrew/Cellar/postgresql@17/17.9: 3,824 files, 75.7MB ==> Running `brew cleanup postgresql@17`... Disable this behaviour by setting `HOMEBREW_NO_INSTALL_CLEA…
System: [2026-03-18 15:17:31 GMT+1] Exec completed (fresh-fj, code 0) :: Recent Deployments 81ea0adf-9c24-456b-aa87-ee652bd56cde | BUILDING | 2026-03-18 15:16:21 +01:00 07264905-52d7-495c-9616-977f0a4213d9 | SUCCESS | 2026-03-18 15:08:06 +01:00 15e045f…
System: [2026-03-18 15:18:39 GMT+1] Exec completed (marine-c, code 0) :: Recent Deployments 81ea0adf-9c24-456b-aa87-ee652bd56cde | SUCCESS | 2026-03-18 15:16:21 +01:00 07264905-52d7-495c-9616-977f0a4213d9 | REMOVED | 2026-03-18 15:08:06 +01:00 15e045ff…
System: [2026-03-18 15:22:24 GMT+1] Exec completed (briny-fo, code 0) :: Recent Deployments 2df21cd7-5c68-4018-853f-a528e84b2529 | SUCCESS | 2026-03-18 15:20:34 +01:00 81ea0adf-9c24-456b-aa87-ee652bd56cde | REMOVED | 2026-03-18 15:16:21 +01:00 07264905…

Sender (untrusted metadata):
```json
{
  "label": "openclaw-control-ui",
  "id": "openclaw-control-ui"
}
```

[Wed 2026-03-18 15:26 GMT+1] 2026-03-18T14:20:43.351676235Z [inf] 2026-03-18 14:20:33,787 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:20:43.351681566Z [inf] 2026-03-18 14:20:33,804 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:20:43.351686218Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:20:43.351690763Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:20:43.351695192Z [inf] [parameters: (UUID('2cdb7c12-f612-4c7e-8a6e-822a47a89691'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 20, 33, 655867, tzinfo=datetime.timezone.utc))]
2026-03-18T14:20:43.351699997Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:20:43.939422066Z [inf] 2026-03-18 14:20:43,937 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:20:43.954688766Z [inf] 2026-03-18 14:20:43,952 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:20:43.954693813Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:20:43.954699238Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:20:43.954704517Z [inf] [parameters: (UUID('687ad786-f5db-46ec-b2e7-a147fc6259a8'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 20, 43, 805553, tzinfo=datetime.timezone.utc))]
2026-03-18T14:20:43.954709078Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:20:53.550274681Z [err] 2026-03-18 14:20:43.925 UTC [54247] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:20:53.550286790Z [err] 2026-03-18 14:20:43.925 UTC [54247] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:20:54.081708852Z [err] 2026-03-18 14:20:54.079 UTC [54248] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:20:54.081712961Z [err] 2026-03-18 14:20:54.079 UTC [54248] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:21:03.951472616Z [inf] 2026-03-18 14:20:54,084 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:21:03.951532777Z [inf] 2026-03-18 14:20:54,110 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:21:03.951540369Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:21:03.951546883Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:21:03.951551735Z [inf] [parameters: (UUID('ffa64427-bea7-453b-ab04-cf3dac87283f'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 20, 53, 953234, tzinfo=datetime.timezone.utc))]
2026-03-18T14:21:03.951557711Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:21:04.247872821Z [inf] 2026-03-18 14:21:04,244 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:21:04.268569547Z [inf] 2026-03-18 14:21:04,262 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:21:04.268575177Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:21:04.268580473Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:21:04.268586089Z [inf] [parameters: (UUID('44194c32-26b9-4b9a-8a97-602ba2ccc1f6'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 21, 4, 112357, tzinfo=datetime.timezone.utc))]
2026-03-18T14:21:04.268591817Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:21:14.080569871Z [err] 2026-03-18 14:21:04.234 UTC [54249] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:21:14.080573971Z [err] 2026-03-18 14:21:04.234 UTC [54249] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:21:14.397409032Z [err] 2026-03-18 14:21:14.391 UTC [54250] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:21:14.397416002Z [err] 2026-03-18 14:21:14.391 UTC [54250] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:21:24.266195783Z [inf] 2026-03-18 14:21:14,400 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:21:24.266205146Z [inf] 2026-03-18 14:21:14,419 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:21:24.266211258Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:21:24.266216519Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:21:24.266221450Z [inf] [parameters: (UUID('23133f01-3b06-4086-a9a0-f45e1e389cbf'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 21, 14, 262012, tzinfo=datetime.timezone.utc))]
2026-03-18T14:21:24.266226919Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:21:24.859121124Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:21:24.859214049Z [inf] 2026-03-18 14:21:24,550 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:21:24.859218594Z [inf] 2026-03-18 14:21:24,565 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:21:24.859222880Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:21:24.859227557Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:21:24.859231914Z [inf] [parameters: (UUID('c9619176-e6a0-44fd-8eb9-107c9f5874ad'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 21, 24, 421437, tzinfo=datetime.timezone.utc))]
2026-03-18T14:21:34.397898743Z [err] 2026-03-18 14:21:24.538 UTC [54251] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:21:34.397902883Z [err] 2026-03-18 14:21:24.538 UTC [54251] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:21:34.969592983Z [err] 2026-03-18 14:21:34.685 UTC [54252] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:21:34.969596263Z [err] 2026-03-18 14:21:34.685 UTC [54252] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:21:44.529724806Z [inf] 2026-03-18 14:21:34,696 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:21:44.529734346Z [inf] 2026-03-18 14:21:34,712 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:21:44.529741213Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:21:44.529750232Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:21:44.529757249Z [inf] [parameters: (UUID('a1f1a335-9ec3-40ed-aaa5-f0157968b401'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 21, 34, 566939, tzinfo=datetime.timezone.utc))]
2026-03-18T14:21:44.529763635Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:21:44.923315073Z [inf] 2026-03-18 14:21:44,842 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:21:44.923320968Z [inf] 2026-03-18 14:21:44,858 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:21:44.923326648Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:21:44.923332476Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:21:44.923337459Z [inf] [parameters: (UUID('565edd89-b6b8-4832-8b52-d1a3c3cba7b8'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 21, 44, 713521, tzinfo=datetime.timezone.utc))]
2026-03-18T14:21:44.923342005Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:21:54.680698371Z [err] 2026-03-18 14:21:44.830 UTC [54254] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:21:54.680701961Z [err] 2026-03-18 14:21:44.830 UTC [54254] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:21:55.137540060Z [err] 2026-03-18 14:21:54.970 UTC [54255] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:21:55.137544230Z [err] 2026-03-18 14:21:54.970 UTC [54255] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:21:55.445344065Z [inf] Starting Container
2026-03-18T14:21:57.973187229Z [inf] 2026-03-18 14:21:57,501 - src.api.middleware.rate_limit - INFO - Rate limiting enabled: 100 requests per 60 seconds
2026-03-18T14:21:57.973196142Z [err] INFO: Started server process [1]
2026-03-18T14:21:57.973203909Z [err] INFO: Waiting for application startup.
2026-03-18T14:21:57.973210805Z [inf] 2026-03-18 14:21:57,635 - src.api.main - INFO - Starting up API...
2026-03-18T14:21:57.973219302Z [inf] 2026-03-18 14:21:57,636 - src.api.main - INFO - Environment variable validation completed
2026-03-18T14:21:57.973225564Z [inf] 2026-03-18 14:21:57,636 - src.api.main - INFO - Running in development mode
2026-03-18T14:21:57.973231618Z [inf] 2026-03-18 14:21:57,636 - src.api.main - INFO - Database initialization running in background
2026-03-18T14:21:57.973250404Z [err] INFO: Application startup complete.
2026-03-18T14:21:57.973256560Z [err] INFO: Uvicorn running on http://0.0.0.0:8080 (Press CTRL+C to quit)
2026-03-18T14:21:57.973261867Z [inf] 2026-03-18 14:21:57,925 - src.api.main - INFO - Database initialized
2026-03-18T14:21:58.647859225Z [inf] 2026-03-18 14:21:58,638 - src.api.main - INFO - Database ready; starting background monitor
2026-03-18T14:21:58.647863596Z [inf] 2026-03-18 14:21:58,639 - src.api.services.monitor - INFO - Starting background agent monitor...
2026-03-18T14:21:58.647869828Z [inf] 2026-03-18 14:21:58,639 - src.api.services.self_healer - INFO - Health check scheduler started
2026-03-18T14:21:58.647875648Z [inf] 2026-03-18 14:21:58,639 - src.api.services.self_healer - INFO - Self-healing service started
2026-03-18T14:21:58.647880694Z [inf] 2026-03-18 14:21:58,639 - src.api.services.self_healer - INFO - Registered recovery handler for restart
2026-03-18T14:21:58.647884563Z [inf] 2026-03-18 14:21:58,639 - src.api.services.self_healer - INFO - Registered recovery handler for rollback
2026-03-18T14:21:59.008429738Z [inf] 2026-03-18 14:21:58,815 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:21:59.008437751Z [inf] 2026-03-18 14:21:58,833 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:21:59.008445155Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:21:59.008451903Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:21:59.008458703Z [inf] [parameters: (UUID('193c9fa6-28ea-41fc-91ce-82ff0772da50'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 21, 58, 639404, tzinfo=datetime.timezone.utc))]
2026-03-18T14:21:59.008465749Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:21:59.149983317Z [err] 2026-03-18 14:21:58.804 UTC [54257] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:21:59.149986457Z [err] 2026-03-18 14:21:58.804 UTC [54257] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:22:04.966446886Z [inf] 2026-03-18 14:22:04,053 - src.api.services.self_healer - INFO - Self-healing service stopped
2026-03-18T14:22:04.966461267Z [err] INFO: Application shutdown complete.
2026-03-18T14:22:04.966474418Z [err] INFO: Finished server process [1]
2026-03-18T14:22:04.966547563Z [inf] 2026-03-18 14:21:54,981 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:04.966555176Z [inf] 2026-03-18 14:21:54,999 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:04.966561562Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:04.966565965Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:04.966570010Z [inf] [parameters: (UUID('b1ab2623-9b0e-47f8-86f8-5b9a0491ce47'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 21, 54, 859731, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:04.966573850Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:22:04.966577581Z [err] INFO: Shutting down
2026-03-18T14:22:04.966581059Z [err] INFO: Waiting for application shutdown.
2026-03-18T14:22:04.966585302Z [inf] 2026-03-18 14:22:04,053 - src.api.services.monitor - INFO - Background agent monitor cancellation requested
2026-03-18T14:22:04.966590256Z [inf] 2026-03-18 14:22:04,053 - src.api.services.self_healer - INFO - Health check scheduler stopped
2026-03-18T14:22:05.387941360Z [inf] Stopping Container
2026-03-18T14:22:18.709962177Z [inf] 2026-03-18 14:22:08,967 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:18.709966188Z [inf] 2026-03-18 14:22:08,985 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:18.709969952Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:18.709974339Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:18.709978285Z [inf] [parameters: (UUID('2f6b448b-1a6f-49a8-bc66-7a3b079ae4ba'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 22, 8, 833512, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:18.709983114Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:22:18.814792702Z [err] 2026-03-18 14:22:08.956 UTC [54258] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:22:18.814795641Z [err] 2026-03-18 14:22:08.956 UTC [54258] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:22:19.143633475Z [err] 2026-03-18 14:22:19.105 UTC [54259] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:22:19.143636245Z [err] 2026-03-18 14:22:19.105 UTC [54259] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:22:19.205597125Z [inf] 2026-03-18 14:22:19,114 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:19.205604013Z [inf] 2026-03-18 14:22:19,133 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:19.205610647Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:19.205616819Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:19.205624665Z [inf] [parameters: (UUID('34cb9d65-0e82-4382-bae3-f2e9d9fe229e'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 22, 18, 987246, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:19.205631595Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:22:38.857410936Z [err] 2026-03-18 14:22:29.262 UTC [54260] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:22:38.857414826Z [err] 2026-03-18 14:22:29.262 UTC [54260] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:22:38.867970214Z [inf] 2026-03-18 14:22:29,272 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:38.867978904Z [inf] 2026-03-18 14:22:29,291 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:38.867985046Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:38.867990159Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:38.867994894Z [inf] [parameters: (UUID('1ae76a28-8e25-4ad0-a835-721ae8df130a'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 22, 29, 134379, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:38.867999427Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:22:39.409808468Z [err] 2026-03-18 14:22:39.408 UTC [54261] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:22:39.409813198Z [err] 2026-03-18 14:22:39.408 UTC [54261] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:22:39.425850201Z [inf] 2026-03-18 14:22:39,420 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:39.438257407Z [inf] 2026-03-18 14:22:39,435 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:39.438262717Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:39.438268823Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:39.438272983Z [inf] [parameters: (UUID('e20b1faf-c437-4297-a1c1-9d75631da225'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 22, 39, 292243, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:39.438278275Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:22:59.440850684Z [inf] 2026-03-18 14:22:49,566 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:59.440855242Z [inf] 2026-03-18 14:22:49,582 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:59.440860506Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:59.440866982Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:59.440871398Z [inf] [parameters: (UUID('a2b7d3a3-ba75-4fc7-a835-23fc670d90bf'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 22, 49, 436567, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:59.440875823Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:22:59.699771521Z [err] 2026-03-18 14:22:59.695 UTC [54264] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:22:59.699776591Z [err] 2026-03-18 14:22:59.695 UTC [54264] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:22:59.707160120Z [inf] 2026-03-18 14:22:59,706 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:59.733508340Z [inf] 2026-03-18 14:22:59,723 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:59.733511825Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:59.733515164Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:59.733518756Z [inf] [parameters: (UUID('e2fd175a-c3af-49f1-a19d-2e016f0c0308'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 22, 59, 582728, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:59.733522747Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:23:19.698742285Z [err] 2026-03-18 14:23:09.831 UTC [54265] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:23:19.698748704Z [err] 2026-03-18 14:23:09.831 UTC [54265] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:23:19.736743921Z [inf] 2026-03-18 14:23:09,843 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:23:19.736750006Z [inf] 2026-03-18 14:23:09,860 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:23:19.736753873Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:23:19.736757692Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:23:19.736761290Z [inf] [parameters: (UUID('3e583acc-6bb4-46eb-be3a-317444d73b6e'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 23, 9, 723803, tzinfo=datetime.timezone.utc))]
2026-03-18T14:23:19.736764883Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:23:19.985818572Z [inf] 2026-03-18 14:23:19,980 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:23:20.002627016Z [inf] 2026-03-18 14:23:19,996 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:23:20.002633861Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:23:20.002640032Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:23:20.002646173Z [inf] [parameters: (UUID('e0d5def4-c391-4302-8a7d-76d97bbe8c99'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 23, 19, 861569, tzinfo=datetime.timezone.utc))]
2026-03-18T14:23:20.002652306Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:23:20.354844729Z [err] 2026-03-18 14:23:19.968 UTC [54266] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:23:20.354850979Z [err] 2026-03-18 14:23:19.968 UTC [54266] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:23:30.343348431Z [err] 2026-03-18 14:23:30.103 UTC [54267] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:23:30.343354951Z [err] 2026-03-18 14:23:30.103 UTC [54267] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:23:40.014576448Z [inf] 2026-03-18 14:23:30,115 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:23:40.014581701Z [inf] 2026-03-18 14:23:30,130 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:23:40.014589933Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:23:40.014595420Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:23:40.014600405Z [inf] [parameters: (UUID('60412b47-e088-4b3e-8bbf-3a591c5bccf2'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 23, 29, 997335, tzinfo=datetime.timezone.utc))]
2026-03-18T14:23:40.014604662Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:23:40.430177034Z [inf] 2026-03-18 14:23:40,265 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:23:40.430183746Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:23:40.430189630Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:23:40.430194665Z [inf] [parameters: (UUID('fc791d07-ac8a-42e1-9ac7-d15411e7ccfd'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 23, 40, 131645, tzinfo=datetime.timezone.utc))]
2026-03-18T14:23:40.430199892Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:23:40.430284862Z [inf] 2026-03-18 14:23:40,252 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:23:50.396682591Z [err] 2026-03-18 14:23:50.393 UTC [54270] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:23:50.396688001Z [err] 2026-03-18 14:23:50.393 UTC [54270] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:24:00.157565671Z [inf] 2026-03-18 14:23:50,404 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:00.157573890Z [inf] 2026-03-18 14:23:50,425 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:24:00.157579184Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:24:00.157584446Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:24:00.157589488Z [inf] [parameters: (UUID('9f65267a-ad5b-485f-a374-f2efa59e37cb'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 23, 50, 267470, tzinfo=datetime.timezone.utc))]
2026-03-18T14:24:00.157596302Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:24:00.572777052Z [inf] 2026-03-18 14:24:00,553 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:00.580703808Z [inf] 2026-03-18 14:24:00,575 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:24:00.580710339Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:24:00.580714983Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:24:00.580719613Z [inf] [parameters: (UUID('0fc4e393-5eac-4a80-bf25-fb78221e43e7'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 24, 0, 424886, tzinfo=datetime.timezone.utc))]
2026-03-18T14:24:00.580733681Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:24:10.031067600Z [err] 2026-03-18 14:24:00.541 UTC [54271] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:24:10.031070100Z [err] 2026-03-18 14:24:00.541 UTC [54271] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:24:10.719957821Z [err] 2026-03-18 14:24:10.696 UTC [54272] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:24:10.719967051Z [err] 2026-03-18 14:24:10.696 UTC [54272] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:24:20.606456814Z [inf] [parameters: (UUID('0dc304b6-194d-40a5-8141-edf1ebb0bc59'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 24, 10, 576068, tzinfo=datetime.timezone.utc))]
2026-03-18T14:24:20.606467880Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:24:20.606484214Z [inf] 2026-03-18 14:24:10,728 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:24:20.606492548Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:24:20.606499252Z [inf] 2026-03-18 14:24:10,707 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:20.606502916Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:24:20.857924156Z [inf] 2026-03-18 14:24:20,857 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:20.875277172Z [inf] 2026-03-18 14:24:20,872 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:24:20.875282294Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:24:20.875287115Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:24:20.875294676Z [inf] [parameters: (UUID('12a73175-abcf-430a-ab99-8ede6bddf6bb'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 24, 20, 728467, tzinfo=datetime.timezone.utc))]
2026-03-18T14:24:20.875300476Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:24:30.702041109Z [err] 2026-03-18 14:24:20.845 UTC [54273] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:24:30.702048388Z [err] 2026-03-18 14:24:20.845 UTC [54273] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:24:31.006561396Z [err] 2026-03-18 14:24:31.002 UTC [54274] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:24:31.006567076Z [err] 2026-03-18 14:24:31.002 UTC [54274] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:24:40.887791994Z [inf] 2026-03-18 14:24:31,011 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:40.887796027Z [inf] 2026-03-18 14:24:31,030 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:24:40.887799545Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:24:40.887804034Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:24:40.887807591Z [inf] [parameters: (UUID('dc2e25c7-dbae-457c-85fb-7284a79f6ad7'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 24, 30, 873197, tzinfo=datetime.timezone.utc))]
2026-03-18T14:24:40.887811214Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:24:41.162024031Z [inf] 2026-03-18 14:24:41,160 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:41.176635221Z [inf] 2026-03-18 14:24:41,175 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:24:41.176641255Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:24:41.176644725Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:24:41.176648680Z [inf] [parameters: (UUID('01d4b0f8-57d7-413d-a8f7-7afa3fc99842'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 24, 41, 31748, tzinfo=datetime.timezone.utc))]
2026-03-18T14:24:41.176652422Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:24:51.006723698Z [err] 2026-03-18 14:24:41.147 UTC [54276] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:24:51.006729828Z [err] 2026-03-18 14:24:41.147 UTC [54276] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:24:51.559502221Z [err] 2026-03-18 14:24:51.292 UTC [54277] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:24:51.559507280Z [err] 2026-03-18 14:24:51.292 UTC [54277] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:25:01.180459418Z [inf] 2026-03-18 14:24:51,304 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:25:01.180467244Z [inf] 2026-03-18 14:24:51,321 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:25:01.180472823Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:25:01.180478353Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:25:01.180483182Z [inf] [parameters: (UUID('044e5d76-d02b-4d14-b080-f0a56301b73c'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 24, 51, 175539, tzinfo=datetime.timezone.utc))]
2026-03-18T14:25:01.180487888Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:25:01.771946949Z [inf] 2026-03-18 14:25:01,447 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:25:01.771953608Z [inf] 2026-03-18 14:25:01,462 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:25:01.771961468Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:25:01.771969954Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:25:01.771977797Z [inf] [parameters: (UUID('34704bbc-1db9-4dcf-8754-23c93a4a59c5'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 25, 1, 321327, tzinfo=datetime.timezone.utc))]
2026-03-18T14:25:01.771984486Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:25:10.916749804Z [inf] Starting Container
2026-03-18T14:25:11.193287543Z [err] 2026-03-18 14:25:01.434 UTC [54278] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:25:11.193363981Z [err] 2026-03-18 14:25:01.434 UTC [54278] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:25:11.623222324Z [err] 2026-03-18 14:25:11.577 UTC [54279] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:25:11.623227294Z [err] 2026-03-18 14:25:11.577 UTC [54279] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:25:13.358611759Z [err] INFO: Started server process [1]
2026-03-18T14:25:13.358615245Z [inf] 2026-03-18 14:25:13,090 - src.api.main - INFO - Database initialized
2026-03-18T14:25:13.358622624Z [err] INFO: Waiting for application startup.
2026-03-18T14:25:13.358630770Z [inf] 2026-03-18 14:25:12,524 - src.api.main - INFO - Starting up API...
2026-03-18T14:25:13.358639133Z [inf] 2026-03-18 14:25:12,525 - src.api.main - INFO - Environment variable validation completed
2026-03-18T14:25:13.358647089Z [inf] 2026-03-18 14:25:12,525 - src.api.main - INFO - Running in development mode
2026-03-18T14:25:13.358653999Z [inf] 2026-03-18 14:25:12,525 - src.api.main - INFO - Database initialization running in background
2026-03-18T14:25:13.358661044Z [err] INFO: Application startup complete.
2026-03-18T14:25:13.358669947Z [err] INFO: Uvicorn running on http://0.0.0.0:8080 (Press CTRL+C to quit)
2026-03-18T14:25:13.358701249Z [inf] 2026-03-18 14:25:12,369 - src.api.middleware.rate_limit - INFO - Rate limiting enabled: 100 requests per 60 seconds
2026-03-18T14:25:13.530866974Z [inf] 2026-03-18 14:25:13,528 - src.api.main - INFO - Database ready; starting background monitor
2026-03-18T14:25:13.530873695Z [inf] 2026-03-18 14:25:13,528 - src.api.services.monitor - INFO - Starting background agent monitor...
2026-03-18T14:25:13.530878388Z [inf] 2026-03-18 14:25:13,528 - src.api.services.self_healer - INFO - Health check scheduler started
2026-03-18T14:25:13.530883113Z [inf] 2026-03-18 14:25:13,528 - src.api.services.self_healer - INFO - Self-healing service started
2026-03-18T14:25:13.530887732Z [inf] 2026-03-18 14:25:13,528 - src.api.services.self_healer - INFO - Registered recovery handler for restart
2026-03-18T14:25:13.530891851Z [inf] 2026-03-18 14:25:13,528 - src.api.services.self_healer - INFO - Registered recovery handler for rollback
2026-03-18T14:25:13.755833206Z [inf] 2026-03-18 14:25:13,753 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:25:13.793813065Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:25:13.793822399Z [inf] [parameters: (UUID('fe196b05-faf8-49c1-b5c7-0089f456c694'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 25, 13, 529025, tzinfo=datetime.timezone.utc))]
2026-03-18T14:25:13.793828332Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:25:13.793984687Z [inf] 2026-03-18 14:25:13,791 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:25:13.793990321Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:25:19.421851748Z [inf] Stopping Container
2026-03-18T14:25:21.483214131Z [inf] 2026-03-18 14:25:11,589 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:25:21.483229925Z [inf] 2026-03-18 14:25:11,607 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:25:21.483239854Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:25:21.483246373Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:25:21.483251724Z [inf] [parameters: (UUID('7db49892-bcd4-4746-948d-bbe754e1bf3e'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 25, 11, 462942, tzinfo=datetime.timezone.utc))]
2026-03-18T14:25:21.483258109Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:25:21.483269014Z [err] INFO: Shutting down
2026-03-18T14:25:21.483274791Z [err] INFO: Waiting for application shutdown.
2026-03-18T14:25:21.483284262Z [inf] 2026-03-18 14:25:18,723 - src.api.services.monitor - INFO - Background agent monitor cancellation requested
2026-03-18T14:25:21.483290575Z [inf] 2026-03-18 14:25:18,723 - src.api.services.self_healer - INFO - Health check scheduler stopped
2026-03-18T14:25:21.483297660Z [inf] 2026-03-18 14:25:18,723 - src.api.services.self_healer - INFO - Self-healing service stopped
2026-03-18T14:25:21.483302500Z [err] INFO: Application shutdown complete.
2026-03-18T14:25:21.483308471Z [err] INFO: Finished server process [1]
2026-03-18T14:25:33.761291509Z [err] 2026-03-18 14:25:23.966 UTC [54282] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:25:33.761295569Z [err] 2026-03-18 14:25:23.966 UTC [54282] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:25:33.780527614Z [inf] [parameters: (UUID('d161631e-2c57-4d08-98e2-653fb9a97f83'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 25, 23, 792011, tzinfo=datetime.timezone.utc))]
2026-03-18T14:25:33.780540648Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:25:33.780627440Z [inf] 2026-03-18 14:25:23,972 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:25:33.780633817Z [inf] 2026-03-18 14:25:23,998 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:25:33.780647198Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:25:33.780654733Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:25:34.149271709Z [err] 2026-03-18 14:25:34.138 UTC [54283] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:25:34.149284248Z [err] 2026-03-18 14:25:34.138 UTC [54283] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:25:34.150612504Z [inf] 2026-03-18 14:25:34,142 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:25:34.177331606Z [inf] 2026-03-18 14:25:34,171 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:25:34.177339680Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:25:34.177346375Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:25:34.177351685Z [inf] [parameters: (UUID('41085f97-edbe-4ec1-be88-c367df80f96c'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 25, 33, 998843, tzinfo=datetime.timezone.utc))]
2026-03-18T14:25:34.177356676Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)



2026-03-18T14:21:55.445344065Z [inf] Starting Container
2026-03-18T14:21:57.973187229Z [inf] 2026-03-18 14:21:57,501 - src.api.middleware.rate_limit - INFO - Rate limiting enabled: 100 requests per 60 seconds
2026-03-18T14:21:57.973196142Z [err] INFO: Started server process [1]
2026-03-18T14:21:57.973203909Z [err] INFO: Waiting for application startup.
2026-03-18T14:21:57.973210805Z [inf] 2026-03-18 14:21:57,635 - src.api.main - INFO - Starting up API...
2026-03-18T14:21:57.973219302Z [inf] 2026-03-18 14:21:57,636 - src.api.main - INFO - Environment variable validation completed
2026-03-18T14:21:57.973225564Z [inf] 2026-03-18 14:21:57,636 - src.api.main - INFO - Running in development mode
2026-03-18T14:21:57.973231618Z [inf] 2026-03-18 14:21:57,636 - src.api.main - INFO - Database initialization running in background
2026-03-18T14:21:57.973250404Z [err] INFO: Application startup complete.
2026-03-18T14:21:57.973256560Z [err] INFO: Uvicorn running on http://0.0.0.0:8080 (Press CTRL+C to quit)
2026-03-18T14:21:57.973261867Z [inf] 2026-03-18 14:21:57,925 - src.api.main - INFO - Database initialized
2026-03-18T14:21:58.647859225Z [inf] 2026-03-18 14:21:58,638 - src.api.main - INFO - Database ready; starting background monitor
2026-03-18T14:21:58.647863596Z [inf] 2026-03-18 14:21:58,639 - src.api.services.monitor - INFO - Starting background agent monitor...
2026-03-18T14:21:58.647869828Z [inf] 2026-03-18 14:21:58,639 - src.api.services.self_healer - INFO - Health check scheduler started
2026-03-18T14:21:58.647875648Z [inf] 2026-03-18 14:21:58,639 - src.api.services.self_healer - INFO - Self-healing service started
2026-03-18T14:21:58.647880694Z [inf] 2026-03-18 14:21:58,639 - src.api.services.self_healer - INFO - Registered recovery handler for restart
2026-03-18T14:21:58.647884563Z [inf] 2026-03-18 14:21:58,639 - src.api.services.self_healer - INFO - Registered recovery handler for rollback
2026-03-18T14:21:59.008429738Z [inf] 2026-03-18 14:21:58,815 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:21:59.008437751Z [inf] 2026-03-18 14:21:58,833 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:21:59.008445155Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:21:59.008451903Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:21:59.008458703Z [inf] [parameters: (UUID('193c9fa6-28ea-41fc-91ce-82ff0772da50'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 21, 58, 639404, tzinfo=datetime.timezone.utc))]
2026-03-18T14:21:59.008465749Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:22:18.709962177Z [inf] 2026-03-18 14:22:08,967 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:18.709966188Z [inf] 2026-03-18 14:22:08,985 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:18.709969952Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:18.709974339Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:18.709978285Z [inf] [parameters: (UUID('2f6b448b-1a6f-49a8-bc66-7a3b079ae4ba'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 22, 8, 833512, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:18.709983114Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:22:19.205597125Z [inf] 2026-03-18 14:22:19,114 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:19.205604013Z [inf] 2026-03-18 14:22:19,133 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:19.205610647Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:19.205616819Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:19.205624665Z [inf] [parameters: (UUID('34cb9d65-0e82-4382-bae3-f2e9d9fe229e'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 22, 18, 987246, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:19.205631595Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:22:38.867970214Z [inf] 2026-03-18 14:22:29,272 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:38.867978904Z [inf] 2026-03-18 14:22:29,291 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:38.867985046Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:38.867990159Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:38.867994894Z [inf] [parameters: (UUID('1ae76a28-8e25-4ad0-a835-721ae8df130a'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 22, 29, 134379, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:38.867999427Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:22:39.425850201Z [inf] 2026-03-18 14:22:39,420 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:39.438257407Z [inf] 2026-03-18 14:22:39,435 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:39.438262717Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:39.438268823Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:39.438272983Z [inf] [parameters: (UUID('e20b1faf-c437-4297-a1c1-9d75631da225'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 22, 39, 292243, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:39.438278275Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:22:59.440850684Z [inf] 2026-03-18 14:22:49,566 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:59.440855242Z [inf] 2026-03-18 14:22:49,582 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:59.440860506Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:59.440866982Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:59.440871398Z [inf] [parameters: (UUID('a2b7d3a3-ba75-4fc7-a835-23fc670d90bf'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 22, 49, 436567, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:59.440875823Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:22:59.707160120Z [inf] 2026-03-18 14:22:59,706 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:59.733508340Z [inf] 2026-03-18 14:22:59,723 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:59.733511825Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:59.733515164Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:59.733518756Z [inf] [parameters: (UUID('e2fd175a-c3af-49f1-a19d-2e016f0c0308'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 22, 59, 582728, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:59.733522747Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:23:19.736743921Z [inf] 2026-03-18 14:23:09,843 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:23:19.736750006Z [inf] 2026-03-18 14:23:09,860 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:23:19.736753873Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:23:19.736757692Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:23:19.736761290Z [inf] [parameters: (UUID('3e583acc-6bb4-46eb-be3a-317444d73b6e'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 23, 9, 723803, tzinfo=datetime.timezone.utc))]
2026-03-18T14:23:19.736764883Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:23:19.985818572Z [inf] 2026-03-18 14:23:19,980 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:23:20.002627016Z [inf] 2026-03-18 14:23:19,996 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:23:20.002633861Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:23:20.002640032Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:23:20.002646173Z [inf] [parameters: (UUID('e0d5def4-c391-4302-8a7d-76d97bbe8c99'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 23, 19, 861569, tzinfo=datetime.timezone.utc))]
2026-03-18T14:23:20.002652306Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:23:40.014576448Z [inf] 2026-03-18 14:23:30,115 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:23:40.014581701Z [inf] 2026-03-18 14:23:30,130 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:23:40.014589933Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:23:40.014595420Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:23:40.014600405Z [inf] [parameters: (UUID('60412b47-e088-4b3e-8bbf-3a591c5bccf2'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 23, 29, 997335, tzinfo=datetime.timezone.utc))]
2026-03-18T14:23:40.014604662Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:23:40.430177034Z [inf] 2026-03-18 14:23:40,265 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:23:40.430183746Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:23:40.430189630Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:23:40.430194665Z [inf] [parameters: (UUID('fc791d07-ac8a-42e1-9ac7-d15411e7ccfd'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 23, 40, 131645, tzinfo=datetime.timezone.utc))]
2026-03-18T14:23:40.430199892Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:23:40.430284862Z [inf] 2026-03-18 14:23:40,252 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:00.157565671Z [inf] 2026-03-18 14:23:50,404 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:00.157573890Z [inf] 2026-03-18 14:23:50,425 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:24:00.157579184Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:24:00.157584446Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:24:00.157589488Z [inf] [parameters: (UUID('9f65267a-ad5b-485f-a374-f2efa59e37cb'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 23, 50, 267470, tzinfo=datetime.timezone.utc))]
2026-03-18T14:24:00.157596302Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:24:00.572777052Z [inf] 2026-03-18 14:24:00,553 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:00.580703808Z [inf] 2026-03-18 14:24:00,575 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:24:00.580710339Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:24:00.580714983Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:24:00.580719613Z [inf] [parameters: (UUID('0fc4e393-5eac-4a80-bf25-fb78221e43e7'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 24, 0, 424886, tzinfo=datetime.timezone.utc))]
2026-03-18T14:24:00.580733681Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:24:20.606456814Z [inf] [parameters: (UUID('0dc304b6-194d-40a5-8141-edf1ebb0bc59'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 24, 10, 576068, tzinfo=datetime.timezone.utc))]
2026-03-18T14:24:20.606467880Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:24:20.606484214Z [inf] 2026-03-18 14:24:10,728 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:24:20.606492548Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:24:20.606499252Z [inf] 2026-03-18 14:24:10,707 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:20.606502916Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:24:20.857924156Z [inf] 2026-03-18 14:24:20,857 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:20.875277172Z [inf] 2026-03-18 14:24:20,872 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:24:20.875282294Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:24:20.875287115Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:24:20.875294676Z [inf] [parameters: (UUID('12a73175-abcf-430a-ab99-8ede6bddf6bb'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 24, 20, 728467, tzinfo=datetime.timezone.utc))]
2026-03-18T14:24:20.875300476Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:24:40.887791994Z [inf] 2026-03-18 14:24:31,011 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:40.887796027Z [inf] 2026-03-18 14:24:31,030 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:24:40.887799545Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:24:40.887804034Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:24:40.887807591Z [inf] [parameters: (UUID('dc2e25c7-dbae-457c-85fb-7284a79f6ad7'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 24, 30, 873197, tzinfo=datetime.timezone.utc))]
2026-03-18T14:24:40.887811214Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:24:41.162024031Z [inf] 2026-03-18 14:24:41,160 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:41.176635221Z [inf] 2026-03-18 14:24:41,175 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:24:41.176641255Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:24:41.176644725Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:24:41.176648680Z [inf] [parameters: (UUID('01d4b0f8-57d7-413d-a8f7-7afa3fc99842'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 24, 41, 31748, tzinfo=datetime.timezone.utc))]
2026-03-18T14:24:41.176652422Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:25:01.180459418Z [inf] 2026-03-18 14:24:51,304 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:25:01.180467244Z [inf] 2026-03-18 14:24:51,321 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:25:01.180472823Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:25:01.180478353Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:25:01.180483182Z [inf] [parameters: (UUID('044e5d76-d02b-4d14-b080-f0a56301b73c'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 24, 51, 175539, tzinfo=datetime.timezone.utc))]
2026-03-18T14:25:01.180487888Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:25:01.771946949Z [inf] 2026-03-18 14:25:01,447 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:25:01.771953608Z [inf] 2026-03-18 14:25:01,462 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:25:01.771961468Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:25:01.771969954Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:25:01.771977797Z [inf] [parameters: (UUID('34704bbc-1db9-4dcf-8754-23c93a4a59c5'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 25, 1, 321327, tzinfo=datetime.timezone.utc))]
2026-03-18T14:25:01.771984486Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:25:19.421851748Z [inf] Stopping Container
user: Continue where you left off. The previous model attempt failed or timed out.
user: System: [2026-03-18 15:13:29 GMT+1] Exec completed (fast-can, code 0) :: ==> Summary 🍺 /opt/homebrew/Cellar/postgresql@17/17.9: 3,824 files, 75.7MB ==> Running `brew cleanup postgresql@17`... Disable this behaviour by setting `HOMEBREW_NO_INSTALL_CLEA…
System: [2026-03-18 15:17:31 GMT+1] Exec completed (fresh-fj, code 0) :: Recent Deployments 81ea0adf-9c24-456b-aa87-ee652bd56cde | BUILDING | 2026-03-18 15:16:21 +01:00 07264905-52d7-495c-9616-977f0a4213d9 | SUCCESS | 2026-03-18 15:08:06 +01:00 15e045f…
System: [2026-03-18 15:18:39 GMT+1] Exec completed (marine-c, code 0) :: Recent Deployments 81ea0adf-9c24-456b-aa87-ee652bd56cde | SUCCESS | 2026-03-18 15:16:21 +01:00 07264905-52d7-495c-9616-977f0a4213d9 | REMOVED | 2026-03-18 15:08:06 +01:00 15e045ff…
System: [2026-03-18 15:22:24 GMT+1] Exec completed (briny-fo, code 0) :: Recent Deployments 2df21cd7-5c68-4018-853f-a528e84b2529 | SUCCESS | 2026-03-18 15:20:34 +01:00 81ea0adf-9c24-456b-aa87-ee652bd56cde | REMOVED | 2026-03-18 15:16:21 +01:00 07264905…

Sender (untrusted metadata):
```json
{
  "label": "openclaw-control-ui",
  "id": "openclaw-control-ui"
}
```

[Wed 2026-03-18 15:26 GMT+1] 2026-03-18T14:20:43.351676235Z [inf] 2026-03-18 14:20:33,787 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:20:43.351681566Z [inf] 2026-03-18 14:20:33,804 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:20:43.351686218Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:20:43.351690763Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:20:43.351695192Z [inf] [parameters: (UUID('2cdb7c12-f612-4c7e-8a6e-822a47a89691'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 20, 33, 655867, tzinfo=datetime.timezone.utc))]
2026-03-18T14:20:43.351699997Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:20:43.939422066Z [inf] 2026-03-18 14:20:43,937 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:20:43.954688766Z [inf] 2026-03-18 14:20:43,952 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:20:43.954693813Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:20:43.954699238Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:20:43.954704517Z [inf] [parameters: (UUID('687ad786-f5db-46ec-b2e7-a147fc6259a8'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 20, 43, 805553, tzinfo=datetime.timezone.utc))]
2026-03-18T14:20:43.954709078Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:20:53.550274681Z [err] 2026-03-18 14:20:43.925 UTC [54247] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:20:53.550286790Z [err] 2026-03-18 14:20:43.925 UTC [54247] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:20:54.081708852Z [err] 2026-03-18 14:20:54.079 UTC [54248] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:20:54.081712961Z [err] 2026-03-18 14:20:54.079 UTC [54248] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:21:03.951472616Z [inf] 2026-03-18 14:20:54,084 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:21:03.951532777Z [inf] 2026-03-18 14:20:54,110 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:21:03.951540369Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:21:03.951546883Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:21:03.951551735Z [inf] [parameters: (UUID('ffa64427-bea7-453b-ab04-cf3dac87283f'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 20, 53, 953234, tzinfo=datetime.timezone.utc))]
2026-03-18T14:21:03.951557711Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:21:04.247872821Z [inf] 2026-03-18 14:21:04,244 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:21:04.268569547Z [inf] 2026-03-18 14:21:04,262 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:21:04.268575177Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:21:04.268580473Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:21:04.268586089Z [inf] [parameters: (UUID('44194c32-26b9-4b9a-8a97-602ba2ccc1f6'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 21, 4, 112357, tzinfo=datetime.timezone.utc))]
2026-03-18T14:21:04.268591817Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:21:14.080569871Z [err] 2026-03-18 14:21:04.234 UTC [54249] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:21:14.080573971Z [err] 2026-03-18 14:21:04.234 UTC [54249] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:21:14.397409032Z [err] 2026-03-18 14:21:14.391 UTC [54250] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:21:14.397416002Z [err] 2026-03-18 14:21:14.391 UTC [54250] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:21:24.266195783Z [inf] 2026-03-18 14:21:14,400 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:21:24.266205146Z [inf] 2026-03-18 14:21:14,419 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:21:24.266211258Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:21:24.266216519Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:21:24.266221450Z [inf] [parameters: (UUID('23133f01-3b06-4086-a9a0-f45e1e389cbf'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 21, 14, 262012, tzinfo=datetime.timezone.utc))]
2026-03-18T14:21:24.266226919Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:21:24.859121124Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:21:24.859214049Z [inf] 2026-03-18 14:21:24,550 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:21:24.859218594Z [inf] 2026-03-18 14:21:24,565 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:21:24.859222880Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:21:24.859227557Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:21:24.859231914Z [inf] [parameters: (UUID('c9619176-e6a0-44fd-8eb9-107c9f5874ad'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 21, 24, 421437, tzinfo=datetime.timezone.utc))]
2026-03-18T14:21:34.397898743Z [err] 2026-03-18 14:21:24.538 UTC [54251] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:21:34.397902883Z [err] 2026-03-18 14:21:24.538 UTC [54251] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:21:34.969592983Z [err] 2026-03-18 14:21:34.685 UTC [54252] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:21:34.969596263Z [err] 2026-03-18 14:21:34.685 UTC [54252] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:21:44.529724806Z [inf] 2026-03-18 14:21:34,696 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:21:44.529734346Z [inf] 2026-03-18 14:21:34,712 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:21:44.529741213Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:21:44.529750232Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:21:44.529757249Z [inf] [parameters: (UUID('a1f1a335-9ec3-40ed-aaa5-f0157968b401'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 21, 34, 566939, tzinfo=datetime.timezone.utc))]
2026-03-18T14:21:44.529763635Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:21:44.923315073Z [inf] 2026-03-18 14:21:44,842 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:21:44.923320968Z [inf] 2026-03-18 14:21:44,858 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:21:44.923326648Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:21:44.923332476Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:21:44.923337459Z [inf] [parameters: (UUID('565edd89-b6b8-4832-8b52-d1a3c3cba7b8'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 21, 44, 713521, tzinfo=datetime.timezone.utc))]
2026-03-18T14:21:44.923342005Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:21:54.680698371Z [err] 2026-03-18 14:21:44.830 UTC [54254] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:21:54.680701961Z [err] 2026-03-18 14:21:44.830 UTC [54254] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:21:55.137540060Z [err] 2026-03-18 14:21:54.970 UTC [54255] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:21:55.137544230Z [err] 2026-03-18 14:21:54.970 UTC [54255] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:21:55.445344065Z [inf] Starting Container
2026-03-18T14:21:57.973187229Z [inf] 2026-03-18 14:21:57,501 - src.api.middleware.rate_limit - INFO - Rate limiting enabled: 100 requests per 60 seconds
2026-03-18T14:21:57.973196142Z [err] INFO: Started server process [1]
2026-03-18T14:21:57.973203909Z [err] INFO: Waiting for application startup.
2026-03-18T14:21:57.973210805Z [inf] 2026-03-18 14:21:57,635 - src.api.main - INFO - Starting up API...
2026-03-18T14:21:57.973219302Z [inf] 2026-03-18 14:21:57,636 - src.api.main - INFO - Environment variable validation completed
2026-03-18T14:21:57.973225564Z [inf] 2026-03-18 14:21:57,636 - src.api.main - INFO - Running in development mode
2026-03-18T14:21:57.973231618Z [inf] 2026-03-18 14:21:57,636 - src.api.main - INFO - Database initialization running in background
2026-03-18T14:21:57.973250404Z [err] INFO: Application startup complete.
2026-03-18T14:21:57.973256560Z [err] INFO: Uvicorn running on http://0.0.0.0:8080 (Press CTRL+C to quit)
2026-03-18T14:21:57.973261867Z [inf] 2026-03-18 14:21:57,925 - src.api.main - INFO - Database initialized
2026-03-18T14:21:58.647859225Z [inf] 2026-03-18 14:21:58,638 - src.api.main - INFO - Database ready; starting background monitor
2026-03-18T14:21:58.647863596Z [inf] 2026-03-18 14:21:58,639 - src.api.services.monitor - INFO - Starting background agent monitor...
2026-03-18T14:21:58.647869828Z [inf] 2026-03-18 14:21:58,639 - src.api.services.self_healer - INFO - Health check scheduler started
2026-03-18T14:21:58.647875648Z [inf] 2026-03-18 14:21:58,639 - src.api.services.self_healer - INFO - Self-healing service started
2026-03-18T14:21:58.647880694Z [inf] 2026-03-18 14:21:58,639 - src.api.services.self_healer - INFO - Registered recovery handler for restart
2026-03-18T14:21:58.647884563Z [inf] 2026-03-18 14:21:58,639 - src.api.services.self_healer - INFO - Registered recovery handler for rollback
2026-03-18T14:21:59.008429738Z [inf] 2026-03-18 14:21:58,815 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:21:59.008437751Z [inf] 2026-03-18 14:21:58,833 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:21:59.008445155Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:21:59.008451903Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:21:59.008458703Z [inf] [parameters: (UUID('193c9fa6-28ea-41fc-91ce-82ff0772da50'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 21, 58, 639404, tzinfo=datetime.timezone.utc))]
2026-03-18T14:21:59.008465749Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:21:59.149983317Z [err] 2026-03-18 14:21:58.804 UTC [54257] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:21:59.149986457Z [err] 2026-03-18 14:21:58.804 UTC [54257] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:22:04.966446886Z [inf] 2026-03-18 14:22:04,053 - src.api.services.self_healer - INFO - Self-healing service stopped
2026-03-18T14:22:04.966461267Z [err] INFO: Application shutdown complete.
2026-03-18T14:22:04.966474418Z [err] INFO: Finished server process [1]
2026-03-18T14:22:04.966547563Z [inf] 2026-03-18 14:21:54,981 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:04.966555176Z [inf] 2026-03-18 14:21:54,999 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:04.966561562Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:04.966565965Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:04.966570010Z [inf] [parameters: (UUID('b1ab2623-9b0e-47f8-86f8-5b9a0491ce47'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 21, 54, 859731, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:04.966573850Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:22:04.966577581Z [err] INFO: Shutting down
2026-03-18T14:22:04.966581059Z [err] INFO: Waiting for application shutdown.
2026-03-18T14:22:04.966585302Z [inf] 2026-03-18 14:22:04,053 - src.api.services.monitor - INFO - Background agent monitor cancellation requested
2026-03-18T14:22:04.966590256Z [inf] 2026-03-18 14:22:04,053 - src.api.services.self_healer - INFO - Health check scheduler stopped
2026-03-18T14:22:05.387941360Z [inf] Stopping Container
2026-03-18T14:22:18.709962177Z [inf] 2026-03-18 14:22:08,967 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:18.709966188Z [inf] 2026-03-18 14:22:08,985 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:18.709969952Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:18.709974339Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:18.709978285Z [inf] [parameters: (UUID('2f6b448b-1a6f-49a8-bc66-7a3b079ae4ba'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 22, 8, 833512, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:18.709983114Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:22:18.814792702Z [err] 2026-03-18 14:22:08.956 UTC [54258] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:22:18.814795641Z [err] 2026-03-18 14:22:08.956 UTC [54258] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:22:19.143633475Z [err] 2026-03-18 14:22:19.105 UTC [54259] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:22:19.143636245Z [err] 2026-03-18 14:22:19.105 UTC [54259] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:22:19.205597125Z [inf] 2026-03-18 14:22:19,114 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:19.205604013Z [inf] 2026-03-18 14:22:19,133 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:19.205610647Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:19.205616819Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:19.205624665Z [inf] [parameters: (UUID('34cb9d65-0e82-4382-bae3-f2e9d9fe229e'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 22, 18, 987246, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:19.205631595Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:22:38.857410936Z [err] 2026-03-18 14:22:29.262 UTC [54260] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:22:38.857414826Z [err] 2026-03-18 14:22:29.262 UTC [54260] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:22:38.867970214Z [inf] 2026-03-18 14:22:29,272 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:38.867978904Z [inf] 2026-03-18 14:22:29,291 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:38.867985046Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:38.867990159Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:38.867994894Z [inf] [parameters: (UUID('1ae76a28-8e25-4ad0-a835-721ae8df130a'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 22, 29, 134379, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:38.867999427Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:22:39.409808468Z [err] 2026-03-18 14:22:39.408 UTC [54261] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:22:39.409813198Z [err] 2026-03-18 14:22:39.408 UTC [54261] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:22:39.425850201Z [inf] 2026-03-18 14:22:39,420 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:39.438257407Z [inf] 2026-03-18 14:22:39,435 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:39.438262717Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:39.438268823Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:39.438272983Z [inf] [parameters: (UUID('e20b1faf-c437-4297-a1c1-9d75631da225'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 22, 39, 292243, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:39.438278275Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:22:59.440850684Z [inf] 2026-03-18 14:22:49,566 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:59.440855242Z [inf] 2026-03-18 14:22:49,582 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:59.440860506Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:59.440866982Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:59.440871398Z [inf] [parameters: (UUID('a2b7d3a3-ba75-4fc7-a835-23fc670d90bf'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 22, 49, 436567, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:59.440875823Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:22:59.699771521Z [err] 2026-03-18 14:22:59.695 UTC [54264] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:22:59.699776591Z [err] 2026-03-18 14:22:59.695 UTC [54264] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:22:59.707160120Z [inf] 2026-03-18 14:22:59,706 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:59.733508340Z [inf] 2026-03-18 14:22:59,723 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:59.733511825Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:59.733515164Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:59.733518756Z [inf] [parameters: (UUID('e2fd175a-c3af-49f1-a19d-2e016f0c0308'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 22, 59, 582728, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:59.733522747Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:23:19.698742285Z [err] 2026-03-18 14:23:09.831 UTC [54265] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:23:19.698748704Z [err] 2026-03-18 14:23:09.831 UTC [54265] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:23:19.736743921Z [inf] 2026-03-18 14:23:09,843 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:23:19.736750006Z [inf] 2026-03-18 14:23:09,860 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:23:19.736753873Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:23:19.736757692Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:23:19.736761290Z [inf] [parameters: (UUID('3e583acc-6bb4-46eb-be3a-317444d73b6e'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 23, 9, 723803, tzinfo=datetime.timezone.utc))]
2026-03-18T14:23:19.736764883Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:23:19.985818572Z [inf] 2026-03-18 14:23:19,980 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:23:20.002627016Z [inf] 2026-03-18 14:23:19,996 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:23:20.002633861Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:23:20.002640032Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:23:20.002646173Z [inf] [parameters: (UUID('e0d5def4-c391-4302-8a7d-76d97bbe8c99'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 23, 19, 861569, tzinfo=datetime.timezone.utc))]
2026-03-18T14:23:20.002652306Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:23:20.354844729Z [err] 2026-03-18 14:23:19.968 UTC [54266] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:23:20.354850979Z [err] 2026-03-18 14:23:19.968 UTC [54266] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:23:30.343348431Z [err] 2026-03-18 14:23:30.103 UTC [54267] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:23:30.343354951Z [err] 2026-03-18 14:23:30.103 UTC [54267] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:23:40.014576448Z [inf] 2026-03-18 14:23:30,115 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:23:40.014581701Z [inf] 2026-03-18 14:23:30,130 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:23:40.014589933Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:23:40.014595420Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:23:40.014600405Z [inf] [parameters: (UUID('60412b47-e088-4b3e-8bbf-3a591c5bccf2'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 23, 29, 997335, tzinfo=datetime.timezone.utc))]
2026-03-18T14:23:40.014604662Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:23:40.430177034Z [inf] 2026-03-18 14:23:40,265 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:23:40.430183746Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:23:40.430189630Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:23:40.430194665Z [inf] [parameters: (UUID('fc791d07-ac8a-42e1-9ac7-d15411e7ccfd'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 23, 40, 131645, tzinfo=datetime.timezone.utc))]
2026-03-18T14:23:40.430199892Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:23:40.430284862Z [inf] 2026-03-18 14:23:40,252 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:23:50.396682591Z [err] 2026-03-18 14:23:50.393 UTC [54270] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:23:50.396688001Z [err] 2026-03-18 14:23:50.393 UTC [54270] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:24:00.157565671Z [inf] 2026-03-18 14:23:50,404 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:00.157573890Z [inf] 2026-03-18 14:23:50,425 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:24:00.157579184Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:24:00.157584446Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:24:00.157589488Z [inf] [parameters: (UUID('9f65267a-ad5b-485f-a374-f2efa59e37cb'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 23, 50, 267470, tzinfo=datetime.timezone.utc))]
2026-03-18T14:24:00.157596302Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:24:00.572777052Z [inf] 2026-03-18 14:24:00,553 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:00.580703808Z [inf] 2026-03-18 14:24:00,575 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:24:00.580710339Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:24:00.580714983Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:24:00.580719613Z [inf] [parameters: (UUID('0fc4e393-5eac-4a80-bf25-fb78221e43e7'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 24, 0, 424886, tzinfo=datetime.timezone.utc))]
2026-03-18T14:24:00.580733681Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:24:10.031067600Z [err] 2026-03-18 14:24:00.541 UTC [54271] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:24:10.031070100Z [err] 2026-03-18 14:24:00.541 UTC [54271] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:24:10.719957821Z [err] 2026-03-18 14:24:10.696 UTC [54272] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:24:10.719967051Z [err] 2026-03-18 14:24:10.696 UTC [54272] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:24:20.606456814Z [inf] [parameters: (UUID('0dc304b6-194d-40a5-8141-edf1ebb0bc59'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 24, 10, 576068, tzinfo=datetime.timezone.utc))]
2026-03-18T14:24:20.606467880Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:24:20.606484214Z [inf] 2026-03-18 14:24:10,728 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:24:20.606492548Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:24:20.606499252Z [inf] 2026-03-18 14:24:10,707 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:20.606502916Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:24:20.857924156Z [inf] 2026-03-18 14:24:20,857 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:20.875277172Z [inf] 2026-03-18 14:24:20,872 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:24:20.875282294Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:24:20.875287115Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:24:20.875294676Z [inf] [parameters: (UUID('12a73175-abcf-430a-ab99-8ede6bddf6bb'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 24, 20, 728467, tzinfo=datetime.timezone.utc))]
2026-03-18T14:24:20.875300476Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:24:30.702041109Z [err] 2026-03-18 14:24:20.845 UTC [54273] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:24:30.702048388Z [err] 2026-03-18 14:24:20.845 UTC [54273] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:24:31.006561396Z [err] 2026-03-18 14:24:31.002 UTC [54274] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:24:31.006567076Z [err] 2026-03-18 14:24:31.002 UTC [54274] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:24:40.887791994Z [inf] 2026-03-18 14:24:31,011 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:40.887796027Z [inf] 2026-03-18 14:24:31,030 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:24:40.887799545Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:24:40.887804034Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:24:40.887807591Z [inf] [parameters: (UUID('dc2e25c7-dbae-457c-85fb-7284a79f6ad7'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 24, 30, 873197, tzinfo=datetime.timezone.utc))]
2026-03-18T14:24:40.887811214Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:24:41.162024031Z [inf] 2026-03-18 14:24:41,160 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:41.176635221Z [inf] 2026-03-18 14:24:41,175 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:24:41.176641255Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:24:41.176644725Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:24:41.176648680Z [inf] [parameters: (UUID('01d4b0f8-57d7-413d-a8f7-7afa3fc99842'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 24, 41, 31748, tzinfo=datetime.timezone.utc))]
2026-03-18T14:24:41.176652422Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:24:51.006723698Z [err] 2026-03-18 14:24:41.147 UTC [54276] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:24:51.006729828Z [err] 2026-03-18 14:24:41.147 UTC [54276] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:24:51.559502221Z [err] 2026-03-18 14:24:51.292 UTC [54277] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:24:51.559507280Z [err] 2026-03-18 14:24:51.292 UTC [54277] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:25:01.180459418Z [inf] 2026-03-18 14:24:51,304 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:25:01.180467244Z [inf] 2026-03-18 14:24:51,321 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:25:01.180472823Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:25:01.180478353Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:25:01.180483182Z [inf] [parameters: (UUID('044e5d76-d02b-4d14-b080-f0a56301b73c'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 24, 51, 175539, tzinfo=datetime.timezone.utc))]
2026-03-18T14:25:01.180487888Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:25:01.771946949Z [inf] 2026-03-18 14:25:01,447 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:25:01.771953608Z [inf] 2026-03-18 14:25:01,462 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:25:01.771961468Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:25:01.771969954Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:25:01.771977797Z [inf] [parameters: (UUID('34704bbc-1db9-4dcf-8754-23c93a4a59c5'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 25, 1, 321327, tzinfo=datetime.timezone.utc))]
2026-03-18T14:25:01.771984486Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:25:10.916749804Z [inf] Starting Container
2026-03-18T14:25:11.193287543Z [err] 2026-03-18 14:25:01.434 UTC [54278] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:25:11.193363981Z [err] 2026-03-18 14:25:01.434 UTC [54278] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:25:11.623222324Z [err] 2026-03-18 14:25:11.577 UTC [54279] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:25:11.623227294Z [err] 2026-03-18 14:25:11.577 UTC [54279] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:25:13.358611759Z [err] INFO: Started server process [1]
2026-03-18T14:25:13.358615245Z [inf] 2026-03-18 14:25:13,090 - src.api.main - INFO - Database initialized
2026-03-18T14:25:13.358622624Z [err] INFO: Waiting for application startup.
2026-03-18T14:25:13.358630770Z [inf] 2026-03-18 14:25:12,524 - src.api.main - INFO - Starting up API...
2026-03-18T14:25:13.358639133Z [inf] 2026-03-18 14:25:12,525 - src.api.main - INFO - Environment variable validation completed
2026-03-18T14:25:13.358647089Z [inf] 2026-03-18 14:25:12,525 - src.api.main - INFO - Running in development mode
2026-03-18T14:25:13.358653999Z [inf] 2026-03-18 14:25:12,525 - src.api.main - INFO - Database initialization running in background
2026-03-18T14:25:13.358661044Z [err] INFO: Application startup complete.
2026-03-18T14:25:13.358669947Z [err] INFO: Uvicorn running on http://0.0.0.0:8080 (Press CTRL+C to quit)
2026-03-18T14:25:13.358701249Z [inf] 2026-03-18 14:25:12,369 - src.api.middleware.rate_limit - INFO - Rate limiting enabled: 100 requests per 60 seconds
2026-03-18T14:25:13.530866974Z [inf] 2026-03-18 14:25:13,528 - src.api.main - INFO - Database ready; starting background monitor
2026-03-18T14:25:13.530873695Z [inf] 2026-03-18 14:25:13,528 - src.api.services.monitor - INFO - Starting background agent monitor...
2026-03-18T14:25:13.530878388Z [inf] 2026-03-18 14:25:13,528 - src.api.services.self_healer - INFO - Health check scheduler started
2026-03-18T14:25:13.530883113Z [inf] 2026-03-18 14:25:13,528 - src.api.services.self_healer - INFO - Self-healing service started
2026-03-18T14:25:13.530887732Z [inf] 2026-03-18 14:25:13,528 - src.api.services.self_healer - INFO - Registered recovery handler for restart
2026-03-18T14:25:13.530891851Z [inf] 2026-03-18 14:25:13,528 - src.api.services.self_healer - INFO - Registered recovery handler for rollback
2026-03-18T14:25:13.755833206Z [inf] 2026-03-18 14:25:13,753 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:25:13.793813065Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:25:13.793822399Z [inf] [parameters: (UUID('fe196b05-faf8-49c1-b5c7-0089f456c694'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 25, 13, 529025, tzinfo=datetime.timezone.utc))]
2026-03-18T14:25:13.793828332Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:25:13.793984687Z [inf] 2026-03-18 14:25:13,791 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:25:13.793990321Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:25:19.421851748Z [inf] Stopping Container
2026-03-18T14:25:21.483214131Z [inf] 2026-03-18 14:25:11,589 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:25:21.483229925Z [inf] 2026-03-18 14:25:11,607 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:25:21.483239854Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:25:21.483246373Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:25:21.483251724Z [inf] [parameters: (UUID('7db49892-bcd4-4746-948d-bbe754e1bf3e'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 25, 11, 462942, tzinfo=datetime.timezone.utc))]
2026-03-18T14:25:21.483258109Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:25:21.483269014Z [err] INFO: Shutting down
2026-03-18T14:25:21.483274791Z [err] INFO: Waiting for application shutdown.
2026-03-18T14:25:21.483284262Z [inf] 2026-03-18 14:25:18,723 - src.api.services.monitor - INFO - Background agent monitor cancellation requested
2026-03-18T14:25:21.483290575Z [inf] 2026-03-18 14:25:18,723 - src.api.services.self_healer - INFO - Health check scheduler stopped
2026-03-18T14:25:21.483297660Z [inf] 2026-03-18 14:25:18,723 - src.api.services.self_healer - INFO - Self-healing service stopped
2026-03-18T14:25:21.483302500Z [err] INFO: Application shutdown complete.
2026-03-18T14:25:21.483308471Z [err] INFO: Finished server process [1]
2026-03-18T14:25:33.761291509Z [err] 2026-03-18 14:25:23.966 UTC [54282] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:25:33.761295569Z [err] 2026-03-18 14:25:23.966 UTC [54282] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:25:33.780527614Z [inf] [parameters: (UUID('d161631e-2c57-4d08-98e2-653fb9a97f83'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 25, 23, 792011, tzinfo=datetime.timezone.utc))]
2026-03-18T14:25:33.780540648Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:25:33.780627440Z [inf] 2026-03-18 14:25:23,972 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:25:33.780633817Z [inf] 2026-03-18 14:25:23,998 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:25:33.780647198Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:25:33.780654733Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:25:34.149271709Z [err] 2026-03-18 14:25:34.138 UTC [54283] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:25:34.149284248Z [err] 2026-03-18 14:25:34.138 UTC [54283] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:25:34.150612504Z [inf] 2026-03-18 14:25:34,142 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:25:34.177331606Z [inf] 2026-03-18 14:25:34,171 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:25:34.177339680Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:25:34.177346375Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:25:34.177351685Z [inf] [parameters: (UUID('41085f97-edbe-4ec1-be88-c367df80f96c'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 25, 33, 998843, tzinfo=datetime.timezone.utc))]
2026-03-18T14:25:34.177356676Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)



2026-03-18T14:21:55.445344065Z [inf] Starting Container
2026-03-18T14:21:57.973187229Z [inf] 2026-03-18 14:21:57,501 - src.api.middleware.rate_limit - INFO - Rate limiting enabled: 100 requests per 60 seconds
2026-03-18T14:21:57.973196142Z [err] INFO: Started server process [1]
2026-03-18T14:21:57.973203909Z [err] INFO: Waiting for application startup.
2026-03-18T14:21:57.973210805Z [inf] 2026-03-18 14:21:57,635 - src.api.main - INFO - Starting up API...
2026-03-18T14:21:57.973219302Z [inf] 2026-03-18 14:21:57,636 - src.api.main - INFO - Environment variable validation completed
2026-03-18T14:21:57.973225564Z [inf] 2026-03-18 14:21:57,636 - src.api.main - INFO - Running in development mode
2026-03-18T14:21:57.973231618Z [inf] 2026-03-18 14:21:57,636 - src.api.main - INFO - Database initialization running in background
2026-03-18T14:21:57.973250404Z [err] INFO: Application startup complete.
2026-03-18T14:21:57.973256560Z [err] INFO: Uvicorn running on http://0.0.0.0:8080 (Press CTRL+C to quit)
2026-03-18T14:21:57.973261867Z [inf] 2026-03-18 14:21:57,925 - src.api.main - INFO - Database initialized
2026-03-18T14:21:58.647859225Z [inf] 2026-03-18 14:21:58,638 - src.api.main - INFO - Database ready; starting background monitor
2026-03-18T14:21:58.647863596Z [inf] 2026-03-18 14:21:58,639 - src.api.services.monitor - INFO - Starting background agent monitor...
2026-03-18T14:21:58.647869828Z [inf] 2026-03-18 14:21:58,639 - src.api.services.self_healer - INFO - Health check scheduler started
2026-03-18T14:21:58.647875648Z [inf] 2026-03-18 14:21:58,639 - src.api.services.self_healer - INFO - Self-healing service started
2026-03-18T14:21:58.647880694Z [inf] 2026-03-18 14:21:58,639 - src.api.services.self_healer - INFO - Registered recovery handler for restart
2026-03-18T14:21:58.647884563Z [inf] 2026-03-18 14:21:58,639 - src.api.services.self_healer - INFO - Registered recovery handler for rollback
2026-03-18T14:21:59.008429738Z [inf] 2026-03-18 14:21:58,815 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:21:59.008437751Z [inf] 2026-03-18 14:21:58,833 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:21:59.008445155Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:21:59.008451903Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:21:59.008458703Z [inf] [parameters: (UUID('193c9fa6-28ea-41fc-91ce-82ff0772da50'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 21, 58, 639404, tzinfo=datetime.timezone.utc))]
2026-03-18T14:21:59.008465749Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:22:18.709962177Z [inf] 2026-03-18 14:22:08,967 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:18.709966188Z [inf] 2026-03-18 14:22:08,985 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:18.709969952Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:18.709974339Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:18.709978285Z [inf] [parameters: (UUID('2f6b448b-1a6f-49a8-bc66-7a3b079ae4ba'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 22, 8, 833512, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:18.709983114Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:22:19.205597125Z [inf] 2026-03-18 14:22:19,114 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:19.205604013Z [inf] 2026-03-18 14:22:19,133 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:19.205610647Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:19.205616819Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:19.205624665Z [inf] [parameters: (UUID('34cb9d65-0e82-4382-bae3-f2e9d9fe229e'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 22, 18, 987246, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:19.205631595Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:22:38.867970214Z [inf] 2026-03-18 14:22:29,272 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:38.867978904Z [inf] 2026-03-18 14:22:29,291 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:38.867985046Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:38.867990159Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:38.867994894Z [inf] [parameters: (UUID('1ae76a28-8e25-4ad0-a835-721ae8df130a'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 22, 29, 134379, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:38.867999427Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:22:39.425850201Z [inf] 2026-03-18 14:22:39,420 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:39.438257407Z [inf] 2026-03-18 14:22:39,435 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:39.438262717Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:39.438268823Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:39.438272983Z [inf] [parameters: (UUID('e20b1faf-c437-4297-a1c1-9d75631da225'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 22, 39, 292243, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:39.438278275Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:22:59.440850684Z [inf] 2026-03-18 14:22:49,566 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:59.440855242Z [inf] 2026-03-18 14:22:49,582 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:59.440860506Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:59.440866982Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:59.440871398Z [inf] [parameters: (UUID('a2b7d3a3-ba75-4fc7-a835-23fc670d90bf'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 22, 49, 436567, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:59.440875823Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:22:59.707160120Z [inf] 2026-03-18 14:22:59,706 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:59.733508340Z [inf] 2026-03-18 14:22:59,723 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:59.733511825Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:59.733515164Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:59.733518756Z [inf] [parameters: (UUID('e2fd175a-c3af-49f1-a19d-2e016f0c0308'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 22, 59, 582728, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:59.733522747Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:23:19.736743921Z [inf] 2026-03-18 14:23:09,843 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:23:19.736750006Z [inf] 2026-03-18 14:23:09,860 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:23:19.736753873Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:23:19.736757692Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:23:19.736761290Z [inf] [parameters: (UUID('3e583acc-6bb4-46eb-be3a-317444d73b6e'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 23, 9, 723803, tzinfo=datetime.timezone.utc))]
2026-03-18T14:23:19.736764883Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:23:19.985818572Z [inf] 2026-03-18 14:23:19,980 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:23:20.002627016Z [inf] 2026-03-18 14:23:19,996 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:23:20.002633861Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:23:20.002640032Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:23:20.002646173Z [inf] [parameters: (UUID('e0d5def4-c391-4302-8a7d-76d97bbe8c99'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 23, 19, 861569, tzinfo=datetime.timezone.utc))]
2026-03-18T14:23:20.002652306Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:23:40.014576448Z [inf] 2026-03-18 14:23:30,115 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:23:40.014581701Z [inf] 2026-03-18 14:23:30,130 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:23:40.014589933Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:23:40.014595420Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:23:40.014600405Z [inf] [parameters: (UUID('60412b47-e088-4b3e-8bbf-3a591c5bccf2'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 23, 29, 997335, tzinfo=datetime.timezone.utc))]
2026-03-18T14:23:40.014604662Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:23:40.430177034Z [inf] 2026-03-18 14:23:40,265 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:23:40.430183746Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:23:40.430189630Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:23:40.430194665Z [inf] [parameters: (UUID('fc791d07-ac8a-42e1-9ac7-d15411e7ccfd'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 23, 40, 131645, tzinfo=datetime.timezone.utc))]
2026-03-18T14:23:40.430199892Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:23:40.430284862Z [inf] 2026-03-18 14:23:40,252 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:00.157565671Z [inf] 2026-03-18 14:23:50,404 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:00.157573890Z [inf] 2026-03-18 14:23:50,425 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:24:00.157579184Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:24:00.157584446Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:24:00.157589488Z [inf] [parameters: (UUID('9f65267a-ad5b-485f-a374-f2efa59e37cb'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 23, 50, 267470, tzinfo=datetime.timezone.utc))]
2026-03-18T14:24:00.157596302Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:24:00.572777052Z [inf] 2026-03-18 14:24:00,553 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:00.580703808Z [inf] 2026-03-18 14:24:00,575 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:24:00.580710339Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:24:00.580714983Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:24:00.580719613Z [inf] [parameters: (UUID('0fc4e393-5eac-4a80-bf25-fb78221e43e7'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 24, 0, 424886, tzinfo=datetime.timezone.utc))]
2026-03-18T14:24:00.580733681Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:24:20.606456814Z [inf] [parameters: (UUID('0dc304b6-194d-40a5-8141-edf1ebb0bc59'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 24, 10, 576068, tzinfo=datetime.timezone.utc))]
2026-03-18T14:24:20.606467880Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:24:20.606484214Z [inf] 2026-03-18 14:24:10,728 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:24:20.606492548Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:24:20.606499252Z [inf] 2026-03-18 14:24:10,707 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:20.606502916Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:24:20.857924156Z [inf] 2026-03-18 14:24:20,857 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:20.875277172Z [inf] 2026-03-18 14:24:20,872 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:24:20.875282294Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:24:20.875287115Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:24:20.875294676Z [inf] [parameters: (UUID('12a73175-abcf-430a-ab99-8ede6bddf6bb'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 24, 20, 728467, tzinfo=datetime.timezone.utc))]
2026-03-18T14:24:20.875300476Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:24:40.887791994Z [inf] 2026-03-18 14:24:31,011 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:40.887796027Z [inf] 2026-03-18 14:24:31,030 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:24:40.887799545Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:24:40.887804034Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:24:40.887807591Z [inf] [parameters: (UUID('dc2e25c7-dbae-457c-85fb-7284a79f6ad7'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 24, 30, 873197, tzinfo=datetime.timezone.utc))]
2026-03-18T14:24:40.887811214Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:24:41.162024031Z [inf] 2026-03-18 14:24:41,160 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:41.176635221Z [inf] 2026-03-18 14:24:41,175 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:24:41.176641255Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:24:41.176644725Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:24:41.176648680Z [inf] [parameters: (UUID('01d4b0f8-57d7-413d-a8f7-7afa3fc99842'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 24, 41, 31748, tzinfo=datetime.timezone.utc))]
2026-03-18T14:24:41.176652422Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:25:01.180459418Z [inf] 2026-03-18 14:24:51,304 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:25:01.180467244Z [inf] 2026-03-18 14:24:51,321 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:25:01.180472823Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:25:01.180478353Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:25:01.180483182Z [inf] [parameters: (UUID('044e5d76-d02b-4d14-b080-f0a56301b73c'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 24, 51, 175539, tzinfo=datetime.timezone.utc))]
2026-03-18T14:25:01.180487888Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:25:01.771946949Z [inf] 2026-03-18 14:25:01,447 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:25:01.771953608Z [inf] 2026-03-18 14:25:01,462 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:25:01.771961468Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:25:01.771969954Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:25:01.771977797Z [inf] [parameters: (UUID('34704bbc-1db9-4dcf-8754-23c93a4a59c5'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 25, 1, 321327, tzinfo=datetime.timezone.utc))]
2026-03-18T14:25:01.771984486Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:25:19.421851748Z [inf] Stopping Container
user: Continue where you left off. The previous model attempt failed or timed out.
user: System: [2026-03-18 15:13:29 GMT+1] Exec completed (fast-can, code 0) :: ==> Summary 🍺 /opt/homebrew/Cellar/postgresql@17/17.9: 3,824 files, 75.7MB ==> Running `brew cleanup postgresql@17`... Disable this behaviour by setting `HOMEBREW_NO_INSTALL_CLEA…
System: [2026-03-18 15:17:31 GMT+1] Exec completed (fresh-fj, code 0) :: Recent Deployments 81ea0adf-9c24-456b-aa87-ee652bd56cde | BUILDING | 2026-03-18 15:16:21 +01:00 07264905-52d7-495c-9616-977f0a4213d9 | SUCCESS | 2026-03-18 15:08:06 +01:00 15e045f…
System: [2026-03-18 15:18:39 GMT+1] Exec completed (marine-c, code 0) :: Recent Deployments 81ea0adf-9c24-456b-aa87-ee652bd56cde | SUCCESS | 2026-03-18 15:16:21 +01:00 07264905-52d7-495c-9616-977f0a4213d9 | REMOVED | 2026-03-18 15:08:06 +01:00 15e045ff…
System: [2026-03-18 15:22:24 GMT+1] Exec completed (briny-fo, code 0) :: Recent Deployments 2df21cd7-5c68-4018-853f-a528e84b2529 | SUCCESS | 2026-03-18 15:20:34 +01:00 81ea0adf-9c24-456b-aa87-ee652bd56cde | REMOVED | 2026-03-18 15:16:21 +01:00 07264905…

Sender (untrusted metadata):
```json
{
  "label": "openclaw-control-ui",
  "id": "openclaw-control-ui"
}
```

[Wed 2026-03-18 15:26 GMT+1] 2026-03-18T14:20:43.351676235Z [inf] 2026-03-18 14:20:33,787 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:20:43.351681566Z [inf] 2026-03-18 14:20:33,804 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:20:43.351686218Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:20:43.351690763Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:20:43.351695192Z [inf] [parameters: (UUID('2cdb7c12-f612-4c7e-8a6e-822a47a89691'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 20, 33, 655867, tzinfo=datetime.timezone.utc))]
2026-03-18T14:20:43.351699997Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:20:43.939422066Z [inf] 2026-03-18 14:20:43,937 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:20:43.954688766Z [inf] 2026-03-18 14:20:43,952 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:20:43.954693813Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:20:43.954699238Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:20:43.954704517Z [inf] [parameters: (UUID('687ad786-f5db-46ec-b2e7-a147fc6259a8'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 20, 43, 805553, tzinfo=datetime.timezone.utc))]
2026-03-18T14:20:43.954709078Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:20:53.550274681Z [err] 2026-03-18 14:20:43.925 UTC [54247] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:20:53.550286790Z [err] 2026-03-18 14:20:43.925 UTC [54247] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:20:54.081708852Z [err] 2026-03-18 14:20:54.079 UTC [54248] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:20:54.081712961Z [err] 2026-03-18 14:20:54.079 UTC [54248] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:21:03.951472616Z [inf] 2026-03-18 14:20:54,084 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:21:03.951532777Z [inf] 2026-03-18 14:20:54,110 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:21:03.951540369Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:21:03.951546883Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:21:03.951551735Z [inf] [parameters: (UUID('ffa64427-bea7-453b-ab04-cf3dac87283f'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 20, 53, 953234, tzinfo=datetime.timezone.utc))]
2026-03-18T14:21:03.951557711Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:21:04.247872821Z [inf] 2026-03-18 14:21:04,244 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:21:04.268569547Z [inf] 2026-03-18 14:21:04,262 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:21:04.268575177Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:21:04.268580473Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:21:04.268586089Z [inf] [parameters: (UUID('44194c32-26b9-4b9a-8a97-602ba2ccc1f6'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 21, 4, 112357, tzinfo=datetime.timezone.utc))]
2026-03-18T14:21:04.268591817Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:21:14.080569871Z [err] 2026-03-18 14:21:04.234 UTC [54249] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:21:14.080573971Z [err] 2026-03-18 14:21:04.234 UTC [54249] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:21:14.397409032Z [err] 2026-03-18 14:21:14.391 UTC [54250] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:21:14.397416002Z [err] 2026-03-18 14:21:14.391 UTC [54250] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:21:24.266195783Z [inf] 2026-03-18 14:21:14,400 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:21:24.266205146Z [inf] 2026-03-18 14:21:14,419 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:21:24.266211258Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:21:24.266216519Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:21:24.266221450Z [inf] [parameters: (UUID('23133f01-3b06-4086-a9a0-f45e1e389cbf'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 21, 14, 262012, tzinfo=datetime.timezone.utc))]
2026-03-18T14:21:24.266226919Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:21:24.859121124Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:21:24.859214049Z [inf] 2026-03-18 14:21:24,550 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:21:24.859218594Z [inf] 2026-03-18 14:21:24,565 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:21:24.859222880Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:21:24.859227557Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:21:24.859231914Z [inf] [parameters: (UUID('c9619176-e6a0-44fd-8eb9-107c9f5874ad'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 21, 24, 421437, tzinfo=datetime.timezone.utc))]
2026-03-18T14:21:34.397898743Z [err] 2026-03-18 14:21:24.538 UTC [54251] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:21:34.397902883Z [err] 2026-03-18 14:21:24.538 UTC [54251] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:21:34.969592983Z [err] 2026-03-18 14:21:34.685 UTC [54252] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:21:34.969596263Z [err] 2026-03-18 14:21:34.685 UTC [54252] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:21:44.529724806Z [inf] 2026-03-18 14:21:34,696 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:21:44.529734346Z [inf] 2026-03-18 14:21:34,712 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:21:44.529741213Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:21:44.529750232Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:21:44.529757249Z [inf] [parameters: (UUID('a1f1a335-9ec3-40ed-aaa5-f0157968b401'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 21, 34, 566939, tzinfo=datetime.timezone.utc))]
2026-03-18T14:21:44.529763635Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:21:44.923315073Z [inf] 2026-03-18 14:21:44,842 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:21:44.923320968Z [inf] 2026-03-18 14:21:44,858 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:21:44.923326648Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:21:44.923332476Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:21:44.923337459Z [inf] [parameters: (UUID('565edd89-b6b8-4832-8b52-d1a3c3cba7b8'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 21, 44, 713521, tzinfo=datetime.timezone.utc))]
2026-03-18T14:21:44.923342005Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:21:54.680698371Z [err] 2026-03-18 14:21:44.830 UTC [54254] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:21:54.680701961Z [err] 2026-03-18 14:21:44.830 UTC [54254] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:21:55.137540060Z [err] 2026-03-18 14:21:54.970 UTC [54255] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:21:55.137544230Z [err] 2026-03-18 14:21:54.970 UTC [54255] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:21:55.445344065Z [inf] Starting Container
2026-03-18T14:21:57.973187229Z [inf] 2026-03-18 14:21:57,501 - src.api.middleware.rate_limit - INFO - Rate limiting enabled: 100 requests per 60 seconds
2026-03-18T14:21:57.973196142Z [err] INFO: Started server process [1]
2026-03-18T14:21:57.973203909Z [err] INFO: Waiting for application startup.
2026-03-18T14:21:57.973210805Z [inf] 2026-03-18 14:21:57,635 - src.api.main - INFO - Starting up API...
2026-03-18T14:21:57.973219302Z [inf] 2026-03-18 14:21:57,636 - src.api.main - INFO - Environment variable validation completed
2026-03-18T14:21:57.973225564Z [inf] 2026-03-18 14:21:57,636 - src.api.main - INFO - Running in development mode
2026-03-18T14:21:57.973231618Z [inf] 2026-03-18 14:21:57,636 - src.api.main - INFO - Database initialization running in background
2026-03-18T14:21:57.973250404Z [err] INFO: Application startup complete.
2026-03-18T14:21:57.973256560Z [err] INFO: Uvicorn running on http://0.0.0.0:8080 (Press CTRL+C to quit)
2026-03-18T14:21:57.973261867Z [inf] 2026-03-18 14:21:57,925 - src.api.main - INFO - Database initialized
2026-03-18T14:21:58.647859225Z [inf] 2026-03-18 14:21:58,638 - src.api.main - INFO - Database ready; starting background monitor
2026-03-18T14:21:58.647863596Z [inf] 2026-03-18 14:21:58,639 - src.api.services.monitor - INFO - Starting background agent monitor...
2026-03-18T14:21:58.647869828Z [inf] 2026-03-18 14:21:58,639 - src.api.services.self_healer - INFO - Health check scheduler started
2026-03-18T14:21:58.647875648Z [inf] 2026-03-18 14:21:58,639 - src.api.services.self_healer - INFO - Self-healing service started
2026-03-18T14:21:58.647880694Z [inf] 2026-03-18 14:21:58,639 - src.api.services.self_healer - INFO - Registered recovery handler for restart
2026-03-18T14:21:58.647884563Z [inf] 2026-03-18 14:21:58,639 - src.api.services.self_healer - INFO - Registered recovery handler for rollback
2026-03-18T14:21:59.008429738Z [inf] 2026-03-18 14:21:58,815 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:21:59.008437751Z [inf] 2026-03-18 14:21:58,833 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:21:59.008445155Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:21:59.008451903Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:21:59.008458703Z [inf] [parameters: (UUID('193c9fa6-28ea-41fc-91ce-82ff0772da50'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 21, 58, 639404, tzinfo=datetime.timezone.utc))]
2026-03-18T14:21:59.008465749Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:21:59.149983317Z [err] 2026-03-18 14:21:58.804 UTC [54257] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:21:59.149986457Z [err] 2026-03-18 14:21:58.804 UTC [54257] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:22:04.966446886Z [inf] 2026-03-18 14:22:04,053 - src.api.services.self_healer - INFO - Self-healing service stopped
2026-03-18T14:22:04.966461267Z [err] INFO: Application shutdown complete.
2026-03-18T14:22:04.966474418Z [err] INFO: Finished server process [1]
2026-03-18T14:22:04.966547563Z [inf] 2026-03-18 14:21:54,981 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:04.966555176Z [inf] 2026-03-18 14:21:54,999 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:04.966561562Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:04.966565965Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:04.966570010Z [inf] [parameters: (UUID('b1ab2623-9b0e-47f8-86f8-5b9a0491ce47'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 21, 54, 859731, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:04.966573850Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:22:04.966577581Z [err] INFO: Shutting down
2026-03-18T14:22:04.966581059Z [err] INFO: Waiting for application shutdown.
2026-03-18T14:22:04.966585302Z [inf] 2026-03-18 14:22:04,053 - src.api.services.monitor - INFO - Background agent monitor cancellation requested
2026-03-18T14:22:04.966590256Z [inf] 2026-03-18 14:22:04,053 - src.api.services.self_healer - INFO - Health check scheduler stopped
2026-03-18T14:22:05.387941360Z [inf] Stopping Container
2026-03-18T14:22:18.709962177Z [inf] 2026-03-18 14:22:08,967 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:18.709966188Z [inf] 2026-03-18 14:22:08,985 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:18.709969952Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:18.709974339Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:18.709978285Z [inf] [parameters: (UUID('2f6b448b-1a6f-49a8-bc66-7a3b079ae4ba'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 22, 8, 833512, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:18.709983114Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:22:18.814792702Z [err] 2026-03-18 14:22:08.956 UTC [54258] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:22:18.814795641Z [err] 2026-03-18 14:22:08.956 UTC [54258] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:22:19.143633475Z [err] 2026-03-18 14:22:19.105 UTC [54259] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:22:19.143636245Z [err] 2026-03-18 14:22:19.105 UTC [54259] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:22:19.205597125Z [inf] 2026-03-18 14:22:19,114 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:19.205604013Z [inf] 2026-03-18 14:22:19,133 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:19.205610647Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:19.205616819Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:19.205624665Z [inf] [parameters: (UUID('34cb9d65-0e82-4382-bae3-f2e9d9fe229e'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 22, 18, 987246, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:19.205631595Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:22:38.857410936Z [err] 2026-03-18 14:22:29.262 UTC [54260] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:22:38.857414826Z [err] 2026-03-18 14:22:29.262 UTC [54260] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:22:38.867970214Z [inf] 2026-03-18 14:22:29,272 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:38.867978904Z [inf] 2026-03-18 14:22:29,291 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:38.867985046Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:38.867990159Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:38.867994894Z [inf] [parameters: (UUID('1ae76a28-8e25-4ad0-a835-721ae8df130a'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 22, 29, 134379, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:38.867999427Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:22:39.409808468Z [err] 2026-03-18 14:22:39.408 UTC [54261] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:22:39.409813198Z [err] 2026-03-18 14:22:39.408 UTC [54261] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:22:39.425850201Z [inf] 2026-03-18 14:22:39,420 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:39.438257407Z [inf] 2026-03-18 14:22:39,435 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:39.438262717Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:39.438268823Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:39.438272983Z [inf] [parameters: (UUID('e20b1faf-c437-4297-a1c1-9d75631da225'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 22, 39, 292243, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:39.438278275Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:22:59.440850684Z [inf] 2026-03-18 14:22:49,566 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:59.440855242Z [inf] 2026-03-18 14:22:49,582 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:59.440860506Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:59.440866982Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:59.440871398Z [inf] [parameters: (UUID('a2b7d3a3-ba75-4fc7-a835-23fc670d90bf'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 22, 49, 436567, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:59.440875823Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:22:59.699771521Z [err] 2026-03-18 14:22:59.695 UTC [54264] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:22:59.699776591Z [err] 2026-03-18 14:22:59.695 UTC [54264] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:22:59.707160120Z [inf] 2026-03-18 14:22:59,706 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:59.733508340Z [inf] 2026-03-18 14:22:59,723 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:59.733511825Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:59.733515164Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:59.733518756Z [inf] [parameters: (UUID('e2fd175a-c3af-49f1-a19d-2e016f0c0308'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 22, 59, 582728, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:59.733522747Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:23:19.698742285Z [err] 2026-03-18 14:23:09.831 UTC [54265] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:23:19.698748704Z [err] 2026-03-18 14:23:09.831 UTC [54265] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:23:19.736743921Z [inf] 2026-03-18 14:23:09,843 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:23:19.736750006Z [inf] 2026-03-18 14:23:09,860 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:23:19.736753873Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:23:19.736757692Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:23:19.736761290Z [inf] [parameters: (UUID('3e583acc-6bb4-46eb-be3a-317444d73b6e'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 23, 9, 723803, tzinfo=datetime.timezone.utc))]
2026-03-18T14:23:19.736764883Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:23:19.985818572Z [inf] 2026-03-18 14:23:19,980 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:23:20.002627016Z [inf] 2026-03-18 14:23:19,996 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:23:20.002633861Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:23:20.002640032Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:23:20.002646173Z [inf] [parameters: (UUID('e0d5def4-c391-4302-8a7d-76d97bbe8c99'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 23, 19, 861569, tzinfo=datetime.timezone.utc))]
2026-03-18T14:23:20.002652306Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:23:20.354844729Z [err] 2026-03-18 14:23:19.968 UTC [54266] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:23:20.354850979Z [err] 2026-03-18 14:23:19.968 UTC [54266] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:23:30.343348431Z [err] 2026-03-18 14:23:30.103 UTC [54267] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:23:30.343354951Z [err] 2026-03-18 14:23:30.103 UTC [54267] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:23:40.014576448Z [inf] 2026-03-18 14:23:30,115 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:23:40.014581701Z [inf] 2026-03-18 14:23:30,130 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:23:40.014589933Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:23:40.014595420Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:23:40.014600405Z [inf] [parameters: (UUID('60412b47-e088-4b3e-8bbf-3a591c5bccf2'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 23, 29, 997335, tzinfo=datetime.timezone.utc))]
2026-03-18T14:23:40.014604662Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:23:40.430177034Z [inf] 2026-03-18 14:23:40,265 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:23:40.430183746Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:23:40.430189630Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:23:40.430194665Z [inf] [parameters: (UUID('fc791d07-ac8a-42e1-9ac7-d15411e7ccfd'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 23, 40, 131645, tzinfo=datetime.timezone.utc))]
2026-03-18T14:23:40.430199892Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:23:40.430284862Z [inf] 2026-03-18 14:23:40,252 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:23:50.396682591Z [err] 2026-03-18 14:23:50.393 UTC [54270] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:23:50.396688001Z [err] 2026-03-18 14:23:50.393 UTC [54270] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:24:00.157565671Z [inf] 2026-03-18 14:23:50,404 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:00.157573890Z [inf] 2026-03-18 14:23:50,425 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:24:00.157579184Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:24:00.157584446Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:24:00.157589488Z [inf] [parameters: (UUID('9f65267a-ad5b-485f-a374-f2efa59e37cb'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 23, 50, 267470, tzinfo=datetime.timezone.utc))]
2026-03-18T14:24:00.157596302Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:24:00.572777052Z [inf] 2026-03-18 14:24:00,553 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:00.580703808Z [inf] 2026-03-18 14:24:00,575 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:24:00.580710339Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:24:00.580714983Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:24:00.580719613Z [inf] [parameters: (UUID('0fc4e393-5eac-4a80-bf25-fb78221e43e7'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 24, 0, 424886, tzinfo=datetime.timezone.utc))]
2026-03-18T14:24:00.580733681Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:24:10.031067600Z [err] 2026-03-18 14:24:00.541 UTC [54271] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:24:10.031070100Z [err] 2026-03-18 14:24:00.541 UTC [54271] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:24:10.719957821Z [err] 2026-03-18 14:24:10.696 UTC [54272] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:24:10.719967051Z [err] 2026-03-18 14:24:10.696 UTC [54272] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:24:20.606456814Z [inf] [parameters: (UUID('0dc304b6-194d-40a5-8141-edf1ebb0bc59'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 24, 10, 576068, tzinfo=datetime.timezone.utc))]
2026-03-18T14:24:20.606467880Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:24:20.606484214Z [inf] 2026-03-18 14:24:10,728 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:24:20.606492548Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:24:20.606499252Z [inf] 2026-03-18 14:24:10,707 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:20.606502916Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:24:20.857924156Z [inf] 2026-03-18 14:24:20,857 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:20.875277172Z [inf] 2026-03-18 14:24:20,872 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:24:20.875282294Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:24:20.875287115Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:24:20.875294676Z [inf] [parameters: (UUID('12a73175-abcf-430a-ab99-8ede6bddf6bb'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 24, 20, 728467, tzinfo=datetime.timezone.utc))]
2026-03-18T14:24:20.875300476Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:24:30.702041109Z [err] 2026-03-18 14:24:20.845 UTC [54273] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:24:30.702048388Z [err] 2026-03-18 14:24:20.845 UTC [54273] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:24:31.006561396Z [err] 2026-03-18 14:24:31.002 UTC [54274] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:24:31.006567076Z [err] 2026-03-18 14:24:31.002 UTC [54274] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:24:40.887791994Z [inf] 2026-03-18 14:24:31,011 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:40.887796027Z [inf] 2026-03-18 14:24:31,030 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:24:40.887799545Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:24:40.887804034Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:24:40.887807591Z [inf] [parameters: (UUID('dc2e25c7-dbae-457c-85fb-7284a79f6ad7'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 24, 30, 873197, tzinfo=datetime.timezone.utc))]
2026-03-18T14:24:40.887811214Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:24:41.162024031Z [inf] 2026-03-18 14:24:41,160 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:41.176635221Z [inf] 2026-03-18 14:24:41,175 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:24:41.176641255Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:24:41.176644725Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:24:41.176648680Z [inf] [parameters: (UUID('01d4b0f8-57d7-413d-a8f7-7afa3fc99842'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 24, 41, 31748, tzinfo=datetime.timezone.utc))]
2026-03-18T14:24:41.176652422Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:24:51.006723698Z [err] 2026-03-18 14:24:41.147 UTC [54276] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:24:51.006729828Z [err] 2026-03-18 14:24:41.147 UTC [54276] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:24:51.559502221Z [err] 2026-03-18 14:24:51.292 UTC [54277] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:24:51.559507280Z [err] 2026-03-18 14:24:51.292 UTC [54277] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:25:01.180459418Z [inf] 2026-03-18 14:24:51,304 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:25:01.180467244Z [inf] 2026-03-18 14:24:51,321 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:25:01.180472823Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:25:01.180478353Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:25:01.180483182Z [inf] [parameters: (UUID('044e5d76-d02b-4d14-b080-f0a56301b73c'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 24, 51, 175539, tzinfo=datetime.timezone.utc))]
2026-03-18T14:25:01.180487888Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:25:01.771946949Z [inf] 2026-03-18 14:25:01,447 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:25:01.771953608Z [inf] 2026-03-18 14:25:01,462 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:25:01.771961468Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:25:01.771969954Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:25:01.771977797Z [inf] [parameters: (UUID('34704bbc-1db9-4dcf-8754-23c93a4a59c5'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 25, 1, 321327, tzinfo=datetime.timezone.utc))]
2026-03-18T14:25:01.771984486Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:25:10.916749804Z [inf] Starting Container
2026-03-18T14:25:11.193287543Z [err] 2026-03-18 14:25:01.434 UTC [54278] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:25:11.193363981Z [err] 2026-03-18 14:25:01.434 UTC [54278] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:25:11.623222324Z [err] 2026-03-18 14:25:11.577 UTC [54279] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:25:11.623227294Z [err] 2026-03-18 14:25:11.577 UTC [54279] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:25:13.358611759Z [err] INFO: Started server process [1]
2026-03-18T14:25:13.358615245Z [inf] 2026-03-18 14:25:13,090 - src.api.main - INFO - Database initialized
2026-03-18T14:25:13.358622624Z [err] INFO: Waiting for application startup.
2026-03-18T14:25:13.358630770Z [inf] 2026-03-18 14:25:12,524 - src.api.main - INFO - Starting up API...
2026-03-18T14:25:13.358639133Z [inf] 2026-03-18 14:25:12,525 - src.api.main - INFO - Environment variable validation completed
2026-03-18T14:25:13.358647089Z [inf] 2026-03-18 14:25:12,525 - src.api.main - INFO - Running in development mode
2026-03-18T14:25:13.358653999Z [inf] 2026-03-18 14:25:12,525 - src.api.main - INFO - Database initialization running in background
2026-03-18T14:25:13.358661044Z [err] INFO: Application startup complete.
2026-03-18T14:25:13.358669947Z [err] INFO: Uvicorn running on http://0.0.0.0:8080 (Press CTRL+C to quit)
2026-03-18T14:25:13.358701249Z [inf] 2026-03-18 14:25:12,369 - src.api.middleware.rate_limit - INFO - Rate limiting enabled: 100 requests per 60 seconds
2026-03-18T14:25:13.530866974Z [inf] 2026-03-18 14:25:13,528 - src.api.main - INFO - Database ready; starting background monitor
2026-03-18T14:25:13.530873695Z [inf] 2026-03-18 14:25:13,528 - src.api.services.monitor - INFO - Starting background agent monitor...
2026-03-18T14:25:13.530878388Z [inf] 2026-03-18 14:25:13,528 - src.api.services.self_healer - INFO - Health check scheduler started
2026-03-18T14:25:13.530883113Z [inf] 2026-03-18 14:25:13,528 - src.api.services.self_healer - INFO - Self-healing service started
2026-03-18T14:25:13.530887732Z [inf] 2026-03-18 14:25:13,528 - src.api.services.self_healer - INFO - Registered recovery handler for restart
2026-03-18T14:25:13.530891851Z [inf] 2026-03-18 14:25:13,528 - src.api.services.self_healer - INFO - Registered recovery handler for rollback
2026-03-18T14:25:13.755833206Z [inf] 2026-03-18 14:25:13,753 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:25:13.793813065Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:25:13.793822399Z [inf] [parameters: (UUID('fe196b05-faf8-49c1-b5c7-0089f456c694'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 25, 13, 529025, tzinfo=datetime.timezone.utc))]
2026-03-18T14:25:13.793828332Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:25:13.793984687Z [inf] 2026-03-18 14:25:13,791 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:25:13.793990321Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:25:19.421851748Z [inf] Stopping Container
2026-03-18T14:25:21.483214131Z [inf] 2026-03-18 14:25:11,589 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:25:21.483229925Z [inf] 2026-03-18 14:25:11,607 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:25:21.483239854Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:25:21.483246373Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:25:21.483251724Z [inf] [parameters: (UUID('7db49892-bcd4-4746-948d-bbe754e1bf3e'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 25, 11, 462942, tzinfo=datetime.timezone.utc))]
2026-03-18T14:25:21.483258109Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:25:21.483269014Z [err] INFO: Shutting down
2026-03-18T14:25:21.483274791Z [err] INFO: Waiting for application shutdown.
2026-03-18T14:25:21.483284262Z [inf] 2026-03-18 14:25:18,723 - src.api.services.monitor - INFO - Background agent monitor cancellation requested
2026-03-18T14:25:21.483290575Z [inf] 2026-03-18 14:25:18,723 - src.api.services.self_healer - INFO - Health check scheduler stopped
2026-03-18T14:25:21.483297660Z [inf] 2026-03-18 14:25:18,723 - src.api.services.self_healer - INFO - Self-healing service stopped
2026-03-18T14:25:21.483302500Z [err] INFO: Application shutdown complete.
2026-03-18T14:25:21.483308471Z [err] INFO: Finished server process [1]
2026-03-18T14:25:33.761291509Z [err] 2026-03-18 14:25:23.966 UTC [54282] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:25:33.761295569Z [err] 2026-03-18 14:25:23.966 UTC [54282] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:25:33.780527614Z [inf] [parameters: (UUID('d161631e-2c57-4d08-98e2-653fb9a97f83'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 25, 23, 792011, tzinfo=datetime.timezone.utc))]
2026-03-18T14:25:33.780540648Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:25:33.780627440Z [inf] 2026-03-18 14:25:23,972 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:25:33.780633817Z [inf] 2026-03-18 14:25:23,998 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:25:33.780647198Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:25:33.780654733Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:25:34.149271709Z [err] 2026-03-18 14:25:34.138 UTC [54283] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:25:34.149284248Z [err] 2026-03-18 14:25:34.138 UTC [54283] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:25:34.150612504Z [inf] 2026-03-18 14:25:34,142 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:25:34.177331606Z [inf] 2026-03-18 14:25:34,171 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:25:34.177339680Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:25:34.177346375Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:25:34.177351685Z [inf] [parameters: (UUID('41085f97-edbe-4ec1-be88-c367df80f96c'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 25, 33, 998843, tzinfo=datetime.timezone.utc))]
2026-03-18T14:25:34.177356676Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)



2026-03-18T14:21:55.445344065Z [inf] Starting Container
2026-03-18T14:21:57.973187229Z [inf] 2026-03-18 14:21:57,501 - src.api.middleware.rate_limit - INFO - Rate limiting enabled: 100 requests per 60 seconds
2026-03-18T14:21:57.973196142Z [err] INFO: Started server process [1]
2026-03-18T14:21:57.973203909Z [err] INFO: Waiting for application startup.
2026-03-18T14:21:57.973210805Z [inf] 2026-03-18 14:21:57,635 - src.api.main - INFO - Starting up API...
2026-03-18T14:21:57.973219302Z [inf] 2026-03-18 14:21:57,636 - src.api.main - INFO - Environment variable validation completed
2026-03-18T14:21:57.973225564Z [inf] 2026-03-18 14:21:57,636 - src.api.main - INFO - Running in development mode
2026-03-18T14:21:57.973231618Z [inf] 2026-03-18 14:21:57,636 - src.api.main - INFO - Database initialization running in background
2026-03-18T14:21:57.973250404Z [err] INFO: Application startup complete.
2026-03-18T14:21:57.973256560Z [err] INFO: Uvicorn running on http://0.0.0.0:8080 (Press CTRL+C to quit)
2026-03-18T14:21:57.973261867Z [inf] 2026-03-18 14:21:57,925 - src.api.main - INFO - Database initialized
2026-03-18T14:21:58.647859225Z [inf] 2026-03-18 14:21:58,638 - src.api.main - INFO - Database ready; starting background monitor
2026-03-18T14:21:58.647863596Z [inf] 2026-03-18 14:21:58,639 - src.api.services.monitor - INFO - Starting background agent monitor...
2026-03-18T14:21:58.647869828Z [inf] 2026-03-18 14:21:58,639 - src.api.services.self_healer - INFO - Health check scheduler started
2026-03-18T14:21:58.647875648Z [inf] 2026-03-18 14:21:58,639 - src.api.services.self_healer - INFO - Self-healing service started
2026-03-18T14:21:58.647880694Z [inf] 2026-03-18 14:21:58,639 - src.api.services.self_healer - INFO - Registered recovery handler for restart
2026-03-18T14:21:58.647884563Z [inf] 2026-03-18 14:21:58,639 - src.api.services.self_healer - INFO - Registered recovery handler for rollback
2026-03-18T14:21:59.008429738Z [inf] 2026-03-18 14:21:58,815 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:21:59.008437751Z [inf] 2026-03-18 14:21:58,833 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:21:59.008445155Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:21:59.008451903Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:21:59.008458703Z [inf] [parameters: (UUID('193c9fa6-28ea-41fc-91ce-82ff0772da50'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 21, 58, 639404, tzinfo=datetime.timezone.utc))]
2026-03-18T14:21:59.008465749Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:22:18.709962177Z [inf] 2026-03-18 14:22:08,967 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:18.709966188Z [inf] 2026-03-18 14:22:08,985 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:18.709969952Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:18.709974339Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:18.709978285Z [inf] [parameters: (UUID('2f6b448b-1a6f-49a8-bc66-7a3b079ae4ba'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 22, 8, 833512, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:18.709983114Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:22:19.205597125Z [inf] 2026-03-18 14:22:19,114 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:19.205604013Z [inf] 2026-03-18 14:22:19,133 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:19.205610647Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:19.205616819Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:19.205624665Z [inf] [parameters: (UUID('34cb9d65-0e82-4382-bae3-f2e9d9fe229e'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 22, 18, 987246, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:19.205631595Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:22:38.867970214Z [inf] 2026-03-18 14:22:29,272 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:38.867978904Z [inf] 2026-03-18 14:22:29,291 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:38.867985046Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:38.867990159Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:38.867994894Z [inf] [parameters: (UUID('1ae76a28-8e25-4ad0-a835-721ae8df130a'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 22, 29, 134379, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:38.867999427Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:22:39.425850201Z [inf] 2026-03-18 14:22:39,420 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:39.438257407Z [inf] 2026-03-18 14:22:39,435 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:39.438262717Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:39.438268823Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:39.438272983Z [inf] [parameters: (UUID('e20b1faf-c437-4297-a1c1-9d75631da225'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 22, 39, 292243, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:39.438278275Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:22:59.440850684Z [inf] 2026-03-18 14:22:49,566 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:59.440855242Z [inf] 2026-03-18 14:22:49,582 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:59.440860506Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:59.440866982Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:59.440871398Z [inf] [parameters: (UUID('a2b7d3a3-ba75-4fc7-a835-23fc670d90bf'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 22, 49, 436567, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:59.440875823Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:22:59.707160120Z [inf] 2026-03-18 14:22:59,706 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:59.733508340Z [inf] 2026-03-18 14:22:59,723 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:59.733511825Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:59.733515164Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:59.733518756Z [inf] [parameters: (UUID('e2fd175a-c3af-49f1-a19d-2e016f0c0308'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 22, 59, 582728, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:59.733522747Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:23:19.736743921Z [inf] 2026-03-18 14:23:09,843 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:23:19.736750006Z [inf] 2026-03-18 14:23:09,860 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:23:19.736753873Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:23:19.736757692Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:23:19.736761290Z [inf] [parameters: (UUID('3e583acc-6bb4-46eb-be3a-317444d73b6e'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 23, 9, 723803, tzinfo=datetime.timezone.utc))]
2026-03-18T14:23:19.736764883Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:23:19.985818572Z [inf] 2026-03-18 14:23:19,980 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:23:20.002627016Z [inf] 2026-03-18 14:23:19,996 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:23:20.002633861Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:23:20.002640032Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:23:20.002646173Z [inf] [parameters: (UUID('e0d5def4-c391-4302-8a7d-76d97bbe8c99'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 23, 19, 861569, tzinfo=datetime.timezone.utc))]
2026-03-18T14:23:20.002652306Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:23:40.014576448Z [inf] 2026-03-18 14:23:30,115 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:23:40.014581701Z [inf] 2026-03-18 14:23:30,130 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:23:40.014589933Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:23:40.014595420Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:23:40.014600405Z [inf] [parameters: (UUID('60412b47-e088-4b3e-8bbf-3a591c5bccf2'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 23, 29, 997335, tzinfo=datetime.timezone.utc))]
2026-03-18T14:23:40.014604662Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:23:40.430177034Z [inf] 2026-03-18 14:23:40,265 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:23:40.430183746Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:23:40.430189630Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:23:40.430194665Z [inf] [parameters: (UUID('fc791d07-ac8a-42e1-9ac7-d15411e7ccfd'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 23, 40, 131645, tzinfo=datetime.timezone.utc))]
2026-03-18T14:23:40.430199892Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:23:40.430284862Z [inf] 2026-03-18 14:23:40,252 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:00.157565671Z [inf] 2026-03-18 14:23:50,404 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:00.157573890Z [inf] 2026-03-18 14:23:50,425 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:24:00.157579184Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:24:00.157584446Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:24:00.157589488Z [inf] [parameters: (UUID('9f65267a-ad5b-485f-a374-f2efa59e37cb'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 23, 50, 267470, tzinfo=datetime.timezone.utc))]
2026-03-18T14:24:00.157596302Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:24:00.572777052Z [inf] 2026-03-18 14:24:00,553 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:00.580703808Z [inf] 2026-03-18 14:24:00,575 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:24:00.580710339Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:24:00.580714983Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:24:00.580719613Z [inf] [parameters: (UUID('0fc4e393-5eac-4a80-bf25-fb78221e43e7'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 24, 0, 424886, tzinfo=datetime.timezone.utc))]
2026-03-18T14:24:00.580733681Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:24:20.606456814Z [inf] [parameters: (UUID('0dc304b6-194d-40a5-8141-edf1ebb0bc59'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 24, 10, 576068, tzinfo=datetime.timezone.utc))]
2026-03-18T14:24:20.606467880Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:24:20.606484214Z [inf] 2026-03-18 14:24:10,728 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:24:20.606492548Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:24:20.606499252Z [inf] 2026-03-18 14:24:10,707 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:20.606502916Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:24:20.857924156Z [inf] 2026-03-18 14:24:20,857 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:20.875277172Z [inf] 2026-03-18 14:24:20,872 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:24:20.875282294Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:24:20.875287115Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:24:20.875294676Z [inf] [parameters: (UUID('12a73175-abcf-430a-ab99-8ede6bddf6bb'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 24, 20, 728467, tzinfo=datetime.timezone.utc))]
2026-03-18T14:24:20.875300476Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:24:40.887791994Z [inf] 2026-03-18 14:24:31,011 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:40.887796027Z [inf] 2026-03-18 14:24:31,030 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:24:40.887799545Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:24:40.887804034Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:24:40.887807591Z [inf] [parameters: (UUID('dc2e25c7-dbae-457c-85fb-7284a79f6ad7'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 24, 30, 873197, tzinfo=datetime.timezone.utc))]
2026-03-18T14:24:40.887811214Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:24:41.162024031Z [inf] 2026-03-18 14:24:41,160 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:41.176635221Z [inf] 2026-03-18 14:24:41,175 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:24:41.176641255Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:24:41.176644725Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:24:41.176648680Z [inf] [parameters: (UUID('01d4b0f8-57d7-413d-a8f7-7afa3fc99842'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 24, 41, 31748, tzinfo=datetime.timezone.utc))]
2026-03-18T14:24:41.176652422Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:25:01.180459418Z [inf] 2026-03-18 14:24:51,304 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:25:01.180467244Z [inf] 2026-03-18 14:24:51,321 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:25:01.180472823Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:25:01.180478353Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:25:01.180483182Z [inf] [parameters: (UUID('044e5d76-d02b-4d14-b080-f0a56301b73c'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 24, 51, 175539, tzinfo=datetime.timezone.utc))]
2026-03-18T14:25:01.180487888Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:25:01.771946949Z [inf] 2026-03-18 14:25:01,447 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:25:01.771953608Z [inf] 2026-03-18 14:25:01,462 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:25:01.771961468Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:25:01.771969954Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:25:01.771977797Z [inf] [parameters: (UUID('34704bbc-1db9-4dcf-8754-23c93a4a59c5'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 25, 1, 321327, tzinfo=datetime.timezone.utc))]
2026-03-18T14:25:01.771984486Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:25:19.421851748Z [inf] Stopping Container
user: System: [2026-03-18 15:13:29 GMT+1] Exec completed (fast-can, code 0) :: ==> Summary 🍺 /opt/homebrew/Cellar/postgresql@17/17.9: 3,824 files, 75.7MB ==> Running `brew cleanup postgresql@17`... Disable this behaviour by setting `HOMEBREW_NO_INSTALL_CLEA…
System: [2026-03-18 15:17:31 GMT+1] Exec completed (fresh-fj, code 0) :: Recent Deployments 81ea0adf-9c24-456b-aa87-ee652bd56cde | BUILDING | 2026-03-18 15:16:21 +01:00 07264905-52d7-495c-9616-977f0a4213d9 | SUCCESS | 2026-03-18 15:08:06 +01:00 15e045f…
System: [2026-03-18 15:18:39 GMT+1] Exec completed (marine-c, code 0) :: Recent Deployments 81ea0adf-9c24-456b-aa87-ee652bd56cde | SUCCESS | 2026-03-18 15:16:21 +01:00 07264905-52d7-495c-9616-977f0a4213d9 | REMOVED | 2026-03-18 15:08:06 +01:00 15e045ff…
System: [2026-03-18 15:22:24 GMT+1] Exec completed (briny-fo, code 0) :: Recent Deployments 2df21cd7-5c68-4018-853f-a528e84b2529 | SUCCESS | 2026-03-18 15:20:34 +01:00 81ea0adf-9c24-456b-aa87-ee652bd56cde | REMOVED | 2026-03-18 15:16:21 +01:00 07264905…

Sender (untrusted metadata):
```json
{
  "label": "openclaw-control-ui",
  "id": "openclaw-control-ui"
}
```

[Wed 2026-03-18 15:26 GMT+1] 2026-03-18T14:20:43.351676235Z [inf] 2026-03-18 14:20:33,787 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:20:43.351681566Z [inf] 2026-03-18 14:20:33,804 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:20:43.351686218Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:20:43.351690763Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:20:43.351695192Z [inf] [parameters: (UUID('2cdb7c12-f612-4c7e-8a6e-822a47a89691'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 20, 33, 655867, tzinfo=datetime.timezone.utc))]
2026-03-18T14:20:43.351699997Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:20:43.939422066Z [inf] 2026-03-18 14:20:43,937 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:20:43.954688766Z [inf] 2026-03-18 14:20:43,952 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:20:43.954693813Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:20:43.954699238Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:20:43.954704517Z [inf] [parameters: (UUID('687ad786-f5db-46ec-b2e7-a147fc6259a8'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 20, 43, 805553, tzinfo=datetime.timezone.utc))]
2026-03-18T14:20:43.954709078Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:20:53.550274681Z [err] 2026-03-18 14:20:43.925 UTC [54247] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:20:53.550286790Z [err] 2026-03-18 14:20:43.925 UTC [54247] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:20:54.081708852Z [err] 2026-03-18 14:20:54.079 UTC [54248] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:20:54.081712961Z [err] 2026-03-18 14:20:54.079 UTC [54248] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:21:03.951472616Z [inf] 2026-03-18 14:20:54,084 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:21:03.951532777Z [inf] 2026-03-18 14:20:54,110 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:21:03.951540369Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:21:03.951546883Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:21:03.951551735Z [inf] [parameters: (UUID('ffa64427-bea7-453b-ab04-cf3dac87283f'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 20, 53, 953234, tzinfo=datetime.timezone.utc))]
2026-03-18T14:21:03.951557711Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:21:04.247872821Z [inf] 2026-03-18 14:21:04,244 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:21:04.268569547Z [inf] 2026-03-18 14:21:04,262 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:21:04.268575177Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:21:04.268580473Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:21:04.268586089Z [inf] [parameters: (UUID('44194c32-26b9-4b9a-8a97-602ba2ccc1f6'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 21, 4, 112357, tzinfo=datetime.timezone.utc))]
2026-03-18T14:21:04.268591817Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:21:14.080569871Z [err] 2026-03-18 14:21:04.234 UTC [54249] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:21:14.080573971Z [err] 2026-03-18 14:21:04.234 UTC [54249] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:21:14.397409032Z [err] 2026-03-18 14:21:14.391 UTC [54250] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:21:14.397416002Z [err] 2026-03-18 14:21:14.391 UTC [54250] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:21:24.266195783Z [inf] 2026-03-18 14:21:14,400 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:21:24.266205146Z [inf] 2026-03-18 14:21:14,419 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:21:24.266211258Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:21:24.266216519Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:21:24.266221450Z [inf] [parameters: (UUID('23133f01-3b06-4086-a9a0-f45e1e389cbf'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 21, 14, 262012, tzinfo=datetime.timezone.utc))]
2026-03-18T14:21:24.266226919Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:21:24.859121124Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:21:24.859214049Z [inf] 2026-03-18 14:21:24,550 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:21:24.859218594Z [inf] 2026-03-18 14:21:24,565 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:21:24.859222880Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:21:24.859227557Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:21:24.859231914Z [inf] [parameters: (UUID('c9619176-e6a0-44fd-8eb9-107c9f5874ad'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 21, 24, 421437, tzinfo=datetime.timezone.utc))]
2026-03-18T14:21:34.397898743Z [err] 2026-03-18 14:21:24.538 UTC [54251] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:21:34.397902883Z [err] 2026-03-18 14:21:24.538 UTC [54251] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:21:34.969592983Z [err] 2026-03-18 14:21:34.685 UTC [54252] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:21:34.969596263Z [err] 2026-03-18 14:21:34.685 UTC [54252] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:21:44.529724806Z [inf] 2026-03-18 14:21:34,696 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:21:44.529734346Z [inf] 2026-03-18 14:21:34,712 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:21:44.529741213Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:21:44.529750232Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:21:44.529757249Z [inf] [parameters: (UUID('a1f1a335-9ec3-40ed-aaa5-f0157968b401'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 21, 34, 566939, tzinfo=datetime.timezone.utc))]
2026-03-18T14:21:44.529763635Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:21:44.923315073Z [inf] 2026-03-18 14:21:44,842 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:21:44.923320968Z [inf] 2026-03-18 14:21:44,858 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:21:44.923326648Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:21:44.923332476Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:21:44.923337459Z [inf] [parameters: (UUID('565edd89-b6b8-4832-8b52-d1a3c3cba7b8'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 21, 44, 713521, tzinfo=datetime.timezone.utc))]
2026-03-18T14:21:44.923342005Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:21:54.680698371Z [err] 2026-03-18 14:21:44.830 UTC [54254] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:21:54.680701961Z [err] 2026-03-18 14:21:44.830 UTC [54254] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:21:55.137540060Z [err] 2026-03-18 14:21:54.970 UTC [54255] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:21:55.137544230Z [err] 2026-03-18 14:21:54.970 UTC [54255] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:21:55.445344065Z [inf] Starting Container
2026-03-18T14:21:57.973187229Z [inf] 2026-03-18 14:21:57,501 - src.api.middleware.rate_limit - INFO - Rate limiting enabled: 100 requests per 60 seconds
2026-03-18T14:21:57.973196142Z [err] INFO: Started server process [1]
2026-03-18T14:21:57.973203909Z [err] INFO: Waiting for application startup.
2026-03-18T14:21:57.973210805Z [inf] 2026-03-18 14:21:57,635 - src.api.main - INFO - Starting up API...
2026-03-18T14:21:57.973219302Z [inf] 2026-03-18 14:21:57,636 - src.api.main - INFO - Environment variable validation completed
2026-03-18T14:21:57.973225564Z [inf] 2026-03-18 14:21:57,636 - src.api.main - INFO - Running in development mode
2026-03-18T14:21:57.973231618Z [inf] 2026-03-18 14:21:57,636 - src.api.main - INFO - Database initialization running in background
2026-03-18T14:21:57.973250404Z [err] INFO: Application startup complete.
2026-03-18T14:21:57.973256560Z [err] INFO: Uvicorn running on http://0.0.0.0:8080 (Press CTRL+C to quit)
2026-03-18T14:21:57.973261867Z [inf] 2026-03-18 14:21:57,925 - src.api.main - INFO - Database initialized
2026-03-18T14:21:58.647859225Z [inf] 2026-03-18 14:21:58,638 - src.api.main - INFO - Database ready; starting background monitor
2026-03-18T14:21:58.647863596Z [inf] 2026-03-18 14:21:58,639 - src.api.services.monitor - INFO - Starting background agent monitor...
2026-03-18T14:21:58.647869828Z [inf] 2026-03-18 14:21:58,639 - src.api.services.self_healer - INFO - Health check scheduler started
2026-03-18T14:21:58.647875648Z [inf] 2026-03-18 14:21:58,639 - src.api.services.self_healer - INFO - Self-healing service started
2026-03-18T14:21:58.647880694Z [inf] 2026-03-18 14:21:58,639 - src.api.services.self_healer - INFO - Registered recovery handler for restart
2026-03-18T14:21:58.647884563Z [inf] 2026-03-18 14:21:58,639 - src.api.services.self_healer - INFO - Registered recovery handler for rollback
2026-03-18T14:21:59.008429738Z [inf] 2026-03-18 14:21:58,815 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:21:59.008437751Z [inf] 2026-03-18 14:21:58,833 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:21:59.008445155Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:21:59.008451903Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:21:59.008458703Z [inf] [parameters: (UUID('193c9fa6-28ea-41fc-91ce-82ff0772da50'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 21, 58, 639404, tzinfo=datetime.timezone.utc))]
2026-03-18T14:21:59.008465749Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:21:59.149983317Z [err] 2026-03-18 14:21:58.804 UTC [54257] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:21:59.149986457Z [err] 2026-03-18 14:21:58.804 UTC [54257] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:22:04.966446886Z [inf] 2026-03-18 14:22:04,053 - src.api.services.self_healer - INFO - Self-healing service stopped
2026-03-18T14:22:04.966461267Z [err] INFO: Application shutdown complete.
2026-03-18T14:22:04.966474418Z [err] INFO: Finished server process [1]
2026-03-18T14:22:04.966547563Z [inf] 2026-03-18 14:21:54,981 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:04.966555176Z [inf] 2026-03-18 14:21:54,999 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:04.966561562Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:04.966565965Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:04.966570010Z [inf] [parameters: (UUID('b1ab2623-9b0e-47f8-86f8-5b9a0491ce47'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 21, 54, 859731, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:04.966573850Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:22:04.966577581Z [err] INFO: Shutting down
2026-03-18T14:22:04.966581059Z [err] INFO: Waiting for application shutdown.
2026-03-18T14:22:04.966585302Z [inf] 2026-03-18 14:22:04,053 - src.api.services.monitor - INFO - Background agent monitor cancellation requested
2026-03-18T14:22:04.966590256Z [inf] 2026-03-18 14:22:04,053 - src.api.services.self_healer - INFO - Health check scheduler stopped
2026-03-18T14:22:05.387941360Z [inf] Stopping Container
2026-03-18T14:22:18.709962177Z [inf] 2026-03-18 14:22:08,967 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:18.709966188Z [inf] 2026-03-18 14:22:08,985 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:18.709969952Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:18.709974339Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:18.709978285Z [inf] [parameters: (UUID('2f6b448b-1a6f-49a8-bc66-7a3b079ae4ba'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 22, 8, 833512, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:18.709983114Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:22:18.814792702Z [err] 2026-03-18 14:22:08.956 UTC [54258] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:22:18.814795641Z [err] 2026-03-18 14:22:08.956 UTC [54258] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:22:19.143633475Z [err] 2026-03-18 14:22:19.105 UTC [54259] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:22:19.143636245Z [err] 2026-03-18 14:22:19.105 UTC [54259] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:22:19.205597125Z [inf] 2026-03-18 14:22:19,114 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:19.205604013Z [inf] 2026-03-18 14:22:19,133 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:19.205610647Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:19.205616819Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:19.205624665Z [inf] [parameters: (UUID('34cb9d65-0e82-4382-bae3-f2e9d9fe229e'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 22, 18, 987246, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:19.205631595Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:22:38.857410936Z [err] 2026-03-18 14:22:29.262 UTC [54260] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:22:38.857414826Z [err] 2026-03-18 14:22:29.262 UTC [54260] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:22:38.867970214Z [inf] 2026-03-18 14:22:29,272 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:38.867978904Z [inf] 2026-03-18 14:22:29,291 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:38.867985046Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:38.867990159Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:38.867994894Z [inf] [parameters: (UUID('1ae76a28-8e25-4ad0-a835-721ae8df130a'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 22, 29, 134379, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:38.867999427Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:22:39.409808468Z [err] 2026-03-18 14:22:39.408 UTC [54261] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:22:39.409813198Z [err] 2026-03-18 14:22:39.408 UTC [54261] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:22:39.425850201Z [inf] 2026-03-18 14:22:39,420 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:39.438257407Z [inf] 2026-03-18 14:22:39,435 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:39.438262717Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:39.438268823Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:39.438272983Z [inf] [parameters: (UUID('e20b1faf-c437-4297-a1c1-9d75631da225'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 22, 39, 292243, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:39.438278275Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:22:59.440850684Z [inf] 2026-03-18 14:22:49,566 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:59.440855242Z [inf] 2026-03-18 14:22:49,582 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:59.440860506Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:59.440866982Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:59.440871398Z [inf] [parameters: (UUID('a2b7d3a3-ba75-4fc7-a835-23fc670d90bf'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 22, 49, 436567, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:59.440875823Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:22:59.699771521Z [err] 2026-03-18 14:22:59.695 UTC [54264] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:22:59.699776591Z [err] 2026-03-18 14:22:59.695 UTC [54264] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:22:59.707160120Z [inf] 2026-03-18 14:22:59,706 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:59.733508340Z [inf] 2026-03-18 14:22:59,723 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:59.733511825Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:59.733515164Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:59.733518756Z [inf] [parameters: (UUID('e2fd175a-c3af-49f1-a19d-2e016f0c0308'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 22, 59, 582728, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:59.733522747Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:23:19.698742285Z [err] 2026-03-18 14:23:09.831 UTC [54265] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:23:19.698748704Z [err] 2026-03-18 14:23:09.831 UTC [54265] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:23:19.736743921Z [inf] 2026-03-18 14:23:09,843 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:23:19.736750006Z [inf] 2026-03-18 14:23:09,860 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:23:19.736753873Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:23:19.736757692Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:23:19.736761290Z [inf] [parameters: (UUID('3e583acc-6bb4-46eb-be3a-317444d73b6e'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 23, 9, 723803, tzinfo=datetime.timezone.utc))]
2026-03-18T14:23:19.736764883Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:23:19.985818572Z [inf] 2026-03-18 14:23:19,980 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:23:20.002627016Z [inf] 2026-03-18 14:23:19,996 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:23:20.002633861Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:23:20.002640032Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:23:20.002646173Z [inf] [parameters: (UUID('e0d5def4-c391-4302-8a7d-76d97bbe8c99'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 23, 19, 861569, tzinfo=datetime.timezone.utc))]
2026-03-18T14:23:20.002652306Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:23:20.354844729Z [err] 2026-03-18 14:23:19.968 UTC [54266] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:23:20.354850979Z [err] 2026-03-18 14:23:19.968 UTC [54266] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:23:30.343348431Z [err] 2026-03-18 14:23:30.103 UTC [54267] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:23:30.343354951Z [err] 2026-03-18 14:23:30.103 UTC [54267] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:23:40.014576448Z [inf] 2026-03-18 14:23:30,115 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:23:40.014581701Z [inf] 2026-03-18 14:23:30,130 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:23:40.014589933Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:23:40.014595420Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:23:40.014600405Z [inf] [parameters: (UUID('60412b47-e088-4b3e-8bbf-3a591c5bccf2'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 23, 29, 997335, tzinfo=datetime.timezone.utc))]
2026-03-18T14:23:40.014604662Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:23:40.430177034Z [inf] 2026-03-18 14:23:40,265 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:23:40.430183746Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:23:40.430189630Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:23:40.430194665Z [inf] [parameters: (UUID('fc791d07-ac8a-42e1-9ac7-d15411e7ccfd'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 23, 40, 131645, tzinfo=datetime.timezone.utc))]
2026-03-18T14:23:40.430199892Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:23:40.430284862Z [inf] 2026-03-18 14:23:40,252 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:23:50.396682591Z [err] 2026-03-18 14:23:50.393 UTC [54270] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:23:50.396688001Z [err] 2026-03-18 14:23:50.393 UTC [54270] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:24:00.157565671Z [inf] 2026-03-18 14:23:50,404 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:00.157573890Z [inf] 2026-03-18 14:23:50,425 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:24:00.157579184Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:24:00.157584446Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:24:00.157589488Z [inf] [parameters: (UUID('9f65267a-ad5b-485f-a374-f2efa59e37cb'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 23, 50, 267470, tzinfo=datetime.timezone.utc))]
2026-03-18T14:24:00.157596302Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:24:00.572777052Z [inf] 2026-03-18 14:24:00,553 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:00.580703808Z [inf] 2026-03-18 14:24:00,575 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:24:00.580710339Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:24:00.580714983Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:24:00.580719613Z [inf] [parameters: (UUID('0fc4e393-5eac-4a80-bf25-fb78221e43e7'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 24, 0, 424886, tzinfo=datetime.timezone.utc))]
2026-03-18T14:24:00.580733681Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:24:10.031067600Z [err] 2026-03-18 14:24:00.541 UTC [54271] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:24:10.031070100Z [err] 2026-03-18 14:24:00.541 UTC [54271] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:24:10.719957821Z [err] 2026-03-18 14:24:10.696 UTC [54272] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:24:10.719967051Z [err] 2026-03-18 14:24:10.696 UTC [54272] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:24:20.606456814Z [inf] [parameters: (UUID('0dc304b6-194d-40a5-8141-edf1ebb0bc59'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 24, 10, 576068, tzinfo=datetime.timezone.utc))]
2026-03-18T14:24:20.606467880Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:24:20.606484214Z [inf] 2026-03-18 14:24:10,728 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:24:20.606492548Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:24:20.606499252Z [inf] 2026-03-18 14:24:10,707 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:20.606502916Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:24:20.857924156Z [inf] 2026-03-18 14:24:20,857 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:20.875277172Z [inf] 2026-03-18 14:24:20,872 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:24:20.875282294Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:24:20.875287115Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:24:20.875294676Z [inf] [parameters: (UUID('12a73175-abcf-430a-ab99-8ede6bddf6bb'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 24, 20, 728467, tzinfo=datetime.timezone.utc))]
2026-03-18T14:24:20.875300476Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:24:30.702041109Z [err] 2026-03-18 14:24:20.845 UTC [54273] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:24:30.702048388Z [err] 2026-03-18 14:24:20.845 UTC [54273] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:24:31.006561396Z [err] 2026-03-18 14:24:31.002 UTC [54274] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:24:31.006567076Z [err] 2026-03-18 14:24:31.002 UTC [54274] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:24:40.887791994Z [inf] 2026-03-18 14:24:31,011 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:40.887796027Z [inf] 2026-03-18 14:24:31,030 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:24:40.887799545Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:24:40.887804034Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:24:40.887807591Z [inf] [parameters: (UUID('dc2e25c7-dbae-457c-85fb-7284a79f6ad7'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 24, 30, 873197, tzinfo=datetime.timezone.utc))]
2026-03-18T14:24:40.887811214Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:24:41.162024031Z [inf] 2026-03-18 14:24:41,160 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:41.176635221Z [inf] 2026-03-18 14:24:41,175 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:24:41.176641255Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:24:41.176644725Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:24:41.176648680Z [inf] [parameters: (UUID('01d4b0f8-57d7-413d-a8f7-7afa3fc99842'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 24, 41, 31748, tzinfo=datetime.timezone.utc))]
2026-03-18T14:24:41.176652422Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:24:51.006723698Z [err] 2026-03-18 14:24:41.147 UTC [54276] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:24:51.006729828Z [err] 2026-03-18 14:24:41.147 UTC [54276] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:24:51.559502221Z [err] 2026-03-18 14:24:51.292 UTC [54277] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:24:51.559507280Z [err] 2026-03-18 14:24:51.292 UTC [54277] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:25:01.180459418Z [inf] 2026-03-18 14:24:51,304 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:25:01.180467244Z [inf] 2026-03-18 14:24:51,321 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:25:01.180472823Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:25:01.180478353Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:25:01.180483182Z [inf] [parameters: (UUID('044e5d76-d02b-4d14-b080-f0a56301b73c'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 24, 51, 175539, tzinfo=datetime.timezone.utc))]
2026-03-18T14:25:01.180487888Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:25:01.771946949Z [inf] 2026-03-18 14:25:01,447 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:25:01.771953608Z [inf] 2026-03-18 14:25:01,462 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:25:01.771961468Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:25:01.771969954Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:25:01.771977797Z [inf] [parameters: (UUID('34704bbc-1db9-4dcf-8754-23c93a4a59c5'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 25, 1, 321327, tzinfo=datetime.timezone.utc))]
2026-03-18T14:25:01.771984486Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:25:10.916749804Z [inf] Starting Container
2026-03-18T14:25:11.193287543Z [err] 2026-03-18 14:25:01.434 UTC [54278] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:25:11.193363981Z [err] 2026-03-18 14:25:01.434 UTC [54278] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:25:11.623222324Z [err] 2026-03-18 14:25:11.577 UTC [54279] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:25:11.623227294Z [err] 2026-03-18 14:25:11.577 UTC [54279] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:25:13.358611759Z [err] INFO: Started server process [1]
2026-03-18T14:25:13.358615245Z [inf] 2026-03-18 14:25:13,090 - src.api.main - INFO - Database initialized
2026-03-18T14:25:13.358622624Z [err] INFO: Waiting for application startup.
2026-03-18T14:25:13.358630770Z [inf] 2026-03-18 14:25:12,524 - src.api.main - INFO - Starting up API...
2026-03-18T14:25:13.358639133Z [inf] 2026-03-18 14:25:12,525 - src.api.main - INFO - Environment variable validation completed
2026-03-18T14:25:13.358647089Z [inf] 2026-03-18 14:25:12,525 - src.api.main - INFO - Running in development mode
2026-03-18T14:25:13.358653999Z [inf] 2026-03-18 14:25:12,525 - src.api.main - INFO - Database initialization running in background
2026-03-18T14:25:13.358661044Z [err] INFO: Application startup complete.
2026-03-18T14:25:13.358669947Z [err] INFO: Uvicorn running on http://0.0.0.0:8080 (Press CTRL+C to quit)
2026-03-18T14:25:13.358701249Z [inf] 2026-03-18 14:25:12,369 - src.api.middleware.rate_limit - INFO - Rate limiting enabled: 100 requests per 60 seconds
2026-03-18T14:25:13.530866974Z [inf] 2026-03-18 14:25:13,528 - src.api.main - INFO - Database ready; starting background monitor
2026-03-18T14:25:13.530873695Z [inf] 2026-03-18 14:25:13,528 - src.api.services.monitor - INFO - Starting background agent monitor...
2026-03-18T14:25:13.530878388Z [inf] 2026-03-18 14:25:13,528 - src.api.services.self_healer - INFO - Health check scheduler started
2026-03-18T14:25:13.530883113Z [inf] 2026-03-18 14:25:13,528 - src.api.services.self_healer - INFO - Self-healing service started
2026-03-18T14:25:13.530887732Z [inf] 2026-03-18 14:25:13,528 - src.api.services.self_healer - INFO - Registered recovery handler for restart
2026-03-18T14:25:13.530891851Z [inf] 2026-03-18 14:25:13,528 - src.api.services.self_healer - INFO - Registered recovery handler for rollback
2026-03-18T14:25:13.755833206Z [inf] 2026-03-18 14:25:13,753 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:25:13.793813065Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:25:13.793822399Z [inf] [parameters: (UUID('fe196b05-faf8-49c1-b5c7-0089f456c694'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 25, 13, 529025, tzinfo=datetime.timezone.utc))]
2026-03-18T14:25:13.793828332Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:25:13.793984687Z [inf] 2026-03-18 14:25:13,791 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:25:13.793990321Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:25:19.421851748Z [inf] Stopping Container
2026-03-18T14:25:21.483214131Z [inf] 2026-03-18 14:25:11,589 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:25:21.483229925Z [inf] 2026-03-18 14:25:11,607 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:25:21.483239854Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:25:21.483246373Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:25:21.483251724Z [inf] [parameters: (UUID('7db49892-bcd4-4746-948d-bbe754e1bf3e'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 25, 11, 462942, tzinfo=datetime.timezone.utc))]
2026-03-18T14:25:21.483258109Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:25:21.483269014Z [err] INFO: Shutting down
2026-03-18T14:25:21.483274791Z [err] INFO: Waiting for application shutdown.
2026-03-18T14:25:21.483284262Z [inf] 2026-03-18 14:25:18,723 - src.api.services.monitor - INFO - Background agent monitor cancellation requested
2026-03-18T14:25:21.483290575Z [inf] 2026-03-18 14:25:18,723 - src.api.services.self_healer - INFO - Health check scheduler stopped
2026-03-18T14:25:21.483297660Z [inf] 2026-03-18 14:25:18,723 - src.api.services.self_healer - INFO - Self-healing service stopped
2026-03-18T14:25:21.483302500Z [err] INFO: Application shutdown complete.
2026-03-18T14:25:21.483308471Z [err] INFO: Finished server process [1]
2026-03-18T14:25:33.761291509Z [err] 2026-03-18 14:25:23.966 UTC [54282] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:25:33.761295569Z [err] 2026-03-18 14:25:23.966 UTC [54282] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:25:33.780527614Z [inf] [parameters: (UUID('d161631e-2c57-4d08-98e2-653fb9a97f83'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 25, 23, 792011, tzinfo=datetime.timezone.utc))]
2026-03-18T14:25:33.780540648Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:25:33.780627440Z [inf] 2026-03-18 14:25:23,972 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:25:33.780633817Z [inf] 2026-03-18 14:25:23,998 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:25:33.780647198Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:25:33.780654733Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:25:34.149271709Z [err] 2026-03-18 14:25:34.138 UTC [54283] ERROR: column "meta_data" of relation "agent_logs" does not exist at character 67
2026-03-18T14:25:34.149284248Z [err] 2026-03-18 14:25:34.138 UTC [54283] STATEMENT: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)
2026-03-18T14:25:34.150612504Z [inf] 2026-03-18 14:25:34,142 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:25:34.177331606Z [inf] 2026-03-18 14:25:34,171 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:25:34.177339680Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:25:34.177346375Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:25:34.177351685Z [inf] [parameters: (UUID('41085f97-edbe-4ec1-be88-c367df80f96c'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 25, 33, 998843, tzinfo=datetime.timezone.utc))]
2026-03-18T14:25:34.177356676Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)



2026-03-18T14:21:55.445344065Z [inf] Starting Container
2026-03-18T14:21:57.973187229Z [inf] 2026-03-18 14:21:57,501 - src.api.middleware.rate_limit - INFO - Rate limiting enabled: 100 requests per 60 seconds
2026-03-18T14:21:57.973196142Z [err] INFO: Started server process [1]
2026-03-18T14:21:57.973203909Z [err] INFO: Waiting for application startup.
2026-03-18T14:21:57.973210805Z [inf] 2026-03-18 14:21:57,635 - src.api.main - INFO - Starting up API...
2026-03-18T14:21:57.973219302Z [inf] 2026-03-18 14:21:57,636 - src.api.main - INFO - Environment variable validation completed
2026-03-18T14:21:57.973225564Z [inf] 2026-03-18 14:21:57,636 - src.api.main - INFO - Running in development mode
2026-03-18T14:21:57.973231618Z [inf] 2026-03-18 14:21:57,636 - src.api.main - INFO - Database initialization running in background
2026-03-18T14:21:57.973250404Z [err] INFO: Application startup complete.
2026-03-18T14:21:57.973256560Z [err] INFO: Uvicorn running on http://0.0.0.0:8080 (Press CTRL+C to quit)
2026-03-18T14:21:57.973261867Z [inf] 2026-03-18 14:21:57,925 - src.api.main - INFO - Database initialized
2026-03-18T14:21:58.647859225Z [inf] 2026-03-18 14:21:58,638 - src.api.main - INFO - Database ready; starting background monitor
2026-03-18T14:21:58.647863596Z [inf] 2026-03-18 14:21:58,639 - src.api.services.monitor - INFO - Starting background agent monitor...
2026-03-18T14:21:58.647869828Z [inf] 2026-03-18 14:21:58,639 - src.api.services.self_healer - INFO - Health check scheduler started
2026-03-18T14:21:58.647875648Z [inf] 2026-03-18 14:21:58,639 - src.api.services.self_healer - INFO - Self-healing service started
2026-03-18T14:21:58.647880694Z [inf] 2026-03-18 14:21:58,639 - src.api.services.self_healer - INFO - Registered recovery handler for restart
2026-03-18T14:21:58.647884563Z [inf] 2026-03-18 14:21:58,639 - src.api.services.self_healer - INFO - Registered recovery handler for rollback
2026-03-18T14:21:59.008429738Z [inf] 2026-03-18 14:21:58,815 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:21:59.008437751Z [inf] 2026-03-18 14:21:58,833 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:21:59.008445155Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:21:59.008451903Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:21:59.008458703Z [inf] [parameters: (UUID('193c9fa6-28ea-41fc-91ce-82ff0772da50'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 21, 58, 639404, tzinfo=datetime.timezone.utc))]
2026-03-18T14:21:59.008465749Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:22:18.709962177Z [inf] 2026-03-18 14:22:08,967 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:18.709966188Z [inf] 2026-03-18 14:22:08,985 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:18.709969952Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:18.709974339Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:18.709978285Z [inf] [parameters: (UUID('2f6b448b-1a6f-49a8-bc66-7a3b079ae4ba'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 22, 8, 833512, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:18.709983114Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:22:19.205597125Z [inf] 2026-03-18 14:22:19,114 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:19.205604013Z [inf] 2026-03-18 14:22:19,133 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:19.205610647Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:19.205616819Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:19.205624665Z [inf] [parameters: (UUID('34cb9d65-0e82-4382-bae3-f2e9d9fe229e'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 22, 18, 987246, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:19.205631595Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:22:38.867970214Z [inf] 2026-03-18 14:22:29,272 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:38.867978904Z [inf] 2026-03-18 14:22:29,291 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:38.867985046Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:38.867990159Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:38.867994894Z [inf] [parameters: (UUID('1ae76a28-8e25-4ad0-a835-721ae8df130a'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 22, 29, 134379, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:38.867999427Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:22:39.425850201Z [inf] 2026-03-18 14:22:39,420 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:39.438257407Z [inf] 2026-03-18 14:22:39,435 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:39.438262717Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:39.438268823Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:39.438272983Z [inf] [parameters: (UUID('e20b1faf-c437-4297-a1c1-9d75631da225'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 22, 39, 292243, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:39.438278275Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:22:59.440850684Z [inf] 2026-03-18 14:22:49,566 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:59.440855242Z [inf] 2026-03-18 14:22:49,582 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:59.440860506Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:59.440866982Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:59.440871398Z [inf] [parameters: (UUID('a2b7d3a3-ba75-4fc7-a835-23fc670d90bf'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 22, 49, 436567, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:59.440875823Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:22:59.707160120Z [inf] 2026-03-18 14:22:59,706 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:22:59.733508340Z [inf] 2026-03-18 14:22:59,723 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:22:59.733511825Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:22:59.733515164Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:22:59.733518756Z [inf] [parameters: (UUID('e2fd175a-c3af-49f1-a19d-2e016f0c0308'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 22, 59, 582728, tzinfo=datetime.timezone.utc))]
2026-03-18T14:22:59.733522747Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:23:19.736743921Z [inf] 2026-03-18 14:23:09,843 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:23:19.736750006Z [inf] 2026-03-18 14:23:09,860 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:23:19.736753873Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:23:19.736757692Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:23:19.736761290Z [inf] [parameters: (UUID('3e583acc-6bb4-46eb-be3a-317444d73b6e'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 23, 9, 723803, tzinfo=datetime.timezone.utc))]
2026-03-18T14:23:19.736764883Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:23:19.985818572Z [inf] 2026-03-18 14:23:19,980 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:23:20.002627016Z [inf] 2026-03-18 14:23:19,996 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:23:20.002633861Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:23:20.002640032Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:23:20.002646173Z [inf] [parameters: (UUID('e0d5def4-c391-4302-8a7d-76d97bbe8c99'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 23, 19, 861569, tzinfo=datetime.timezone.utc))]
2026-03-18T14:23:20.002652306Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:23:40.014576448Z [inf] 2026-03-18 14:23:30,115 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:23:40.014581701Z [inf] 2026-03-18 14:23:30,130 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:23:40.014589933Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:23:40.014595420Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:23:40.014600405Z [inf] [parameters: (UUID('60412b47-e088-4b3e-8bbf-3a591c5bccf2'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 23, 29, 997335, tzinfo=datetime.timezone.utc))]
2026-03-18T14:23:40.014604662Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:23:40.430177034Z [inf] 2026-03-18 14:23:40,265 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:23:40.430183746Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:23:40.430189630Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:23:40.430194665Z [inf] [parameters: (UUID('fc791d07-ac8a-42e1-9ac7-d15411e7ccfd'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 23, 40, 131645, tzinfo=datetime.timezone.utc))]
2026-03-18T14:23:40.430199892Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:23:40.430284862Z [inf] 2026-03-18 14:23:40,252 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:00.157565671Z [inf] 2026-03-18 14:23:50,404 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:00.157573890Z [inf] 2026-03-18 14:23:50,425 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:24:00.157579184Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:24:00.157584446Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:24:00.157589488Z [inf] [parameters: (UUID('9f65267a-ad5b-485f-a374-f2efa59e37cb'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 23, 50, 267470, tzinfo=datetime.timezone.utc))]
2026-03-18T14:24:00.157596302Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:24:00.572777052Z [inf] 2026-03-18 14:24:00,553 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:00.580703808Z [inf] 2026-03-18 14:24:00,575 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:24:00.580710339Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:24:00.580714983Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:24:00.580719613Z [inf] [parameters: (UUID('0fc4e393-5eac-4a80-bf25-fb78221e43e7'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 24, 0, 424886, tzinfo=datetime.timezone.utc))]
2026-03-18T14:24:00.580733681Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:24:20.606456814Z [inf] [parameters: (UUID('0dc304b6-194d-40a5-8141-edf1ebb0bc59'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 24, 10, 576068, tzinfo=datetime.timezone.utc))]
2026-03-18T14:24:20.606467880Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:24:20.606484214Z [inf] 2026-03-18 14:24:10,728 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:24:20.606492548Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:24:20.606499252Z [inf] 2026-03-18 14:24:10,707 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:20.606502916Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:24:20.857924156Z [inf] 2026-03-18 14:24:20,857 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:20.875277172Z [inf] 2026-03-18 14:24:20,872 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:24:20.875282294Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:24:20.875287115Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:24:20.875294676Z [inf] [parameters: (UUID('12a73175-abcf-430a-ab99-8ede6bddf6bb'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 24, 20, 728467, tzinfo=datetime.timezone.utc))]
2026-03-18T14:24:20.875300476Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:24:40.887791994Z [inf] 2026-03-18 14:24:31,011 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:40.887796027Z [inf] 2026-03-18 14:24:31,030 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:24:40.887799545Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:24:40.887804034Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:24:40.887807591Z [inf] [parameters: (UUID('dc2e25c7-dbae-457c-85fb-7284a79f6ad7'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 24, 30, 873197, tzinfo=datetime.timezone.utc))]
2026-03-18T14:24:40.887811214Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:24:41.162024031Z [inf] 2026-03-18 14:24:41,160 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:24:41.176635221Z [inf] 2026-03-18 14:24:41,175 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:24:41.176641255Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:24:41.176644725Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:24:41.176648680Z [inf] [parameters: (UUID('01d4b0f8-57d7-413d-a8f7-7afa3fc99842'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 24, 41, 31748, tzinfo=datetime.timezone.utc))]
2026-03-18T14:24:41.176652422Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:25:01.180459418Z [inf] 2026-03-18 14:24:51,304 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:25:01.180467244Z [inf] 2026-03-18 14:24:51,321 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:25:01.180472823Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:25:01.180478353Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:25:01.180483182Z [inf] [parameters: (UUID('044e5d76-d02b-4d14-b080-f0a56301b73c'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 24, 51, 175539, tzinfo=datetime.timezone.utc))]
2026-03-18T14:25:01.180487888Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:25:01.771946949Z [inf] 2026-03-18 14:25:01,447 - src.api.services.monitoring - WARNING - Monitor: Agent test-agent (6e5834d6-60f8-4336-83fd-1913399fdaa7) is STALE. Marking as FAILED.
2026-03-18T14:25:01.771953608Z [inf] 2026-03-18 14:25:01,462 - src.api.services.monitor - ERROR - Error in background monitor: (raised as a result of Query-invoked autoflush; consider using a session.no_autoflush block if this flush is occurring prematurely)
2026-03-18T14:25:01.771961468Z [inf] (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.UndefinedColumnError'>: column "meta_data" of relation "agent_logs" does not exist
2026-03-18T14:25:01.771969954Z [inf] [SQL: INSERT INTO agent_logs (id, agent_id, level, message, extra_data, meta_data, timestamp) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR, $6::VARCHAR, $7::TIMESTAMP WITH TIME ZONE)]
2026-03-18T14:25:01.771977797Z [inf] [parameters: (UUID('34704bbc-1db9-4dcf-8754-23c93a4a59c5'), UUID('6e5834d6-60f8-4336-83fd-1913399fdaa7'), 'error', 'System: Agent marked as FAILED due to heartbeat timeout (120s).', None, None, datetime.datetime(2026, 3, 18, 14, 25, 1, 321327, tzinfo=datetime.timezone.utc))]
2026-03-18T14:25:01.771984486Z [inf] (Background on this error at: https://sqlalche.me/e/20/f405)
2026-03-18T14:25:19.421851748Z [inf] Stopping Container
user: Pre-compaction memory flush. Store durable memories only in memory/2026-03-18.md (create memory/ if needed). Treat workspace bootstrap/reference files such as MEMORY.md, SOUL.md, TOOLS.md, and AGENTS.md as read-only during this flush; never overwrite, replace, or edit them. If memory/2026-03-18.md already exists, APPEND new content only and do not overwrite existing entries. Do NOT create timestamped variant files (e.g., 2026-03-18-HHMM.md); always use the canonical 2026-03-18.md filename. If nothing to store, reply with NO_REPLY.
Current time: Wednesday, March 18th, 2026 — 6:25 PM (Europe/Rome) / 2026-03-18 17:25 UTC
assistant: NO_REPLY
user: Sender (untrusted metadata):
```json
{
  "label": "openclaw-control-ui",
  "id": "openclaw-control-ui"
}
```

[Wed 2026-03-18 18:25 GMT+1] yo
assistant: [[reply_to_current]] yo
