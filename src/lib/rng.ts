// Random có seed (mulberry32) — cùng seed, cùng dữ liệu mỗi lần chạy.
export function makeRng(seed: number) {
  let a = seed >>> 0
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return {
    next,
    int: (min: number, max: number) => min + Math.floor(next() * (max - min + 1)),
    pick: <T,>(arr: readonly T[]) => arr[Math.floor(next() * arr.length)],
    /** chọn theo trọng số: [[giá trị, trọng số], ...] */
    weighted: <T,>(pairs: readonly (readonly [T, number])[]) => {
      const total = pairs.reduce((s, [, w]) => s + w, 0)
      let x = next() * total
      for (const [v, w] of pairs) if ((x -= w) < 0) return v
      return pairs[pairs.length - 1][0]
    },
  }
}
export type Rng = ReturnType<typeof makeRng>

const HO = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý']
const DEM = ['Văn', 'Thị', 'Minh', 'Ngọc', 'Thanh', 'Quốc', 'Gia', 'Hoài', 'Đức', 'Thu', 'Bảo', 'Hữu', 'Phương', 'Anh']
const TEN = ['An', 'Bình', 'Châu', 'Dũng', 'Giang', 'Hà', 'Hải', 'Hạnh', 'Hiếu', 'Hoa', 'Hùng', 'Khánh', 'Lan', 'Linh', 'Long', 'Mai', 'Nam', 'Nga', 'Nhung', 'Phong', 'Phúc', 'Quân', 'Quỳnh', 'Sơn', 'Tâm', 'Thảo', 'Trang', 'Trung', 'Tú', 'Tuấn', 'Vy', 'Yến']
const FOREIGN = ['James Miller', 'Emma Johnson', 'Kim Min-jun', 'Park Ji-woo', 'Olga Ivanova', 'Dmitry Petrov', 'Sophie Martin', 'Lukas Schmidt', 'Chen Wei', 'Tanaka Yuki', 'Sarah Wilson', 'Lee Seo-yeon', 'Anna Kowalska', 'Noah Brown']

export function personName(rng: Rng, foreignShare = 0) {
  if (rng.next() < foreignShare) return rng.pick(FOREIGN)
  return `${rng.pick(HO)} ${rng.pick(DEM)} ${rng.pick(TEN)}`
}

export function nationalityOf(name: string) {
  if (/Kim |Park |Lee /.test(name)) return 'Hàn Quốc'
  if (/Olga|Dmitry/.test(name)) return 'Nga'
  if (/Chen /.test(name)) return 'Trung Quốc'
  if (/Tanaka/.test(name)) return 'Nhật Bản'
  if (/James|Emma|Sarah|Noah|Sophie|Lukas|Anna/.test(name)) return 'Khác'
  return 'Việt Nam'
}

export function slugEmail(name: string, n: number) {
  const base = name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase().split(' ')
  return `${base[base.length - 1]}.${base[0]}${n}@gmail.com`
}
export const phoneOf = (rng: Rng) => `09${rng.int(10_000_000, 99_999_999)}`
