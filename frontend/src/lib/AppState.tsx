import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { userById } from './data'
import type { User } from './types'

interface AppState {
  /** 로그인한 사용자. 없으면 로그인 화면만 보인다 (목업은 데모 계정 입장) */
  user: User | null
  login: (userId: string) => void
  logout: () => void
  sidebarCollapsed: boolean
  toggleSidebar: () => void
}

const Ctx = createContext<AppState | null>(null)
const KEY = 'allbemi.ui'

function load(): Partial<{ userId: string | null; collapsed: boolean }> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}')
  } catch {
    return {}
  }
}

function save(v: object) {
  try {
    localStorage.setItem(KEY, JSON.stringify(v))
  } catch {
    /* 저장이 막힌 환경에서도 화면은 동작해야 한다 */
  }
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const saved = load()
  const [userId, setUserId] = useState<string | null>(saved.userId && userById(saved.userId) ? saved.userId : null)
  const [sidebarCollapsed, setCollapsed] = useState(saved.collapsed === true)

  const login = useCallback(
    (id: string) => {
      if (!userById(id)) return
      setUserId(id)
      save({ userId: id, collapsed: sidebarCollapsed })
    },
    [sidebarCollapsed],
  )
  const logout = useCallback(() => {
    setUserId(null)
    save({ userId: null, collapsed: sidebarCollapsed })
  }, [sidebarCollapsed])

  const value = useMemo<AppState>(() => {
    const user = userId ? (userById(userId) ?? null) : null
    return {
      user,
      login,
      logout,
      sidebarCollapsed,
      toggleSidebar: () => {
        setCollapsed(!sidebarCollapsed)
        save({ userId, collapsed: !sidebarCollapsed })
      },
    }
  }, [userId, sidebarCollapsed, login, logout])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAppState() {
  const v = useContext(Ctx)
  if (!v) throw new Error('AppStateProvider 안에서만 쓸 수 있다')
  return v
}
