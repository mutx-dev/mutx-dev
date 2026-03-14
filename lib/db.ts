import postgres from 'postgres'

// Railway provides the complete DATABASE_URL in the environment.
// Keep TLS enabled so certificate validation is enforced by default.
const sql = process.env.DATABASE_URL
  ? postgres(process.env.DATABASE_URL)
  : null

export default sql
