// Request của luồng đặt phòng thật (/api/bookings/*): zod kiểm ở server, hook trình duyệt dùng chung kiểu.
import { z } from 'zod'
import { MAX_ROOMS_PER_BOOKING } from './booking-rules'
import { isPhone, NOTES_MAX } from './booking'

const slug = z.string().trim().regex(/^[a-z0-9-]{1,80}$/)
const date = z.iso.date()

export const SelectionIn = z.object({
  hotel: slug,
  room: slug,
  ratePlanId: z.string().trim().min(1).max(40),
  checkin: date,
  checkout: date,
  rooms: z.int().min(1).max(MAX_ROOMS_PER_BOOKING).default(1),
  adults: z.int().min(1).max(20),
  childAges: z.array(z.int().min(1).max(11)).max(10).default([]),
  promoCode: z.string().trim().max(40).nullish(),
})

export const HoldIn = z.object({
  selection: SelectionIn,
  contact: z.object({
    name: z.string().trim().min(1).max(120),
    phone: z.string().trim().max(30).refine(isPhone, 'Số điện thoại không hợp lệ'),
    email: z.email().max(200),
    guestName: z.string().trim().max(120).nullish(),
    specialRequests: z.string().trim().max(NOTES_MAX + 300).nullish(), // ghi chú + giờ đến + yêu cầu đã chọn
  }),
  expectedTotal: z.int().min(0),
})

export const PayIn = z.object({ mode: z.enum(['deposit', 'full']), locale: z.enum(['vi', 'en']).default('vi') })

export type SelectionInput = z.input<typeof SelectionIn>
export type HoldInput = z.input<typeof HoldIn>
export type PayInput = z.input<typeof PayIn>
