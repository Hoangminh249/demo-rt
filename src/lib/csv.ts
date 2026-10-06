// "Xuất Excel" giả lập: tải CSV (UTF-8 BOM để Excel đọc đúng tiếng Việt).
export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const esc = (v: string | number) => (/[",\n;]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v))
  const csv = '﻿' + rows.map(r => r.map(esc).join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: filename })
  a.click()
  URL.revokeObjectURL(url)
}
