import { useEffect } from 'react'
import { Game } from './components/Game'
import './index.css'

function App() {
  useEffect(() => {
    // 防止页面滚动
    document.body.style.overflow = 'hidden'
  }, [])

  return (
    <div className="w-full h-screen">
      <Game />
    </div>
  )
}

export default App
