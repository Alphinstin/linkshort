import { Pool } from 'pg';

// A single shared pool for the whole app. In a container/cloud setup
// these values come from environment variables — never hardcode
// credentials here.
export const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/linkshort',
});
