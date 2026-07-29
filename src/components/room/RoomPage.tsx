import { SeatRoom } from './SeatRoom'

export function RoomPage() {
  return (
    <div className="min-h-screen flex flex-col items-center gap-6 px-4 py-10">
      <h1 className="font-cute text-3xl text-ink">스터디룸 🪑</h1>
      <p className="text-ink-soft text-xs -mt-4">친구들과 같은 공간에서 함께 공부해요</p>
      <SeatRoom />
    </div>
  )
}
