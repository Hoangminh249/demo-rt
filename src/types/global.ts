// Kiểu dùng chung mọi module: ngôn ngữ, chữ hai ngôn ngữ, icon, bảng thông tin.

export type Locale = 'vi' | 'en'

/** Chữ hai ngôn ngữ. Thiếu `en` thì web dùng `vi`, admin báo thiếu bản dịch. */
export interface L { vi: string; en?: string }

export type IconKey =
  | 'map-pin' | 'clock' | 'cable-car' | 'door-open' | 'plane' | 'bus' | 'ferris-wheel' | 'coffee' | 'wifi' | 'shirt'
  | 'receipt' | 'washing-machine'

/** Bảng (giá vé, chính sách trẻ em…): bản nội dung hai ngôn ngữ và bản đã chọn ngôn ngữ đưa cho UI. */
export interface InfoTableContent { caption: L; head: L[]; rows: L[][]; note?: L }
export interface InfoTable { caption: string; head: string[]; rows: string[][]; note?: string }
