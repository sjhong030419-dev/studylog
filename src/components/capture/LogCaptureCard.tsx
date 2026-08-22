import { useEffect, useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import { RoomScene } from '../../character/room/RoomScene'
import { CaptureExpBadge } from './CaptureExpBadge'
import { CaptureCardVisualHeader } from './CaptureCardVisualHeader'
import { CaptureControls } from './CaptureControls'
import { CaptureStatsRow } from './CaptureStatsRow'
import { CaptureSubjectBars } from './CaptureSubjectBars'
import { CaptureBadges } from './CaptureBadges'
import { useMyAvatarAppearance } from '../../hooks/useMyAvatarAppearance'
import { useProfileStore } from '../../store/profileStore'
import { todaySessions, useTimerStore } from '../../store/timerStore'
import { usePointsStore } from '../../store/pointsStore'
import { usePlannerStore } from '../../store/plannerStore'
import { useAwayStore } from '../../store/awayStore'
import { useSettingsStore } from '../../store/settingsStore'
import { useShopStore } from '../../store/shopStore'
import { allDailyQuestsComplete } from '../../quests/dailyQuests'
import { deriveExpLevel } from '../../character/engine/expLevel'
import { computeDailyGoal } from '../../utils/dailyGoal'
import { deriveLevelBeforeToday } from '../../utils/levelTransition'
import { deriveCaptureMessage } from '../../utils/captureMessage'
import { deriveEarnedAchievements } from '../../utils/achievements'
import { myOverallRank } from '../../utils/ranking'
import { formatDuration, todayKey, dateKeyOffset } from '../../utils/time'
import { isCaptureThemeLocked, resolveCaptureTheme } from '../../utils/captureTheme'

type Ratio = 'square' | 'story'

const CAPTURE_THEME = {
  lavender: {
    label: '라벤더', emoji: '💜',
    background: 'linear-gradient(165deg, #efe5ff 0%, #f4e5f5 35%, #e2edff 70%, #dff5ff 100%)',
    number: 'linear-gradient(90deg, #9b86d9 0%, #f28ba8 100%)',
    action: 'linear-gradient(135deg, #9b86d9 0%, #f28ba8 100%)',
  },
  moonlight: {
    label: '달빛', emoji: '🌙',
    background: 'linear-gradient(165deg, #171b35 0%, #29274b 38%, #40335f 72%, #6a4f72 100%)',
    number: 'linear-gradient(90deg, #ffe2a3 0%, #d9c4ff 100%)',
    action: 'linear-gradient(135deg, #252b50 0%, #7b5d91 100%)',
  },
  rainyCafe: {
    label: '비 오는 카페', emoji: '☔',
    background: 'linear-gradient(165deg, #e9dfcd 0%, #d9c6a7 34%, #93aaa7 70%, #536b70 100%)',
    number: 'linear-gradient(90deg, #405754 0%, #a95f43 55%, #d49b4b 100%)',
    action: 'linear-gradient(135deg, #405754 0%, #7d5544 100%)',
  },
} as const

/** Kept short intentionally — a caption for the card, not a journal entry
 * (PRD §17 "short length limit"). */
const NOTE_MAX_LENGTH = 30

const RATIO_CLASS: Record<Ratio, string> = {
  square: 'aspect-square',
  story: 'aspect-[9/16]',
}

function formatDate(date = new Date()): string {
  const days = ['일', '월', '화', '수', '목', '금', '토']
  const m = date.getMonth() + 1
  const d = date.getDate()
  const day = days[date.getDay()]
  return `${m}월 ${d}일 (${day})`
}

export function LogCaptureCard() {
  const subjects = useTimerStore((s) => s.subjects)
  const sessions = useTimerStore((s) => s.sessions)
  const plannerTasks = usePlannerStore((s) => s.tasks)
  const captureDefaultRatio = useSettingsStore((s) => s.captureDefaultRatio)
  const captureTheme = useSettingsStore((s) => s.captureTheme)
  const setCaptureTheme = useSettingsStore((s) => s.setCaptureTheme)
  const ownedItemIds = useShopStore((s) => s.ownedItemIds)

  const streakCount = usePointsStore((s) => s.streakCount)
  const studyXpTotal = usePointsStore((s) => s.studyXpTotal())
  const studyXpBeforeTodaysLastSession = usePointsStore((s) => s.studyXpTotalBeforeTodaysLastSession())

  const gender = useProfileStore((s) => s.gender)
  const appearance = useMyAvatarAppearance()

  const todayAwaySec = useAwayStore((s) => s.todayAwaySec())

  const [ratio, setRatio] = useState<Ratio>(captureDefaultRatio)
  // Not persisted — there's no existing "daily result" record to safely
  // attach it to without inventing new schema (PRD §17: add only without
  // disrupting the current data model). Optional, never blocks sharing.
  const [note, setNote] = useState('')
  const compact = ratio === 'square'
  const activeTheme = resolveCaptureTheme(captureTheme, ownedItemIds)
  const theme = CAPTURE_THEME[activeTheme]
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const today = todaySessions(sessions)
  const todayTotalSec = today.reduce((sum, s) => sum + s.durationSec, 0)
  // Only true once every real daily quest is actually done today — must
  // never be derived from "studied at all" (todayTotalSec > 0), or the
  // capture card would claim an achievement the user hasn't earned
  // (docs/Claude_3Hour_MVP_Quality_Sprint.md §1/§4.4).
  const questsComplete = allDailyQuestsComplete(sessions, todayKey())

  const yesterdayKey = dateKeyOffset(todayKey(), -1)
  const yesterdayTotalSec = sessions
    .filter((s) => s.dateKey === yesterdayKey)
    .reduce((sum, s) => sum + s.durationSec, 0)

  const totalStudySec = sessions.reduce((sum, s) => sum + s.durationSec, 0)

  const perSubject = subjects
    .map((subject) => ({
      subject,
      sec: today.filter((s) => s.subjectId === subject.id).reduce((sum, s) => sum + s.durationSec, 0),
    }))
    .filter((row) => row.sec > 0)
    .sort((a, b) => b.sec - a.sec)

  const maxSec = Math.max(1, ...perSubject.map((r) => r.sec))

  const goal = computeDailyGoal(plannerTasks, sessions, todayKey())
  const level = deriveExpLevel(studyXpTotal)
  // Only shown when today itself actually earned Study XP AND that XP
  // crossed a real level boundary — never derived from `sessions.length`
  // (a past day's session must not be attributed to today's card), and
  // never shown as a same-level "Lv.1 -> Lv.1" transition (PRD §14).
  const levelBeforeLastSession = deriveLevelBeforeToday(studyXpTotal, studyXpBeforeTodaysLastSession)
  const { rank, total: rankTotal } = myOverallRank(todayTotalSec)

  const focusPercent =
    todayTotalSec + todayAwaySec > 0 ? Math.round((todayTotalSec / (todayTotalSec + todayAwaySec)) * 100) : null

  const message = deriveCaptureMessage({ todayTotalSec, yesterdayTotalSec, goal, streakCount })

  const achievements = deriveEarnedAchievements({
    hasAnySession: sessions.length > 0,
    streakCount,
    totalStudySec,
    goalReachedToday: goal.configured && goal.reached,
  })

  async function generateImage(): Promise<string | null> {
    if (!cardRef.current) return null
    let timeoutId: number | undefined
    // 20s, not 10s: html-to-image has to fetch and base64-embed every
    // @font-face source it finds (including the ~148KB legacy .woff
    // fallback for the self-hosted Korean pixel font), which is a
    // legitimately slower one-time cost than plain DOM rasterization.
    const timeout = new Promise<never>((_, reject) => {
      timeoutId = window.setTimeout(() => reject(new Error('이미지 생성 시간이 초과됐어요')), 20000)
    })
    try {
      // cacheBust forces a fresh network fetch (with a new query string) for
      // every embedded resource on every capture, including that same large
      // font file — with no benefit here since none of this app's static
      // assets change at runtime. Omitting it lets the browser reuse its
      // already-cached fetch.
      return await Promise.race([toPng(cardRef.current, { pixelRatio: 2 }), timeout])
    } finally {
      // Always cleared once the race settles, whichever side wins — no
      // dangling timer left behind (docs/StudyLog_Character_System_Fix_PRD_v1.0.md §11).
      if (timeoutId !== undefined) window.clearTimeout(timeoutId)
    }
  }

  function todayKeyForFile() {
    const now = new Date()
    return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
  }

  async function handleSave() {
    if (downloading) return
    setDownloading(true)
    setError(false)
    try {
      const dataUrl = await generateImage()
      if (!dataUrl) return
      const link = document.createElement('a')
      link.download = `studylog-${todayKeyForFile()}.png`
      link.href = dataUrl
      link.click()
    } catch (e) {
      console.error('이미지 저장 실패:', e)
      if (isMountedRef.current) setError(true)
    } finally {
      if (isMountedRef.current) setDownloading(false)
    }
  }

  async function handleShare() {
    if (downloading) return
    setDownloading(true)
    setError(false)
    try {
      const dataUrl = await generateImage()
      if (!dataUrl) return
      const canShareFiles = typeof navigator.share === 'function' && typeof navigator.canShare === 'function'
      if (canShareFiles) {
        const blob = await (await fetch(dataUrl)).blob()
        const file = new File([blob], `studylog-${todayKeyForFile()}.png`, { type: 'image/png' })
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: '스터디로그' })
          return
        }
      }
      // Fall back to a plain download when the Web Share API (or file
      // sharing) isn't available in this browser.
      const link = document.createElement('a')
      link.download = `studylog-${todayKeyForFile()}.png`
      link.href = dataUrl
      link.click()
    } catch (e) {
      if ((e as Error)?.name !== 'AbortError') {
        console.error('공유 실패:', e)
        if (isMountedRef.current) setError(true)
      }
    } finally {
      if (isMountedRef.current) setDownloading(false)
    }
  }

  return (
    <main className="min-h-screen px-4 pb-32 pt-6">
      <div className="mx-auto flex w-full max-w-[430px] flex-col items-center gap-5">
      <div className="w-full text-left">
        <p className="font-cute text-[11px] tracking-wide text-ink-soft">SHARE YOUR ADVENTURE</p>
        <h1 className="font-cute text-3xl text-ink">오늘의 기록 <span aria-hidden="true">📸</span></h1>
        <p className="mt-1 font-cute text-xs text-ink-soft">공부로 성장한 캐릭터와 오늘의 결과를 바로 공유해보세요.</p>
      </div>

      <div className="w-full max-w-[320px] flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 gap-2">
          <button
            type="button"
            onClick={() => setRatio('square')}
            className={`font-cute min-h-[44px] px-4 py-1.5 rounded-full border text-sm ${
              ratio === 'square' ? 'bg-ink text-white border-ink' : 'bg-white text-ink-soft border-ink/20'
            }`}
          >
            정사각형 (피드)
          </button>
          <button
            type="button"
            onClick={() => setRatio('story')}
            className={`font-cute min-h-[44px] px-4 py-1.5 rounded-full border text-sm ${
              ratio === 'story' ? 'bg-ink text-white border-ink' : 'bg-white text-ink-soft border-ink/20'
            }`}
          >
            9:16 (스토리)
          </button>
        </div>
        {/* Outside cardRef on purpose — never appears in the generated
            image (docs/StudyLog_Character_System_Fix_PRD_v1.0.md §11). */}
        <CaptureControls onShare={handleShare} onSave={handleSave} busy={downloading} />
      </div>

      <div className="w-full max-w-[320px] flex items-center gap-2" aria-label="공유 카드 테마">
        {(Object.keys(CAPTURE_THEME) as Array<keyof typeof CAPTURE_THEME>).map((themeId) => {
          const locked = isCaptureThemeLocked(themeId, ownedItemIds)
          return (
            <button
              key={themeId}
              type="button"
              disabled={locked}
              onClick={() => setCaptureTheme(themeId)}
              aria-pressed={activeTheme === themeId}
              className={`min-h-[44px] flex-1 rounded-2xl border px-3 font-cute text-xs transition-colors disabled:opacity-45 ${
                activeTheme === themeId ? 'border-ink bg-ink text-white' : 'border-ink/15 bg-white/75 text-ink'
              }`}
            >
              {CAPTURE_THEME[themeId].emoji} {CAPTURE_THEME[themeId].label}{locked ? ' · 스킨 필요' : ''}
            </button>
          )
        })}
      </div>

      {/* The input itself is a control, so — same rule as CaptureControls —
          it stays outside cardRef. Only the typed text (below) enters the
          image. Optional: leaving it blank never blocks sharing. */}
      <div className="w-full max-w-[320px] flex flex-col gap-1">
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, NOTE_MAX_LENGTH))}
          placeholder="오늘의 한 줄 메모 (선택)"
          maxLength={NOTE_MAX_LENGTH}
          className="w-full font-cute text-sm px-4 py-2 rounded-full bg-white border border-ink/20 text-ink placeholder:text-ink-soft/50"
        />
        {compact && note.trim() && (
          <p className="font-cute text-ink-soft text-[11px] px-3">
            정사각형 카드는 공간이 좁아 메모가 표시되지 않아요. 9:16 카드에서 보여요.
          </p>
        )}
      </div>

      {/* 1. 카드 헤더(브랜드/날짜) -> 2. 캐릭터 씬 -> 2b. 레벨 배지/메시지(씬 아래,
          겹치지 않는 별도 영역) -> 3. 오늘 공부시간 -> 4. 하이라이트 카드
          -> 5. 과목별 -> 6. 배지(9:16만) -> 7. 한 줄 메모 -> 8. 큰 공유 버튼(카드 밖) */}
      <div
        ref={cardRef}
        className={`w-full max-w-[320px] ${RATIO_CLASS[ratio]} rounded-3xl overflow-hidden flex flex-col relative ${
          compact ? 'px-3 py-2 gap-0.5' : 'px-4 py-3 gap-1.5'
        }`}
        data-capture-theme={activeTheme}
        style={{ background: theme.background }}
      >
        {/* Decorative soft glow blobs — purely visual, sit behind everything */}
        <div
          aria-hidden="true"
          className="absolute -top-10 -right-10 w-32 h-32 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(255,182,193,0.45) 0%, transparent 70%)' }}
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-12 -left-10 w-36 h-36 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(155,134,217,0.35) 0%, transparent 70%)' }}
        />

        <CaptureCardVisualHeader dateLabel={formatDate()} />

        <div className="relative z-10 flex items-center justify-center gap-1 font-cute text-[10px] text-ink shrink-0">
          <span aria-hidden="true">✨</span>
          <span>{questsComplete ? '오늘의 퀘스트 완료!' : '오늘의 성장 기록'}</span>
          <span aria-hidden="true">✨</span>
        </div>

        {/* 2. 캐릭터 씬 — 가장 중요한 영역이지만, 레벨 배지가 더는 씬 위에 겹쳐
            그려지지 않고 아래 별도 flow 요소로 빠지면서 카드 전체 높이 예산에
            새로 편입됐다. 정사각형 비율은 여유가 거의 없어(§14 필수 항목인
            과목별 막대가 밀려 사라지는 회귀를 실측으로 확인) 압축 비율을 살짝
            더 준다 — 9:16은 원래도 여유가 있어 42%를 그대로 유지. */}
        <div
          className="relative w-full rounded-2xl overflow-hidden shrink-0 shadow-md"
          style={{ height: compact ? '36%' : '42%', border: '1px solid rgba(255,255,255,0.6)' }}
        >
          {/* Static frame — animating a DOM that html-to-image is actively
              cloning/serializing makes capture unreliable (and a moving
              character makes no sense in a still shareable image anyway). */}
          <RoomScene
            state="happy"
            gender={gender}
            appearance={appearance}
            level={level.level}
            animated={false}
            preferFullScene
          />
        </div>

        {/* Capture metadata */}
        {/* Keep metadata outside the artwork so the character remains fully
            visible. Empty-state copy is omitted because 00:00 is sufficient. */}
        <div className="flex items-center gap-2 min-w-0 shrink-0 px-0.5">
          <CaptureExpBadge
            level={level.level}
            progressRatio={level.progressRatio}
            levelBefore={levelBeforeLastSession}
          />
          {todayTotalSec > 0 && (
            <span
              className={`min-w-0 flex-1 font-cute text-ink text-[10px] leading-snug ${
                compact ? 'line-clamp-1' : 'line-clamp-2'
              }`}
            >
              {message}
            </span>
          )}
        </div>

        {/* 3. 오늘 공부시간 */}
        <div className="flex flex-col items-center gap-0.5 shrink-0">
          <span className="font-cute text-ink-soft text-[10px]">오늘 총 공부 시간</span>
          <span
            className={`font-pixel tracking-widest ${compact ? 'text-lg' : 'text-2xl'}`}
            style={{
              backgroundImage: theme.number,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            {formatDuration(todayTotalSec)}
          </span>
          {goal.configured && (
            <span className="font-cute text-ink-soft text-[10px]">
              목표 대비 {goal.percent}% {goal.reached ? '달성 🎉' : ''}
            </span>
          )}
        </div>

        {/* 4. 하이라이트 카드 4개 */}
        <CaptureStatsRow
          streakCount={streakCount}
          totalStudySec={totalStudySec}
          rank={rank}
          rankTotal={rankTotal}
          focusPercent={focusPercent}
          compact={compact}
        />

        {/* 5. 과목별 공부시간 */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <CaptureSubjectBars
            perSubject={perSubject}
            maxSec={maxSec}
            maxRows={compact ? 2 : undefined}
            compact={compact}
          />
        </div>

        {/* 6. 획득 배지 — 정사각형 비율에서는 메모/해시태그와 같은 이유로
            생략한다: 레벨 배지 행이 더는 씬 위에 겹쳐 그려지지 않고 실제
            높이를 차지하게 되면서, 배지까지 함께 표시하면 §14 필수 항목인
            과목별 막대(flex-1)가 완전히 밀려 사라지는 걸 실측으로 확인했다. */}
        {!compact && <CaptureBadges achievements={achievements} compact={compact} />}

        {/* 7. 한 줄 메모 — compact(정사각형) 카드는 이미 고정 높이 예산이 빠듯해서,
            메모까지 넣으면 flex-1인 과목별 막대(§14 필수 항목)가 밀려 사라진다.
            메모는 선택 항목이라 우선순위가 낮으므로 정사각형에서는 생략한다
            (하단 해시태그와 동일한 판단 — 아래 !compact 처리 참고). */}
        {!compact && note.trim() && (
          <p className="font-cute text-ink text-[10px] text-center shrink-0 line-clamp-1 px-2">
            “{note.trim()}”
          </p>
        )}

        {!compact && (
          <span className="font-cute text-ink-soft text-[9px] text-center shrink-0">
            #스터디로그 #공스타그램
          </span>
        )}
      </div>

      {/* 7. 하단 큰 공유 버튼 */}
      <button
        type="button"
        onClick={handleShare}
        disabled={downloading}
        className="font-cute px-10 py-3.5 rounded-full text-white shadow-lg text-lg disabled:opacity-60"
        style={{ background: theme.action }}
      >
        {downloading ? '준비 중...' : '공유하기 🔗'}
      </button>
      {error && (
        <p className="text-red-400 text-sm font-cute">
          이미지 생성에 실패했어요. 다시 시도해주세요.
        </p>
      )}
      </div>
    </main>
  )
}
