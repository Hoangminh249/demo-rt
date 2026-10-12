// Nhật ký thao tác admin (AuditLog). Người thao tác gắn một lần ở đầu lệnh ghi (withActor) rồi mọi audit() bên trong tự lấy —
// không phải truyền userId qua từng hàm. Chỉ server.
import { AsyncLocalStorage } from 'node:async_hooks'
import type { Prisma } from '@/generated/prisma/client'

const actor = new AsyncLocalStorage<string | null>()

/** Chạy `fn` với người thao tác = userId (null = tài khoản env / hệ thống). */
export const withActor = <T>(userId: string | null, fn: () => Promise<T>) => actor.run(userId, fn)

export const audit = (tx: Prisma.TransactionClient, action: string, entity: string, entityId: string, after: unknown, before?: unknown) =>
  tx.auditLog.create({
    data: {
      userId: actor.getStore() ?? null, action, entity, entityId,
      after: after as Prisma.InputJsonValue,
      before: before === undefined ? undefined : (before as Prisma.InputJsonValue),
    },
  })
