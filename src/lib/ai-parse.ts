// "AI" demo: bộ phân tích câu tiếng Việt theo luật (regex), KHÔNG gọi LLM.
// Đủ để demo câu mẫu PDF §9. Ngoài đời: thay bằng LLM + tool gọi repo (search, availability, offers).
import type { Area, HotelTag } from './types'
import { TODAY, addDays } from './format'

export interface Intent {
  checkin?: string
  checkout?: string
  adults?: number
  children?: number
  budget?: number // tổng cho cả kỳ
  budgetPerNight?: number
  tags: HotelTag[]
  oceanView?: boolean
  area?: Area
}

const WORDS: Record<string, string> = { một: '1', hai: '2', ba: '3', bốn: '4', tư: '4', năm: '5', sáu: '6' }
const pad = (n: number) => String(n).padStart(2, '0')

function toISO(d: number, m: number, y?: number, today = TODAY) {
  let year = y ?? Number(today.slice(0, 4))
  let iso = `${year}-${pad(m)}-${pad(d)}`
  if (!y && iso < today) iso = `${++year}-${pad(m)}-${pad(d)}`
  return iso
}

export function parseRequest(input: string, today = TODAY): Intent {
  let t = ` ${input.toLowerCase().normalize('NFC')} `
  for (const [w, n] of Object.entries(WORDS)) t = t.replace(new RegExp(`(?<=\\s)${w}(?=\\s+(người|trẻ|bé|đêm|cháu|con))`, 'g'), n)
  const it: Intent = { tags: [] }

  // ngày: "20–23/10", "20-23/10/2026", "từ 20 đến 23/10", "20/10 - 23/10", "20/10, 3 đêm"
  let m = t.match(/(\d{1,2})\s*\/\s*(\d{1,2})(?:\s*\/\s*(\d{4}))?\s*(?:-|–|—|đến|tới|to)\s*(\d{1,2})\s*\/\s*(\d{1,2})(?:\s*\/\s*(\d{4}))?/)
  if (m) {
    it.checkin = toISO(+m[1], +m[2], m[3] ? +m[3] : undefined, today)
    it.checkout = toISO(+m[4], +m[5], m[6] ? +m[6] : undefined, today)
  } else if ((m = t.match(/(\d{1,2})\s*(?:-|–|—|đến|tới|to)\s*(\d{1,2})\s*\/\s*(\d{1,2})(?:\s*\/\s*(\d{4}))?/))) {
    it.checkin = toISO(+m[1], +m[3], m[4] ? +m[4] : undefined, today)
    it.checkout = toISO(+m[2], +m[3], m[4] ? +m[4] : undefined, today)
  } else if ((m = t.match(/(\d{1,2})\s*\/\s*(\d{1,2})(?:\s*\/\s*(\d{4}))?/))) {
    it.checkin = toISO(+m[1], +m[2], m[3] ? +m[3] : undefined, today)
    const n = t.match(/(\d+)\s*đêm/)
    it.checkout = addDays(it.checkin, n ? +n[1] : 2)
  }
  if (it.checkin && it.checkout && it.checkout <= it.checkin) it.checkout = addDays(it.checkin, 1)

  // khách
  if ((m = t.match(/(\d+)\s*(?:người lớn|nguoi lon|nl\b|adults?)/))) it.adults = +m[1]
  if ((m = t.match(/(\d+)\s*(?:trẻ em|trẻ nhỏ|trẻ|bé|cháu|con nhỏ|children|kids?)/))) it.children = +m[1]
  if (it.adults == null && (m = t.match(/(\d+)\s*(?:người|khách|pax)(?!\s*lớn)/))) it.adults = +m[1]
  if (/cặp đôi|vợ chồng|couple|honeymoon|trăng mật/.test(t) && it.adults == null) it.adults = 2

  // ngân sách
  if ((m = t.match(/(?:dưới|tối đa|không quá|<|max|ngân sách|budget)\s*(?:là\s*)?(\d+(?:[.,]\d+)?)\s*(triệu|tr|m\b|củ)?\s*(\/\s*đêm|một đêm|mỗi đêm)?/))) {
    const v = parseFloat(m[1].replace(',', '.')) * (m[2] || +m[1] < 1000 ? 1e6 : 1)
    if (m[3]) it.budgetPerNight = v
    else it.budget = v
  }

  // tiêu chí
  if (/view biển|hướng biển|ocean view|nhìn ra biển/.test(t)) it.oceanView = true
  if (/gần biển|bãi biển|sát biển|beach|biển/.test(t)) it.tags.push('gan-bien')
  if (/hồ bơi|bể bơi|pool/.test(t)) it.tags.push('ho-boi')
  if (/kids club|khu vui chơi|trẻ em chơi/.test(t)) it.tags.push('kids-club')
  if (/spa|massage/.test(t)) it.tags.push('spa')
  if (/ăn sáng|breakfast/.test(t)) it.tags.push('an-sang')
  if (/huỷ miễn phí|hủy miễn phí|free cancel/.test(t)) it.tags.push('huy-mien-phi')
  if (/bắc đảo|gành dầu|bãi dài/.test(t)) it.area = 'bac-dao'
  else if (/nam đảo|an thới|hòn thơm|bãi khem/.test(t)) it.area = 'nam-dao'
  else if (/trung tâm|dương đông|chợ đêm/.test(t)) it.area = 'trung-tam'
  return it
}

export const understood = (it: Intent) =>
  !!(it.checkin || it.adults || it.children || it.budget || it.budgetPerNight || it.tags.length || it.oceanView || it.area)

export const SAMPLE_PROMPTS = [
  'Tôi cần khách sạn ở Phú Quốc từ 20–23/10 cho 2 người lớn và 2 trẻ em, gần biển, có hồ bơi và ngân sách dưới 10 triệu.',
  'Phòng view biển cho 2 người lớn 12–15/10, có ăn sáng',
  'Resort Bắc đảo cho gia đình 2 người lớn 1 trẻ em, 25–28/10, có hồ bơi',
  'Khách sạn trung tâm dưới 2 triệu/đêm từ 15/11 đến 17/11 cho 2 người',
]
