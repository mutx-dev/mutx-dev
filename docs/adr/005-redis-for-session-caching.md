# ADR 005: Redis for Session Storage and Caching

## Status
Accepted

## Date
2024-03-15

## Context
We need a fast, in-memory data store for session management, caching, and message queuing.

## Decision
Use Redis for:
- Session storage (WebSocket connections, user sessions)
- API response caching
- Message queue (Celery/Broker)
- Rate limiting counters

## Consequences

### Positive
- **High performance**: In-memory with optional persistence
- **Rich data structures**: Sets, lists, sorted sets for queues
- **Pub/Sub**: Real-time messaging support
- **TTL support**: Automatic expiration for sessions/caches

### Negative
- **Memory limitations**: Must size appropriately for workload
- **Persistence trade-offs**: AOF vs RDB involves performance vs durability

## Alternatives Considered
- **Memcached**: Rejected - no persistence, limited data structures
- **DynamoDB**: Rejected - higher latency, cost for high-traffic sessions
- **In-memory only**: Rejected - no persistence on restart

## References
- [Redis Documentation](https://redis.io/docs/)
