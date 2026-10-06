// Cửa duy nhất để UI lấy dữ liệu. Component KHÔNG import src/data trực tiếp.
//
// Khi Gohost mở API dùng thử: viết `api.ts` export một object cùng kiểu `Repo`, gọi backend Rooty
// (backend giữ API key, cache, rate limit 60 req/5 phút, tính lại giá, map ID) rồi đổi dòng dưới.
// Hàm nào ngoài đời do Gohost / TourWell / Rooty đảm nhận: xem README §"Ánh xạ field → Gohost".
import { mockRepo } from './mock'

export type Repo = typeof mockRepo
export const repo: Repo = mockRepo

export type { SearchQuery, HotelResult, RoomOffer, PlanOffer, BookingView, BookingFilter, CreateBookingInput, AgentBookingInput, QuoteInput } from './mock'
