'use client'
// ID Gohost rút gọn + nút chép ID đầy đủ (để dán vào gohost_tenant_id / gohost_room_type_id trong src/content).
import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'

const shorten = (id: string) => (id.length > 14 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id)

export function CopyId({ id }: { id: string }) {
  const [done, setDone] = useState(false)
  return (
    <span className="inline-flex items-center gap-1">
      <code className="font-mono text-xs text-muted-foreground" title={id}>{shorten(id)}</code>
      <Button
        type="button" variant="ghost" size="icon-xs" aria-label={`Chép ID ${id}`} title="Chép ID"
        onClick={async () => { try { await navigator.clipboard.writeText(id); setDone(true); setTimeout(() => setDone(false), 1500) } catch {} }}
      >
        {done ? <Check className="text-emerald-600" aria-hidden /> : <Copy aria-hidden />}
      </Button>
    </span>
  )
}
