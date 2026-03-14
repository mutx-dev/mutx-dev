import postgres from 'postgres'

// Railway provides the complete DATABASE_URL in the environment
// Keep TLS enabled for in-transit encryption of database traffic.
const sql = process.env.DATABASE_URL
  ? postgres(process.env.DATABASE_URL, {
      ssl: { rejectUnauthorized: false },
    })
  : null

export default sql
