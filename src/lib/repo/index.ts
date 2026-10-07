// Cửa duy nhất để UI lấy dữ liệu. Component KHÔNG import src/data trực tiếp.
//
// Khi Gohost mở API: viết `api.ts` export object cùng kiểu `Repo`. Phòng trống + giá gọi backend Rooty
// (backend giữ API key, cache, rate limit 60 req/5 phút, tính lại giá); nội dung khách sạn lấy từ CMS của Rooty
// vì Gohost API không có ảnh, mô tả, tiện ích, chính sách. Rồi đổi dòng dưới.
import { mockRepo } from './mock'

export type Repo = typeof mockRepo
export const repo: Repo = mockRepo

export type { PlanOffer, RoomOffer } from './mock'
