import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import Dashboard from '@/pages/Dashboard'
import Compare from '@/pages/Compare'
import Deck from '@/pages/Deck'
import CardDetail from '@/pages/CardDetail'
import Files from '@/pages/Files'
import Login from '@/pages/Login'
import Placeholder from '@/pages/Placeholder'
import RecordWork from '@/pages/RecordWork'
import { useAppState } from '@/lib/AppState'

// 로그인하지 않으면 로그인 화면만 보인다.
function RequireAuth() {
  const { user } = useAppState()
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}

export default function App() {
  return (
    <Routes>
      <Route path="login" element={<Login />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route index element={<Dashboard />} />

          {/* 판단 (두 종류의 카드를 함께 찾는다) */}
          <Route path="compare" element={<Compare />} />
          <Route path="ask" element={<Placeholder />} />

          {/* 내 업무 */}
          <Route path="work/record" element={<RecordWork />} />
          <Route path="work/deck" element={<Deck kind="work" />} />
          <Route path="work/deck/:cardId" element={<CardDetail />} />
          <Route path="work/files" element={<Files kind="work" />} />

          {/* 인수인계 */}
          <Route path="handover/write" element={<Placeholder />} />
          <Route path="handover/audit" element={<Placeholder />} />
          <Route path="handover/review" element={<Placeholder />} />
          <Route path="handover/deck" element={<Deck kind="handover" />} />
          <Route path="handover/deck/:cardId" element={<CardDetail />} />
          <Route path="handover/files" element={<Files kind="handover" />} />

          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  )
}

function NotFound() {
  return (
    <section className="rounded-card border-2 border-line bg-surface p-8">
      <h2 className="text-xl font-bold">페이지를 찾을 수 없어요</h2>
      <p className="mt-2 text-sm text-muted">왼쪽 메뉴에서 다른 화면을 선택해 보세요.</p>
    </section>
  )
}
