import postgres from 'postgres'

// Railway provides the complete DATABASE_URL in the environment.
// Keep TLS enabled with certificate validation (do not disable sslmode or verification).
const sql = process.env.DATABASE_URL
  ? postgres(process.env.DATABASE_URL)
  : null

export default sql
