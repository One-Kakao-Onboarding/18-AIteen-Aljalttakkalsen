"use client"

import type { ReactNode } from "react"

interface LockScreenProps {
  children?: ReactNode
  onClick?: () => void
}

export function LockScreen({ children, onClick }: LockScreenProps) {
  const now = new Date()
  const timeString = now.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  })
  const dateString = now.toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "long",
  })

  return (
    <div onClick={onClick} className="h-full bg-lock-screen flex flex-col relative cursor-pointer">
      {/* 시간 및 날짜 */}
      <div className="flex-1 flex flex-col items-center justify-center text-lock-screen-foreground">
        <span className="text-5xl font-light">{timeString}</span>
        <span className="text-sm mt-2 opacity-80">{dateString}</span>
      </div>

      {/* 알림 영역 */}
      <div className="absolute top-20 left-0 right-0 px-3">{children}</div>

      {/* 하단 인디케이터 */}
      <div className="pb-6 flex justify-center">
        <div className="w-32 h-1 bg-lock-screen-foreground/30 rounded-full" />
      </div>
    </div>
  )
}
