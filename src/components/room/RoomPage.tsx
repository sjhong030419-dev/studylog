import { SeatRoom } from './SeatRoom'

export function RoomPage() {
  return (
    <main className="min-h-screen px-4 pb-32 pt-6">
      <div className="mx-auto flex w-full max-w-[430px] flex-col items-center gap-5">
      <div className="w-full text-left">
        <p className="font-cute text-[11px] tracking-wide text-ink-soft">STUDY TOGETHER</p>
        <h1 className="font-cute text-3xl text-ink">스터디룸 🪑</h1>
        <p className="mt-1 font-cute text-xs text-ink-soft">친구들과 같은 공간에서 각자의 캐릭터로 함께 집중해요.</p>
      </div>
      <SeatRoom />
      </div>
    </main>
  )
}
