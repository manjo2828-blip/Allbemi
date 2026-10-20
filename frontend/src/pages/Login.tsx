import { Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight, Info } from 'lucide-react'
import { users } from '@/lib/data'
import { useAppState } from '@/lib/AppState'

// 로그인 화면 (목업): 계정 입력도 역할 선택도 없이, 데모 체험 버튼 하나로 바로 입장한다.
// 인계자·후임자는 계정의 종류가 아니라 인수인계 한 건에서 맡는 입장이다. 실제 인증은 B2, 연동은 F10.
export default function Login() {
  const { user, login } = useAppState()
  const navigate = useNavigate()

  if (user) return <Navigate to="/" replace />

  const demo = users[0]

  const enter = () => {
    login(demo.id)
    navigate('/', { replace: true })
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-page px-6 py-10">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-line bg-surface text-xl font-bold text-brand"
            aria-hidden="true"
          >
            A
          </div>
          <div className="leading-tight">
            <h1 className="text-3xl font-bold">Allbemi</h1>
            <p className="text-sm text-muted">모든 업무 기록의 이유를 품는 올빼미</p>
          </div>
        </div>

        <p className="mx-auto mt-6 max-w-md text-center text-[15px] leading-relaxed text-ink/80">
          내 업무를 <strong>과정까지</strong> 기록해 두고, 그 기록으로 <strong>인수인계</strong>를 쉽게 합니다.
          하려는 일이 이미 기각된 안인지도 먼저 알려 드려요.
        </p>

        <div className="mt-8 rounded-card border-2 border-line bg-surface p-6 text-center">
          <button
            type="button"
            onClick={enter}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border-2 border-line bg-brand px-5 py-3 text-base font-semibold text-on-brand hover:bg-brand-hover"
          >
            데모 체험하기
            <ArrowRight size={18} aria-hidden="true" />
          </button>
          <p className="mt-3 text-sm text-muted">계정이나 비밀번호 없이 바로 들어가요.</p>
        </div>

        <p className="mt-6 flex items-start gap-2 rounded-lg border border-line-soft bg-surface px-4 py-2.5 text-xs text-muted">
          <Info size={14} aria-hidden="true" className="mt-0.5 shrink-0" />
          데모용 합성 데이터만 들어 있어요. 누구나 같은 계정으로 내 업무 기록과 인수인계(넘기기·받기)를 모두 쓸 수 있어요.
        </p>
      </div>
    </div>
  )
}
