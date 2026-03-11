import postgres from 'postgres'

// Railway's internal network (postgres.railway.internal) rejects SSL upgrade attempts.
// We must explicitly disable SSL for the connection to succeed over the private network.
const sql = process.env.DATABASE_URL
  ? postgres(process.env.DATABASE_URL, { ssl: false })
  : null

export default sql

