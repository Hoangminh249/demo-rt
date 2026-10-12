// Kiểm DB đích trước khi migrate — CHỈ ĐỌC (phiên đặt read-only). Chạy: yarn db:check
// In: host, database, user, phiên bản Postgres, schema đích (?schema= trên URL, mặc định public) đã có chưa, rỗng không,
// quyền tạo, và các schema khác trong database (database dùng chung với dự án khác thì KHÔNG đụng tới chúng).
import { Client } from 'pg'
import { schemaOf } from '../src/lib/pg'

try { process.loadEnvFile() } catch {}

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('Thiếu DATABASE_URL (đặt trong .env hoặc biến môi trường).')
  const schema = schemaOf(url)
  const u = new URL(url)
  if (u.password) u.password = '****'
  console.log('DATABASE_URL:', u.toString())

  const client = new Client({ connectionString: url })
  try {
    await client.connect()
    await client.query('SET SESSION CHARACTERISTICS AS TRANSACTION READ ONLY')
    const { rows: [info] } = await client.query<{ host: string | null; db: string; usr: string; version: string; can_create_schema: boolean }>(`
      SELECT inet_server_addr()::text AS host, current_database() AS db, current_user AS usr,
             current_setting('server_version') AS version,
             has_database_privilege(current_user, current_database(), 'CREATE') AS can_create_schema`)
    const { rows: schemas } = await client.query<{ nspname: string }>(
      `SELECT nspname FROM pg_namespace WHERE nspname NOT LIKE 'pg\\_%' AND nspname <> 'information_schema' ORDER BY 1`)
    const exists = schemas.some(s => s.nspname === schema)
    const { rows: tables } = await client.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = $1 AND table_name <> '_prisma_migrations' ORDER BY 1`, [schema])
    const { rows: [mig] } = await client.query<{ n: string | null }>(`SELECT to_regclass($1)::text AS n`, [`"${schema}"._prisma_migrations`])
    const priv = exists
      ? (await client.query<{ c: boolean }>(`SELECT has_schema_privilege(current_user, $1, 'CREATE') AS c`, [schema])).rows[0]
      : { c: info.can_create_schema }

    console.log('Host (server):  ', info.host ?? '(unix socket)', '· URL host:', u.hostname)
    console.log('Database:       ', info.db)
    console.log('current_user:   ', info.usr)
    console.log('Postgres:       ', info.version)
    console.log('Schema trong DB:', schemas.map(s => s.nspname).join(', '))
    console.log('Schema đích:    ', schema, exists ? '(đã có)' : '(chưa có — migrate sẽ tạo)')
    console.log('Quyền tạo:      ', priv.c ? 'CÓ' : exists ? `KHÔNG — cần GRANT CREATE ON SCHEMA ${schema}` : 'KHÔNG — cần quyền CREATE trên database để tạo schema')
    console.log('_prisma_migrations:', mig.n ? 'có' : 'chưa có')
    console.log('Bảng trong schema đích:', tables.length ? `${tables.length} — ${tables.map(t => t.table_name).join(', ')}` : '0 (rỗng)')
    if (tables.length && !mig.n) console.log(`⚠ Schema ${schema} KHÔNG rỗng và không phải do Prisma tạo — DỪNG, hỏi trước khi migrate.`)
  } finally {
    await client.end().catch(() => {})
  }
}

main().catch(e => {
  console.error('Lỗi:', e instanceof Error ? e.message : e)
  console.error('Kiểm: host/port, sslmode (?sslmode=require), firewall/IP allowlist, user/password, tên database.')
  process.exitCode = 1
})
