// Kiểm DB đích trước khi migrate — CHỈ ĐỌC (phiên đặt read-only). Chạy: yarn db:check
// In: host, database, user, phiên bản Postgres, DB có rỗng không, quyền tạo bảng trong schema public.
import { Client } from 'pg'

try { process.loadEnvFile() } catch {}

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('Thiếu DATABASE_URL (đặt trong .env hoặc biến môi trường).')
  const u = new URL(url)
  if (u.password) u.password = '****'
  console.log('DATABASE_URL:', u.toString())

  const client = new Client({ connectionString: url })
  try {
    await client.connect()
    await client.query('SET SESSION CHARACTERISTICS AS TRANSACTION READ ONLY')
    const { rows: [info] } = await client.query<{ host: string | null; db: string; usr: string; version: string; can_create: boolean }>(`
      SELECT inet_server_addr()::text AS host, current_database() AS db, current_user AS usr,
             current_setting('server_version') AS version,
             has_schema_privilege(current_user, 'public', 'CREATE') AS can_create`)
    const { rows: tables } = await client.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name <> '_prisma_migrations' ORDER BY 1`)
    const { rows: [mig] } = await client.query<{ n: string | null }>(`SELECT to_regclass('public._prisma_migrations')::text AS n`)

    console.log('Host (server):  ', info.host ?? '(unix socket)', '· URL host:', u.hostname)
    console.log('Database:       ', info.db)
    console.log('current_user:   ', info.usr)
    console.log('Postgres:       ', info.version)
    console.log('Tạo bảng public:', info.can_create ? 'CÓ' : 'KHÔNG — cần GRANT CREATE ON SCHEMA public hoặc làm owner database')
    console.log('_prisma_migrations:', mig.n ? 'có' : 'chưa có')
    console.log('Bảng khác:      ', tables.length ? `${tables.length} — ${tables.map(t => t.table_name).join(', ')}` : '0 (rỗng)')
    if (tables.length && !mig.n) console.log('⚠ Database KHÔNG rỗng và không phải do Prisma tạo — DỪNG, hỏi trước khi migrate.')
  } finally {
    await client.end().catch(() => {})
  }
}

main().catch(e => {
  console.error('Lỗi:', e instanceof Error ? e.message : e)
  console.error('Kiểm: host/port, sslmode (?sslmode=require), firewall/IP allowlist, user/password, tên database.')
  process.exitCode = 1
})
