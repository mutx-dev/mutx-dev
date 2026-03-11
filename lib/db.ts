import postgres from 'postgres'

const sql = process.env.DATABASE_URL
  ? postgres(process.env.DATABASE_URL, {
      ssl: { rejectUnauthorized: false },
    })
  : null

export default sql

