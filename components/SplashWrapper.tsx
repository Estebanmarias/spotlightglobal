'use client'

import { useState, useEffect } from 'react'
import SplashScreen from './SplashScreen'

export default function SplashWrapper({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Only show splash once per session
    const seen = sessionStorage.getItem('splash-seen')
    if (!seen) {
      setShowSplash(true)
    } else {
      setReady(true)
    }
  }, [])

  const handleComplete = () => {
    sessionStorage.setItem('splash-seen', '1')
    setShowSplash(false)
    setReady(true)
  }

  return (
    <>
      {showSplash && <SplashScreen onComplete={handleComplete} />}
      {/* Content fades in after splash */}
      <div
        style={{
          opacity: ready ? 1 : 0,
          transition: 'opacity 0.5s ease',
        }}
      >
        {children}
      </div>
    </>
  )
}