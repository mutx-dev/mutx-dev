# ADR 004: Next.js for Dashboard and Web Applications

## Status
Accepted

## Date
2024-03-01

## Context
We need a modern, performant frontend for the operator dashboard and web applications.

## Decision
Use Next.js (React) for all web-facing applications:
- Operator dashboard (app.mutx.dev)
- Public marketing site (mutx.dev)
- Documentation site (docs.mutx.dev)

## Consequences

### Positive
- **SSR/SSG**: Excellent SEO and initial load performance
- **React ecosystem**: Large component library availability
- **Vercel integration**: Seamless deployment to edge
- **API routes**: Backend-for-frontend pattern for API aggregation

### Negative
- **Complexity**: Higher learning curve than plain React
- **Serverless limits**: Cold start times on Vercel

## Alternatives Considered
- **Plain React + Vite**: Rejected - no SSR limits SEO
- **Remix**: Rejected - smaller ecosystem
- **Nuxt**: Rejected - prefer React for team familiarity

## References
- [Next.js Documentation](https://nextjs.org/docs)
