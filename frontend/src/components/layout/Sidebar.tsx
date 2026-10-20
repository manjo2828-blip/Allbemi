import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ChevronDown, ChevronsLeft, ChevronsRight, LogOut } from 'lucide-react'
import { findNav, navGroups } from '@/lib/nav'
import { useAppState } from '@/lib/AppState'

export default function Sidebar() {
  const { user, logout, sidebarCollapsed, toggleSidebar } = useAppState()
  const { pathname } = useLocation()

  // 지금 보고 있는 화면이 속한 그룹은 자동으로 펼쳐 둔다. 나머지는 이름을 눌러 펼친다.
  const current = findNav(pathname)
  const groupOfPath = navGroups.find((g) => current && g.items.includes(current))?.label
  const [open, setOpen] = useState<Set<string>>(() => new Set(groupOfPath ? [groupOfPath] : []))
  useEffect(() => {
    if (groupOfPath) setOpen((prev) => (prev.has(groupOfPath) ? prev : new Set(prev).add(groupOfPath)))
  }, [groupOfPath])
  const toggle = (label: string) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })

  return (
    <aside
      className={`flex shrink-0 flex-col border-r-2 border-line bg-sidebar transition-[width] duration-200 ${
        sidebarCollapsed ? 'w-[72px]' : 'w-64'
      }`}
      aria-label="주 메뉴"
    >
      {/* 로고 */}
      <div
        className={`flex px-4 pt-5 pb-3 ${
          sidebarCollapsed ? 'flex-col items-center gap-2' : 'items-center justify-between gap-2'
        }`}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-line bg-surface text-sm font-bold text-brand"
            aria-hidden="true"
          >
            A
          </div>
          {!sidebarCollapsed && <div className="truncate text-[17px] font-bold">Allbemi</div>}
        </div>
        <button
          type="button"
          onClick={toggleSidebar}
          className="shrink-0 rounded-md p-1.5 text-muted hover:bg-selected hover:text-ink"
          aria-label={sidebarCollapsed ? '사이드바 펼치기' : '사이드바 접기'}
        >
          {sidebarCollapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
        </button>
      </div>

      {/* 메뉴: 계정은 하나라 모두에게 같은 메뉴가 보인다 */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {navGroups.map((group) => {
          // 홈은 항목이 하나라 펼침 없이 바로 링크로 보인다. 나머지 그룹은 이름을 누르면 아래로 펼쳐진다.
          const flat = group.items.length === 1 && group.label === '홈'
          const expanded = flat || sidebarCollapsed || open.has(group.label)
          const panelId = `nav-group-${group.label}`
          return (
            <div key={group.label} className={sidebarCollapsed ? 'mt-3 border-t border-soft pt-3 first:mt-0 first:border-0 first:pt-0' : 'mt-1.5'}>
              {!flat && !sidebarCollapsed && (
                <button
                  type="button"
                  onClick={() => toggle(group.label)}
                  aria-expanded={expanded}
                  aria-controls={panelId}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-[15px] font-bold transition-colors hover:bg-selected/60 ${
                    groupOfPath === group.label && !expanded ? 'text-brand' : 'text-ink'
                  }`}
                >
                  <span>{group.label}</span>
                  <ChevronDown
                    size={16}
                    aria-hidden="true"
                    className={`text-muted transition-transform duration-200 ${expanded ? '' : '-rotate-90'}`}
                  />
                </button>
              )}
              {expanded && (
                <ul id={panelId} className={`space-y-0.5 ${!flat && !sidebarCollapsed ? 'pb-1' : ''}`}>
                  {group.items.map(({ to, label, title, icon: Icon }) => (
                    <li key={to}>
                      <NavLink
                        to={to}
                        end={to === '/'}
                        title={sidebarCollapsed ? title : undefined}
                        aria-label={title}
                        className={({ isActive }) =>
                          `flex items-center gap-3 rounded-lg border-2 py-2 text-sm font-medium transition-colors ${
                            isActive
                              ? 'border-line bg-selected text-ink'
                              : 'border-transparent text-ink/80 hover:bg-selected/60'
                          } ${sidebarCollapsed ? 'justify-center px-0' : flat ? 'px-3' : 'pr-3 pl-6'}`
                        }
                      >
                        <Icon size={18} aria-hidden="true" />
                        {!sidebarCollapsed && <span className="flex-1 truncate">{label}</span>}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </nav>

      {/* 현재 사용자 */}
      <div className="border-t-2 border-line px-3 py-3">
        <div className={`flex items-center gap-3 ${sidebarCollapsed ? 'flex-col' : ''}`}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-line bg-surface text-sm font-bold">
            {user?.name[0]}
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-sm font-semibold">{user?.name}</div>
              <div className="mt-0.5 truncate text-[11px] text-muted">{user?.title}</div>
            </div>
          )}
          <button
            type="button"
            onClick={logout}
            className="shrink-0 rounded-md p-1.5 text-muted hover:bg-selected hover:text-ink"
            aria-label="로그아웃"
            title="로그아웃"
          >
            <LogOut size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>
  )
}
