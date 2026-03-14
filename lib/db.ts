import postgres from 'postgres'

// Use DATABASE_URL as provided so SSL/TLS behavior is controlled by connection settings.
const sql = process.env.DATABASE_URL
  ? postgres(process.env.DATABASE_URL)
  : null

export default sql
