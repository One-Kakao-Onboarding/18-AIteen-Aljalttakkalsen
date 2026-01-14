"use client"

interface NotificationBannerProps {
  message: string
  onClick: () => void
}

export function NotificationBanner({ message, onClick }: NotificationBannerProps) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-card/90 backdrop-blur-md rounded-2xl p-3 shadow-lg flex items-center gap-3 text-left hover:bg-card transition-colors animate-in slide-in-from-top duration-300"
    >
      {/* 앱 아이콘 */}
      <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
        <span className="text-lg">💬</span>
      </div>
      {/* 내용 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground">메시지</span>
          <span className="text-[10px] text-muted-foreground">지금</span>
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{message}</p>
      </div>
    </button>
  )
}
