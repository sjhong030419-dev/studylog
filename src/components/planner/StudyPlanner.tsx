import { useState } from 'react'
import { useTimerStore, todaySessions } from '../../store/timerStore'
import { usePlannerStore, type PlannerTargetType } from '../../store/plannerStore'
import { dateKeyOffset, formatDuration, todayKey } from '../../utils/time'

export function StudyPlanner() {
  const subjects = useTimerStore((s) => s.subjects)
  const sessions = useTimerStore((s) => s.sessions)
  const tasks = usePlannerStore((s) => s.tasks)
  const addTask = usePlannerStore((s) => s.addTask)
  const toggleComplete = usePlannerStore((s) => s.toggleComplete)
  const removeTask = usePlannerStore((s) => s.removeTask)
  const carryOverTask = usePlannerStore((s) => s.carryOverTask)

  const today = todayKey()
  const yesterday = dateKeyOffset(today, -1)

  const todayTasks = tasks.filter((t) => t.dateKey === today)
  const yesterdayIncomplete = tasks.filter((t) => t.dateKey === yesterday && !t.completed)

  const todaySec = todaySessions(sessions)

  const [showAdd, setShowAdd] = useState(false)
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? '')
  const [title, setTitle] = useState('')
  const [targetType, setTargetType] = useState<PlannerTargetType>('time')
  const [targetMinutes, setTargetMinutes] = useState(60)

  function subjectMinutesToday(id: string): number {
    return Math.floor(
      todaySec.filter((s) => s.subjectId === id).reduce((sum, s) => sum + s.durationSec, 0) / 60,
    )
  }

  function handleAdd() {
    addTask(today, subjectId, title, targetType, targetMinutes)
    setTitle('')
    setShowAdd(false)
  }

  return (
    <div className="w-full max-w-sm flex flex-col gap-3">
      {yesterdayIncomplete.length > 0 && (
        <div className="bg-pastel-peach/60 rounded-2xl px-4 py-3 flex items-center justify-between">
          <span className="font-cute text-ink text-xs">
            어제 미완료 {yesterdayIncomplete.length}개 있어요
          </span>
          <button
            type="button"
            onClick={() => yesterdayIncomplete.forEach((t) => carryOverTask(t.id, today))}
            className="font-cute text-xs px-3 py-1 rounded-full bg-ink text-white"
          >
            오늘로 가져오기
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="font-cute text-ink-soft text-sm">오늘 할 일</span>
        <button
          type="button"
          onClick={() => setShowAdd(!showAdd)}
          className="font-cute text-xs px-3 py-1 rounded-full bg-pastel-yellow text-ink"
        >
          + 추가
        </button>
      </div>

      {showAdd && (
        <div className="bg-white/80 rounded-2xl px-4 py-3 flex flex-col gap-2 shadow-sm">
          <div className="flex flex-wrap gap-1.5">
            {subjects.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSubjectId(s.id)}
                className={`font-cute px-2.5 py-1 rounded-full border text-xs ${
                  subjectId === s.id ? 'border-ink text-ink' : 'border-ink/15 text-ink-soft'
                }`}
                style={{ backgroundColor: subjectId === s.id ? s.color : 'white' }}
              >
                {s.name}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setTargetType('time')}
              className={`font-cute flex-1 px-2 py-1 rounded-full border text-xs ${
                targetType === 'time' ? 'bg-ink text-white border-ink' : 'border-ink/20 text-ink-soft'
              }`}
            >
              목표 시간
            </button>
            <button
              type="button"
              onClick={() => setTargetType('checklist')}
              className={`font-cute flex-1 px-2 py-1 rounded-full border text-xs ${
                targetType === 'checklist' ? 'bg-ink text-white border-ink' : 'border-ink/20 text-ink-soft'
              }`}
            >
              체크리스트
            </button>
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={targetType === 'time' ? '예: 수학 문제집 진도' : '예: 영단어 100개 외우기'}
            className="font-cute text-sm px-3 py-2 rounded-xl border border-ink/15 outline-none"
          />
          {targetType === 'time' && (
            <div className="flex items-center gap-2">
              <span className="font-cute text-xs text-ink-soft">목표(분)</span>
              <input
                type="number"
                min={1}
                value={targetMinutes}
                onChange={(e) => setTargetMinutes(Math.max(1, Number(e.target.value)))}
                className="flex-1 font-pixel text-sm px-3 py-1.5 rounded-lg border border-ink/15"
              />
            </div>
          )}
          <button
            type="button"
            onClick={handleAdd}
            className="font-cute text-sm px-4 py-2 rounded-full bg-pastel-yellow text-ink"
          >
            등록
          </button>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {todayTasks.length === 0 && (
          <p className="text-ink-soft text-sm text-center font-cute py-6 bg-white/70 rounded-2xl">
            오늘 등록된 할 일이 없어요.
          </p>
        )}
        {todayTasks.map((task) => {
          const subject = subjects.find((s) => s.id === task.subjectId)
          const doneMinutes = task.targetType === 'time' ? subjectMinutesToday(task.subjectId) : 0
          const rate =
            task.targetType === 'time' && task.targetMinutes
              ? Math.min(100, Math.round((doneMinutes / task.targetMinutes) * 100))
              : task.completed
                ? 100
                : 0

          return (
            <div key={task.id} className="bg-white/70 rounded-2xl px-4 py-3 shadow-sm flex flex-col gap-2">
              <div className="flex items-center gap-2">
                {task.targetType === 'checklist' && (
                  <button
                    type="button"
                    onClick={() => toggleComplete(task.id)}
                    className={`w-5 h-5 rounded-md border shrink-0 flex items-center justify-center text-xs ${
                      task.completed ? 'bg-ink border-ink text-white' : 'border-ink/30'
                    }`}
                  >
                    {task.completed && '✓'}
                  </button>
                )}
                {subject && (
                  <span
                    className="font-cute text-[10px] px-2 py-0.5 rounded-full shrink-0"
                    style={{ backgroundColor: subject.color }}
                  >
                    {subject.name}
                  </span>
                )}
                <span
                  className={`font-cute text-sm flex-1 ${task.completed ? 'line-through text-ink-soft' : 'text-ink'}`}
                >
                  {task.title}
                </span>
                <button
                  type="button"
                  onClick={() => removeTask(task.id)}
                  className="text-ink-soft text-xs shrink-0"
                >
                  ✕
                </button>
              </div>

              {task.targetType === 'time' && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full bg-ink/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-pastel-mint"
                      style={{ width: `${rate}%` }}
                    />
                  </div>
                  <span className="font-pixel text-[10px] text-ink-soft whitespace-nowrap">
                    {formatDuration(doneMinutes * 60)} / {formatDuration((task.targetMinutes ?? 0) * 60)} · {rate}%
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
