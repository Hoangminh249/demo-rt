// Bảng thông tin (giá vé, chính sách trẻ em…) — dùng ở trang khách sạn và trang phòng.
import type { InfoTable as Data } from '@/types/global'

export function InfoTable({ table }: { table: Data }) {
  return (
    <figure className="mt-4">
      <figcaption className="mb-2 text-[15px] font-semibold text-brand">{table.caption}</figcaption>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[420px] text-left text-[15px]">
          <thead className="bg-muted text-[14px] text-muted-foreground"><tr>{table.head.map(c => <th key={c} scope="col" className="px-4 py-2.5 font-semibold">{c}</th>)}</tr></thead>
          <tbody className="divide-y divide-border">{table.rows.map(r => <tr key={r.join('|')}>{r.map((c, i) => <td key={i} className="px-4 py-2.5 align-top">{c}</td>)}</tr>)}</tbody>
        </table>
      </div>
      {table.note && <p className="mt-2 text-[14px] text-muted-foreground">{table.note}</p>}
    </figure>
  )
}
