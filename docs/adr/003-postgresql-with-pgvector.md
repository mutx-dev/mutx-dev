# ADR 003: PostgreSQL with pgvector for Vector Storage

## Status
Accepted

## Date
2024-02-15

## Context
Mutx needs to store and query vector embeddings for agent memory and semantic search capabilities.

## Decision
Use PostgreSQL with the pgvector extension for all data storage including:
- Structured metadata (agents, deployments, users)
- Vector embeddings for semantic search
- Time-series data for agent logs

## Consequences

### Positive
- **Single database**: Simplified operational overhead
- **Vector support**: pgvector provides efficient similarity search
- **Mature**: PostgreSQL is well-understood and stable
- **ACID compliant**: Strong consistency guarantees

### Negative
- **Vector performance**: Not as optimized as dedicated vector DBs (Pinecone, Weaviate)
- **Scaling**: Vertical scaling limits vs. distributed vector databases

## Alternatives Considered
- **Pinecone**: Rejected - added cost and vendor lock-in
- **Weaviate**: Rejected - operational complexity
- **Elasticsearch**: Rejected - overkill for our use case

## References
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
