"use client"

import type { ReactNode } from "react"

interface PhoneMockupProps {
  children: ReactNode
  onPowerButtonClick?: () => void
}

export function PhoneMockup({ children, onPowerButtonClick }: PhoneMockupProps) {
  return (
    <div className="relative">
      {/* 폰 프레임 */}
      <div className="w-[280px] h-[580px] bg-foreground rounded-[40px] p-2 shadow-2xl relative">
        {/* 전원 버튼 (오른쪽) */}
        {onPowerButtonClick && (
          <button
            onClick={onPowerButtonClick}
            className="absolute -right-1 top-[120px] w-1 h-16 bg-foreground/80 hover:bg-foreground transition-colors cursor-pointer rounded-l-sm"
            aria-label="전원 버튼"
          />
        )}
        {/* 내부 스크린 */}
        <div className="w-full h-full bg-card rounded-[32px] overflow-hidden relative">
          {/* 노치 */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-foreground rounded-b-2xl z-10" />
          {/* 컨텐츠 */}
          <div className="h-full pt-6">{children}</div>
        </div>
      </div>
    </div>
  )
}
