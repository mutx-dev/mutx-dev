// Compatibility shim for mutx-control db interface atop ship's postgres
import sql from './db'

export interface DbRow { [key: string]: unknown }

export const db_helpers = {
  timestamptz: (col: string) => col, // postgres handles this natively
}

export function getDatabase() {
  return sql!
}
