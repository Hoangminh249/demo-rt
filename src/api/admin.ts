// Admin → Cài đặt → Kết nối Gohost (chỉ xem): đối chiếu hạng phòng của Rooty với Gohost theo ID, để biết nhập giá từ property nào.
// Web không phụ thuộc phần này: thiếu key hoặc Gohost lỗi thì chỉ mục này báo lỗi.
import 'server-only'
import { cache } from 'react'
import { isGohostError } from '@/lib/gohost'
import type { HotelContent } from '@/types/hotel'
import type { GohostErrorCode } from '@/types/gohost'
import type { AdminHotel, ConnectState, HotelCheck } from '@/types/admin'
import { gohostApi } from './gohost'
import { catalogApi } from './catalog'

/** Danh mục Gohost (cache 1 giờ); lỗi thì trả mã lỗi, không ném. */
const readCatalog = cache(async () => {
  try {
    return { properties: await gohostApi.properties(), error: null as GohostErrorCode | null }
  } catch (e) {
    if (isGohostError(e)) return { properties: null, error: e.message }
    throw e
  }
})

async function check(h: HotelContent): Promise<HotelCheck> {
  const { properties, error } = await readCatalog()
  const property = h.gohost_tenant_id && properties ? properties.find(p => p.id === h.gohost_tenant_id) : undefined
  const state: ConnectState = !h.gohost_tenant_id ? 'none' : error || !properties ? 'unknown' : property ? 'ok' : 'missing'
  const ghRooms = state === 'ok' ? (property?.room_types ?? []) : []
  const ghIds = new Set(ghRooms.map(r => r.id))
  return {
    tenant: h.gohost_tenant_id,
    state,
    ghRooms,
    orphanContent: state === 'ok' ? h.rooms.filter(r => r.gohost_room_type_id && !ghIds.has(r.gohost_room_type_id)) : [],
    unlinkedContent: h.rooms.filter(r => !r.gohost_room_type_id),
    contentRooms: h.rooms,
  }
}

async function hotel(slug: string): Promise<AdminHotel | null> {
  const h = (await catalogApi.contents(true)).find(x => x.slug === slug)
  if (!h) return null
  const [c, { properties, error }] = await Promise.all([check(h), readCatalog()])
  // Khách sạn chưa nối: liệt kê mọi property key đọc được, kèm hạng phòng, để chọn đúng property mà chép ID.
  const options = properties?.map(p => ({ id: p.id, title: p.title, prefix: p.prefix, rooms: (p.room_types ?? []).map(r => ({ id: r.id, title: r.title, quantity: r.quantity })) }))
  return { check: c, error, properties: options ?? null }
}

export const adminApi = { hotel }
