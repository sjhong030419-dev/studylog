import { useState } from 'react'
import { useSettingsStore } from '../../store/settingsStore'

interface SettingsPageProps {
  onBack: () => void
  onOpenSubjects: () => void
}

function ToggleSwitch({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-11 h-6 rounded-full shrink-0 transition-colors relative ${
        on ? 'bg-ink' : 'bg-ink/15'
      }`}
    >
      <span
        className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
        style={{ left: on ? 22 : 2 }}
      />
    </button>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="w-full max-w-sm bg-white/70 backdrop-blur rounded-2xl shadow-sm px-5 py-4 flex flex-col gap-3">
      <span className="font-cute text-ink-soft text-sm">{title}</span>
      {children}
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-cute text-ink text-sm">{label}</span>
      {children}
    </div>
  )
}

export function SettingsPage({ onBack, onOpenSubjects }: SettingsPageProps) {
  const notifyStudyReminder = useSettingsStore((s) => s.notifyStudyReminder)
  const notifyStreakWarning = useSettingsStore((s) => s.notifyStreakWarning)
  const notifyRankChange = useSettingsStore((s) => s.notifyRankChange)
  const theme = useSettingsStore((s) => s.theme)
  const captureDefaultRatio = useSettingsStore((s) => s.captureDefaultRatio)
  const membership = useSettingsStore((s) => s.membership)
  const quietHours = useSettingsStore((s) => s.quietHours)
  const awayDetectionEnabled = useSettingsStore((s) => s.awayDetectionEnabled)

  const toggleNotifyStudyReminder = useSettingsStore((s) => s.toggleNotifyStudyReminder)
  const toggleNotifyStreakWarning = useSettingsStore((s) => s.toggleNotifyStreakWarning)
  const toggleNotifyRankChange = useSettingsStore((s) => s.toggleNotifyRankChange)
  const setTheme = useSettingsStore((s) => s.setTheme)
  const setCaptureDefaultRatio = useSettingsStore((s) => s.setCaptureDefaultRatio)
  const setQuietHours = useSettingsStore((s) => s.setQuietHours)
  const toggleAwayDetection = useSettingsStore((s) => s.toggleAwayDetection)

  const [placeholderMsg, setPlaceholderMsg] = useState<string | null>(null)

  return (
    <div className="min-h-screen flex flex-col items-center gap-4 px-4 py-10">
      <div className="w-full max-w-sm flex items-center gap-3">
        <button type="button" onClick={onBack} className="font-cute text-ink-soft text-sm">
          ← 뒤로
        </button>
        <h1 className="font-cute text-2xl text-ink">설정 ⚙️</h1>
      </div>

      <SectionCard title="알림 설정">
        <Row label="공부 리마인더 알림">
          <ToggleSwitch on={notifyStudyReminder} onClick={toggleNotifyStudyReminder} />
        </Row>
        <Row label="스트릭 끊김 경고 알림">
          <ToggleSwitch on={notifyStreakWarning} onClick={toggleNotifyStreakWarning} />
        </Row>
        <Row label="랭킹 변동 알림">
          <ToggleSwitch on={notifyRankChange} onClick={toggleNotifyRankChange} />
        </Row>

        <Row label="알림 받지 않는 시간대">
          <ToggleSwitch
            on={quietHours.enabled}
            onClick={() => setQuietHours({ enabled: !quietHours.enabled })}
          />
        </Row>
        {quietHours.enabled && (
          <div className="flex items-center gap-2">
            <input
              type="time"
              value={quietHours.start}
              onChange={(e) => setQuietHours({ start: e.target.value })}
              className="font-pixel text-xs px-2 py-1.5 rounded-lg border border-ink/15 bg-white flex-1"
            />
            <span className="text-ink-soft text-xs">~</span>
            <input
              type="time"
              value={quietHours.end}
              onChange={(e) => setQuietHours({ end: e.target.value })}
              className="font-pixel text-xs px-2 py-1.5 rounded-lg border border-ink/15 bg-white flex-1"
            />
          </div>
        )}
      </SectionCard>

      <SectionCard title="과목 관리">
        <button type="button" onClick={onOpenSubjects} className="font-cute text-sm text-ink text-left">
          내 과목 추가·수정·삭제 →
        </button>
      </SectionCard>

      <SectionCard title="계정 설정">
        <button
          type="button"
          onClick={() => setPlaceholderMsg('비밀번호 변경')}
          className="font-cute text-sm text-ink text-left"
        >
          비밀번호 변경 →
        </button>
        <button
          type="button"
          onClick={() => setPlaceholderMsg('이메일 변경')}
          className="font-cute text-sm text-ink text-left"
        >
          이메일 변경 →
        </button>
      </SectionCard>

      <SectionCard title="앱 설정">
        <Row label="다크모드">
          <ToggleSwitch on={theme === 'dark'} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} />
        </Row>
        <Row label="로그 캡처 기본 비율">
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setCaptureDefaultRatio('square')}
              className={`font-cute text-xs px-3 py-1 rounded-full border ${
                captureDefaultRatio === 'square' ? 'bg-ink text-white border-ink' : 'border-ink/20 text-ink-soft'
              }`}
            >
              정사각형
            </button>
            <button
              type="button"
              onClick={() => setCaptureDefaultRatio('story')}
              className={`font-cute text-xs px-3 py-1 rounded-full border ${
                captureDefaultRatio === 'story' ? 'bg-ink text-white border-ink' : 'border-ink/20 text-ink-soft'
              }`}
            >
              9:16
            </button>
          </div>
        </Row>
        <Row label="화면 이탈 감지">
          <ToggleSwitch on={awayDetectionEnabled} onClick={toggleAwayDetection} />
        </Row>
      </SectionCard>

      <SectionCard title="멤버십">
        <Row label={membership === 'premium' ? '프리미엄 플랜' : '무료 플랜'}>
          <button
            type="button"
            onClick={() => setPlaceholderMsg('멤버십 관리')}
            className="font-cute text-xs px-3 py-1.5 rounded-full bg-pastel-yellow text-ink"
          >
            관리
          </button>
        </Row>
      </SectionCard>

      <SectionCard title="정보">
        <button
          type="button"
          onClick={() => setPlaceholderMsg('개인정보처리방침')}
          className="font-cute text-sm text-ink-soft text-left"
        >
          개인정보처리방침
        </button>
        <button
          type="button"
          onClick={() => setPlaceholderMsg('이용약관')}
          className="font-cute text-sm text-ink-soft text-left"
        >
          이용약관
        </button>
        <button
          type="button"
          onClick={() => setPlaceholderMsg('문의하기')}
          className="font-cute text-sm text-ink-soft text-left"
        >
          문의하기
        </button>
      </SectionCard>

      {placeholderMsg && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-40 px-6"
          onClick={() => setPlaceholderMsg(null)}
        >
          <div
            className="w-full max-w-xs bg-white rounded-3xl p-6 flex flex-col items-center gap-3 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="font-cute text-ink text-lg">{placeholderMsg}</span>
            <p className="text-ink-soft text-sm">아직 준비 중인 기능이에요. 조금만 기다려주세요!</p>
            <button
              type="button"
              onClick={() => setPlaceholderMsg(null)}
              className="font-cute text-sm px-5 py-2 rounded-full bg-ink text-white"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
