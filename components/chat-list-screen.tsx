"use client"

import { useState, useRef } from "react"
import { MessageCircle, Bell, BellOff, Settings } from "lucide-react"

type NotificationSensitivity = "high" | "medium" | "low"

interface ChatRoom {
  id: string
  name: string
  lastMessage: string
  unreadCount: number
  avatar: string
  time: string
  notificationEnabled: boolean
  notificationConditions: Array<{ id: string; condition: string }>
  notificationSensitivity: NotificationSensitivity
}

interface ChatListScreenProps {
  unreadFromMe: number
  onSelectChat: (chatId: string) => void
  lastMessageFromMe?: string
  chatRooms: ChatRoom[]
  onToggleNotification: (chatId: string) => void
  onNotificationSettings: (chatId: string) => void
  onGlobalNotificationSettings: () => void
}

export function ChatListScreen({ unreadFromMe, onSelectChat, lastMessageFromMe, chatRooms, onToggleNotification, onNotificationSettings, onGlobalNotificationSettings }: ChatListScreenProps) {
  const [contextMenu, setContextMenu] = useState<{ chatId: string; x: number; y: number } | null>(null)
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const longPressTriggeredRef = useRef(false)

  const handleTouchStart = (chatId: string, e: React.TouchEvent) => {
    longPressTriggeredRef.current = false
    const touch = e.touches[0]

    longPressTimerRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true
      setContextMenu({ chatId, x: touch.clientX, y: touch.clientY })
    }, 500) // 0.5초 길게 누르기
  }

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
    }
  }

  const handleMouseDown = (chatId: string, e: React.MouseEvent) => {
    longPressTriggeredRef.current = false

    longPressTimerRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true
      setContextMenu({ chatId, x: e.clientX, y: e.clientY })
    }, 500)
  }

  const handleMouseUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
    }
  }

  const handleChatClick = (chatId: string) => {
    if (!longPressTriggeredRef.current) {
      onSelectChat(chatId)
    }
  }

  const handleToggleNotification = (chatId: string) => {
    onToggleNotification(chatId)
    setContextMenu(null)
  }

  const handleNotificationSettings = (chatId: string) => {
    onNotificationSettings(chatId)
    setContextMenu(null)
  }

  const handleCloseContextMenu = () => {
    setContextMenu(null)
  }

  return (
    <div className="h-full flex flex-col relative" style={{ backgroundColor: "#ffffff" }}>
      {/* 헤더 */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-border" style={{ backgroundColor: "#ffffff" }}>
        <span className="font-bold text-foreground">채팅</span>
        <button
          onClick={onGlobalNotificationSettings}
          className="p-1.5 hover:bg-muted/50 rounded-lg transition-colors"
          aria-label="전역 알림 설정"
        >
          <Settings className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* 채팅방 리스트 */}
      <div className="flex-1 overflow-y-auto">
        {chatRooms.map((room) => (
          <button
            key={room.id}
            onClick={() => handleChatClick(room.id)}
            onMouseDown={(e) => handleMouseDown(room.id, e)}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={(e) => handleTouchStart(room.id, e)}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors border-b border-border/50 relative"
          >
            {/* 아바타 */}
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              <span className="text-xl">{room.avatar}</span>
            </div>

            {/* 채팅방 정보 */}
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span className="font-medium text-sm text-foreground truncate">{room.name}</span>
                  {!room.notificationEnabled && (
                    <BellOff className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                  )}
                  {room.notificationConditions.length > 0 && (
                    <Settings className="w-3 h-3 text-blue-500 flex-shrink-0" />
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground flex-shrink-0">{room.time}</span>
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <div className="flex-1 min-w-0">
                  {room.notificationConditions.length > 0 && (
                    <p className="text-[10px] text-blue-500 truncate mb-0.5">
                      조건: {room.notificationConditions.map((c) => c.condition).join(", ")}
                    </p>
                  )}
                  <span className="text-xs text-muted-foreground truncate">{room.lastMessage}</span>
                </div>
                {room.unreadCount > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 bg-unread text-white text-[10px] font-bold rounded-full min-w-[18px] text-center flex-shrink-0">
                    {room.unreadCount > 99 ? "99+" : room.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* 컨텍스트 메뉴 */}
      {contextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={handleCloseContextMenu} />
          <div
            className="fixed z-50 bg-card border border-border rounded-lg shadow-xl py-1 min-w-[160px]"
            style={{
              left: `${contextMenu.x}px`,
              top: `${contextMenu.y}px`,
              transform: "translate(-50%, -100%) translateY(-8px)",
            }}
          >
            {chatRooms.find((r) => r.id === contextMenu.chatId)?.notificationEnabled ? (
              <button
                onClick={() => handleToggleNotification(contextMenu.chatId)}
                className="w-full px-4 py-2 flex items-center gap-2 hover:bg-muted/50 transition-colors text-left text-sm"
              >
                <BellOff className="w-4 h-4" />
                <span>알림 끄기</span>
              </button>
            ) : (
              <button
                onClick={() => handleToggleNotification(contextMenu.chatId)}
                className="w-full px-4 py-2 flex items-center gap-2 hover:bg-muted/50 transition-colors text-left text-sm"
              >
                <Bell className="w-4 h-4" />
                <span>알림 켜기</span>
              </button>
            )}
            <button
              onClick={() => handleNotificationSettings(contextMenu.chatId)}
              className="w-full px-4 py-2 flex items-center gap-2 hover:bg-muted/50 transition-colors text-left text-sm border-t border-border/50"
            >
              <Settings className="w-4 h-4" />
              <span>알림 조건 설정하기</span>
            </button>
          </div>
        </>
      )}
    </div>
  )
}
