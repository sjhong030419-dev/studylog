import { useState } from 'react'
import { StudyTimer } from './components/timer/StudyTimer'
import { LogCaptureCard } from './components/capture/LogCaptureCard'
import { RankingBoard } from './components/ranking/RankingBoard'
import { QnaPage } from './components/qna/QnaPage'
import { AiTutorChat } from './components/tutor/AiTutorChat'
import { AvatarShop } from './components/shop/AvatarShop'
import { BgmPlayer } from './components/audio/BgmPlayer'
import { BottomNav, type Tab } from './components/layout/BottomNav'

function App() {
  const [tab, setTab] = useState<Tab>('timer')

  return (
    <div className="pb-16">
      {tab === 'timer' && <StudyTimer />}
      {tab === 'capture' && <LogCaptureCard />}
      {tab === 'ranking' && <RankingBoard />}
      {tab === 'qna' && <QnaPage />}
      {tab === 'tutor' && <AiTutorChat />}
      {tab === 'shop' && <AvatarShop />}
      <BgmPlayer />
      <BottomNav active={tab} onChange={setTab} />
    </div>
  )
}

export default App
