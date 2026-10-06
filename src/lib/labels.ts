import type { Area, BookingStatus, Channel, HotelTag, PaymentMethod, PaymentStatus } from './types'
import type { Tone } from '@/components/ui'

export const AREA_LABEL: Record<Area | 'phu-quoc', string> = { 'phu-quoc': 'Toàn đảo Phú Quốc', 'bac-dao': 'Bắc đảo', 'trung-tam': 'Trung tâm', 'nam-dao': 'Nam đảo' }
export const TAG_LABEL: Record<HotelTag, string> = { 'gan-bien': 'Gần biển', 'ho-boi': 'Hồ bơi', 'kids-club': 'Kids Club', spa: 'Spa', 'an-sang': 'Có ăn sáng', 'huy-mien-phi': 'Huỷ miễn phí' }

export const STATUS: Record<BookingStatus, [string, Tone]> = {
  new: ['Mới', 'info'], confirmed: ['Đã xác nhận', 'brand'], checked_in: ['Đã nhận phòng', 'ok'],
  finished: ['Hoàn tất', 'neutral'], cancelled: ['Đã huỷ', 'danger'], no_show: ['No-show', 'warn'],
}
export const PAYMENT: Record<PaymentStatus, [string, Tone]> = {
  paid: ['Đã trả', 'ok'], deposit: ['Đặt cọc', 'info'], credit: ['Công nợ', 'warn'], unpaid: ['Chưa trả', 'danger'],
}
export const CHANNEL: Record<Channel, [string, Tone]> = {
  website: ['Website', 'brand'], offline: ['Nhân viên', 'neutral'], agent: ['Đại lý', 'warn'], ota: ['OTA', 'info'],
}
export const METHOD: Record<PaymentMethod, string> = {
  card: 'Thẻ quốc tế', qr: 'QR / VNPay', transfer: 'Chuyển khoản', cash: 'Tiền mặt', ota: 'OTA thu hộ', credit: 'Công nợ',
}
export const CHANNEL_COLOR: Record<Channel, string> = { website: '#23806f', offline: '#7fb8ad', agent: '#d9822b', ota: '#3b6fb6' }
