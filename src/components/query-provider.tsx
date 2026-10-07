'use client'
// Một QueryClient cho mỗi tab trình duyệt. Mặc định tiết kiệm lượt gọi Gohost (60 lượt / 5 phút cho cả key):
// dữ liệu coi là mới trong 60 giây, không tự gọi lại khi quay về tab, không tự thử lại khi lỗi.
import { useState, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 60_000, retry: false, refetchOnWindowFocus: false } },
  }))
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
