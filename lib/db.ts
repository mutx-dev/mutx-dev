import postgres from 'postgres'

// Always require TLS for database connections, even when DATABASE_URL omits ssl params.
const sql = process.env.DATABASE_URL
  ? postgres(process.env.DATABASE_URL, {
      ssl: 'require',
    })
  : null

export default sql
