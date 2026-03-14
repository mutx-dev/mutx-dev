import postgres from 'postgres'

// Railway provides the complete DATABASE_URL in the environment
const sql = process.env.DATABASE_URL
  ? postgres(process.env.DATABASE_URL)
  : null

export default sql
