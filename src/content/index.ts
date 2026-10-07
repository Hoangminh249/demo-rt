// Nội dung của Rooty (Gohost API không có ảnh, mô tả, chính sách, bản dịch). Chỉ src/lib/repo được import thư mục này.
// Thêm khách sạn = thêm 1 file + 1 dòng trong HOTELS.
import type { HotelContent, SiteContent } from '@/lib/types'
import { CALISTA } from './calista'
import { PITO } from './pito-hon-thom'

export const HOTELS: HotelContent[] = [PITO, CALISTA]

// Kênh đặt phòng của khách sạn (PDF thông tin lưu trú). Chủ website: thông tin trên footer rootytrip.com (07/10/2026).
export const SITE: SiteContent = {
  phone: '+84915919328',
  phone_display: '(+84) 915 919 328',
  zalo: 'https://zalo.me/0915919328',
  email: 'sales@rootyhospitality.com',
  owner: {
    name: 'Công ty Cổ phần Rooty Trip Phú Quốc',
    id: '1702144879',
    address: { vi: '191 Trần Hưng Đạo, Khu phố Cửa Lấp, Đặc khu Phú Quốc, An Giang', en: '191 Tran Hung Dao, Cua Lap Quarter, Phu Quoc Special Zone, An Giang' },
  },
}
