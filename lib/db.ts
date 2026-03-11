import postgres from 'postgres'

// Railway provides the complete DATABASE_URL in the environment
// We need to disable SSL rejection to allow the connection over the proxy.
const sql = process.env.DATABASE_URL
  ? postgres(process.env.DATABASE_URL, {
      ssl: { rejectUnauthorized: false },
    })
  : null

export default sql

