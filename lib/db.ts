import postgres from 'postgres'

// Railway provides the complete DATABASE_URL in the environment
const sql = process.env.DATABASE_URL
  ? postgres(process.env.DATABASE_URL)
  : null

export default sql

// Additional exports needed by gnap-sync / task-dispatch
export { default as sql }
export const db_helpers = { timestamptz: (col: string) => col }
export function getDatabase() { return sql }
