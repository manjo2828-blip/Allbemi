import { useEffect, useState, type ReactNode } from 'react'

/** 카드가 뒤집히며 나타나는 연출. 움직임을 줄이는 설정이면 바로 앞면을 보여 준다. */
export default function FlipCard({ delay = 0, children }: { delay?: number; children: ReactNode }) {
  const [flipped, setFlipped] = useState(false)

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setFlipped(true)
      return
    }
    const t = setTimeout(() => setFlipped(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  return (
    <div className="[perspective:1400px]">
      <div
        className={`grid transition-transform duration-700 ease-out [transform-style:preserve-3d] motion-reduce:transition-none ${
          flipped ? '[transform:rotateY(0deg)]' : '[transform:rotateY(180deg)]'
        }`}
      >
        <div className="[grid-area:1/1] [backface-visibility:hidden]">{children}</div>
        <div
          className="flex items-center justify-center rounded-card border-2 border-line bg-brand [grid-area:1/1] [backface-visibility:hidden] [transform:rotateY(180deg)]"
          aria-hidden="true"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-on-brand/60 text-3xl font-bold text-on-brand">
            A
          </span>
        </div>
      </div>
    </div>
  )
}
