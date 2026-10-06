'use client'
import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from 'react'
import { demoStore, type Overlay } from './demo-store'

interface DemoCtx { version: number; overlay: Overlay; update: typeof demoStore.update; reset: typeof demoStore.reset }
const Ctx = createContext<DemoCtx | null>(null)

export function DemoProvider({ children }: { children: ReactNode }) {
  const version = useSyncExternalStore(demoStore.subscribe, demoStore.version, () => 0)
  useEffect(() => { demoStore.load() }, [])
  return <Ctx.Provider value={{ version, overlay: demoStore.get(), update: demoStore.update, reset: demoStore.reset }}>{children}</Ctx.Provider>
}

export function useDemo() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useDemo cần DemoProvider')
  return c
}

/** Gọi repo (async) và tự chạy lại khi dữ liệu demo đổi. Giữ dữ liệu cũ trong lúc tải lại. */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]) {
  const { version } = useDemo()
  const key = JSON.stringify(deps) + '#' + version
  const [state, setState] = useState<{ key?: string; data?: T; error?: string }>({})
  useEffect(() => {
    let alive = true
    fn().then(
      data => { if (alive) setState({ key, data }) },
      (e: Error) => { if (alive) setState(s => ({ key, data: s.data, error: e.message })) },
    )
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  return { data: state.data, loading: state.key !== key, error: state.key === key ? state.error : undefined }
}
