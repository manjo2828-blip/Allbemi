import {
  CheckCheck,
  ClipboardCheck,
  FilePenLine,
  Files,
  GitCompare,
  Layers,
  Layers2,
  LayoutDashboard,
  MessageCircleQuestion,
  Paperclip,
  PenLine,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  to: string
  /** 사이드바에 보이는 짧은 이름 (그룹 안에서 구분된다) */
  label: string
  /** 화면 제목 (풀네임) */
  title: string
  icon: LucideIcon
  /** 화면 코드 (진행순서·README의 화면 A~J) */
  screen: string
  /** 이 화면을 만드는 단계 (진행순서의 F 번호) */
  step: string
  summary: string
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

export const navGroups: NavGroup[] = [
  {
    label: '홈',
    items: [
      { to: '/', label: '대시보드', title: '대시보드', icon: LayoutDashboard, screen: 'J', step: 'F8',
        summary: '확인할 일, 카드 상태 요약, 최근 결정과 판정을 한눈에 봅니다.' },
    ],
  },
  {
    label: '내 업무',
    items: [
      { to: '/work/record', label: '기록하기', title: '내 업무 기록하기', icon: PenLine, screen: 'C', step: 'F6',
        summary: '업무 로그를 붙여넣고 파일을 함께 올리면 결정과 과정이 담긴 카드가 만들어집니다.' },
      { to: '/work/deck', label: '카드 덱', title: '내 업무 카드 덱', icon: Layers, screen: 'A · D', step: 'F5',
        summary: '내 업무 기록 카드를 상태별로 보고, 과정과 원문, 첨부 자료를 확인합니다.' },
      { to: '/work/files', label: '자료', title: '내 업무 자료', icon: Paperclip, screen: 'I', step: 'F5',
        summary: '업무 기록 카드에 연결된 파일을 모아 보고, 연결되지 않은 파일을 찾습니다.' },
    ],
  },
  {
    label: '판단',
    items: [
      { to: '/compare', label: '계획 비교', title: '계획 비교', icon: GitCompare, screen: 'B', step: 'F3',
        summary: '하려는 일을 입력하면 과거 결정과 나란히 놓고 일치·충돌·기각된 안을 알려 줍니다.' },
      { to: '/ask', label: '질문하기', title: '질문하기', icon: MessageCircleQuestion, screen: 'H', step: 'F8',
        summary: '"이 결정은 왜 했지?"에 카드와 원문을 근거로 답합니다.' },
    ],
  },
  {
    label: '인수인계',
    items: [
      { to: '/handover/write', label: '기록하기', title: '인수인계 쓰기', icon: FilePenLine, screen: 'E', step: 'F7',
        summary: '내 업무 기록 카드에서 만든 인수인계 카드 초안을 다듬고 인수자 메모를 남깁니다.' },
      { to: '/handover/audit', label: '점검', title: '인수인계 점검', icon: ClipboardCheck, screen: 'F', step: 'F8',
        summary: '내 업무 기록과 인수인계 카드를 비교해 빠진 결정과 자료를 찾습니다.' },
      { to: '/handover/deck', label: '카드 덱', title: '인수인계 카드 덱', icon: Layers2, screen: 'A · D', step: 'F5',
        summary: '인수인계 카드를 보고, 막히면 연결된 업무 기록(과정)으로 내려갑니다.' },
      { to: '/handover/files', label: '자료', title: '인수인계 자료', icon: Files, screen: 'I', step: 'F5',
        summary: '인수인계 카드에 연결된 자료를 모아 봅니다.' },
      { to: '/handover/review', label: '확인 모드', title: '인수인계 확인 모드', icon: CheckCheck, screen: 'G', step: 'F8',
        summary: '덱의 카드를 한 장씩 넘기며 "이해함 / 질문 있음"을 표시합니다.' },
    ],
  },
]

export const allNavItems = navGroups.flatMap((g) => g.items)

export function findNav(pathname: string): NavItem | undefined {
  return allNavItems.find((i) => (i.to === '/' ? pathname === '/' : pathname.startsWith(i.to)))
}
