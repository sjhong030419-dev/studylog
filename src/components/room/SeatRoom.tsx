import { DotAvatar } from '../avatar/DotAvatar'
import { useAuthStore } from '../../store/authStore'
import { useRoomStore } from '../../store/roomStore'
import { useProfileStore } from '../../store/profileStore'
import { isSupabaseConfigured } from '../../lib/supabaseClient'

export function SeatRoom() {
  const authStatus = useAuthStore((s) => s.status)
  const authError = useAuthStore((s) => s.errorMessage)

  const nickname = useProfileStore((s) => s.nickname)

  const seats = useRoomStore((s) => s.seats)
  const mySeatIndex = useRoomStore((s) => s.mySeatIndex)
  const loading = useRoomStore((s) => s.loading)
  const roomError = useRoomStore((s) => s.error)
  const claimSeat = useRoomStore((s) => s.claimSeat)
  const releaseSeat = useRoomStore((s) => s.releaseSeat)

  if (!isSupabaseConfigured) {
    return (
      <div className="w-full max-w-sm bg-white/70 rounded-2xl px-6 py-10 flex flex-col items-center gap-2 text-center">
        <span className="text-3xl">🛠️</span>
        <span className="font-cute text-ink">스터디룸 설정이 아직 안 됐어요</span>
        <p className="text-ink-soft text-xs">
          Supabase 연동이 완료되면 친구들과 같은 방에서 실시간으로 공부할 수 있어요.
        </p>
      </div>
    )
  }

  if (authStatus === 'loading' || authStatus === 'idle') {
    return <p className="text-ink-soft text-sm font-cute">입장하는 중...</p>
  }

  if (authStatus === 'error') {
    return <p className="text-red-400 text-sm font-cute">{authError ?? '인증에 실패했어요.'}</p>
  }

  return (
    <div className="w-full max-w-sm flex flex-col gap-4">
      {roomError && <p className="text-red-400 text-xs font-cute text-center">{roomError}</p>}
      {loading && <p className="text-ink-soft text-xs font-cute text-center">좌석 불러오는 중...</p>}

      <div className="grid grid-cols-3 gap-3">
        {seats.map((seat) => {
          const isMine = seat.seatIndex === mySeatIndex
          return (
            <div
              key={seat.seatIndex}
              className={`rounded-2xl px-2 py-4 flex flex-col items-center gap-1.5 shadow-sm ${
                isMine ? 'bg-pastel-yellow' : 'bg-white/70'
              }`}
            >
              {seat.occupantId ? (
                <>
                  <DotAvatar status={seat.online ? seat.status : 'idle'} pixelSize={8} />
                  <span className="font-cute text-[10px] text-ink truncate max-w-full">
                    {seat.nickname ?? '익명'}
                  </span>
                  <span className="text-[9px] text-ink-soft">{seat.online ? '접속중' : '자리 비움'}</span>
                  {isMine && (
                    <button
                      type="button"
                      onClick={releaseSeat}
                      className="font-cute text-[10px] px-2 py-0.5 rounded-full bg-ink text-white mt-0.5"
                    >
                      일어나기
                    </button>
                  )}
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => claimSeat(seat.seatIndex, nickname)}
                  disabled={mySeatIndex != null}
                  className="w-full h-full min-h-[64px] flex flex-col items-center justify-center gap-1 text-ink-soft disabled:opacity-40"
                >
                  <span className="text-lg">🪑</span>
                  <span className="text-[10px] font-cute">앉기</span>
                </button>
              )}
            </div>
          )
        })}
      </div>

      <p className="text-ink-soft text-xs font-cute text-center">
        내 상태는 다른 탭에 있어도 계속 실시간으로 동기화돼요.
      </p>
    </div>
  )
}
