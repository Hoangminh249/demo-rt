'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { FlaskConical, RotateCcw, Network } from 'lucide-react'
import { useDemo } from '@/store/provider'
import type { Role } from '@/store/demo-store'
import { ConfirmDialog, toast } from './ui/overlay'

const ROLES: { value: Role; label: string; go: string }[] = [
  { value: 'guest', label: 'Khách', go: '/' },
  { value: 'agent', label: 'Đại lý', go: '/agent/tim-phong' },
  { value: 'staff', label: 'Nhân viên', go: '/admin/bookings' },
  { value: 'executive', label: 'Lãnh đạo', go: '/admin' },
  { value: 'hotel_admin', label: 'Quản trị khách sạn', go: '/admin' },
]

export function DemoBanner() {
  const { overlay, update, reset } = useDemo()
  const router = useRouter()
  const [confirm, setConfirm] = useState(false)

  function switchRole(role: Role) {
    const r = ROLES.find(x => x.value === role)!
    update(o => ({
      session: {
        ...o.session, role,
        agentId: role === 'agent' ? (o.session.agentId ?? 'AG01') : o.session.agentId,
        adminUserId: role === 'staff' ? 'U03' : role === 'executive' ? 'U01' : role === 'hotel_admin' ? 'U02' : o.session.adminUserId,
      },
      admin: role === 'hotel_admin' ? { ...o.admin, hotel: 'H01' } : role === 'executive' || role === 'staff' ? { ...o.admin, hotel: 'all' } : o.admin,
    }))
    toast(`Đang xem với vai trò: ${r.label}`, 'info')
    router.push(r.go)
  }

  return (
    <div className="no-print sticky top-0 z-50 flex h-9 items-center gap-2 bg-brand px-3 text-xs text-white sm:px-4">
      <FlaskConical className="size-4 shrink-0" aria-hidden />
      <span className="hidden font-medium sm:inline">Bản demo — dữ liệu giả lập</span>
      <span className="font-medium sm:hidden">Demo</span>
      <Link href="/kien-truc" className="ml-1 hidden items-center gap-1 rounded px-1.5 py-0.5 text-white/85 hover:bg-white/10 md:inline-flex">
        <Network className="size-3.5" /> Kiến trúc
      </Link>
      <div className="ml-auto flex items-center gap-2">
        <label htmlFor="demo-role" className="hidden text-white/80 sm:inline">Chuyển vai trò</label>
        <select id="demo-role" value={overlay.session.role} onChange={e => switchRole(e.target.value as Role)}
          className="h-7 rounded-md border border-white/25 bg-white/10 px-2 text-xs text-white [&>option]:text-black">
          {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
        <button type="button" onClick={() => setConfirm(true)} className="inline-flex h-7 items-center gap-1 rounded-md border border-white/25 px-2 hover:bg-white/10">
          <RotateCcw className="size-3.5" /> <span className="hidden sm:inline">Reset dữ liệu</span>
        </button>
      </div>
      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} title="Reset dữ liệu demo?" confirmLabel="Reset" danger
        message="Xoá mọi booking, chỉnh sửa giá, tồn, ưu đãi, đăng ký đại lý đã tạo trong phiên. Dữ liệu gốc (seed) giữ nguyên."
        onConfirm={() => { reset(); setConfirm(false); toast('Đã reset dữ liệu demo') }} />
    </div>
  )
}
