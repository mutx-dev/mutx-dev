import postgres from 'postgres'

// Railway provides the complete DATABASE_URL in the environment
// We are forcing ssl off entirely to avoid TLS handshakes over the internal proxy.
const sql = process.env.DATABASE_URL
  ? postgres(process.env.DATABASE_URL + '?sslmode=disable', {
      ssl: false,
    })
  : null

export default sql

