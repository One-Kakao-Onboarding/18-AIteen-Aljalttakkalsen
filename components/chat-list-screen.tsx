"use client"

import { MessageCircle } from "lucide-react"

interface ChatRoom {
  id: string
  name: string
  lastMessage: string
  unreadCount: number
  avatar: string
  time: string
}

interface ChatListScreenProps {
  unreadFromMe: number
  onSelectChat: (chatId: string) => void
  lastMessageFromMe?: string
}

export function ChatListScreen({ unreadFromMe, onSelectChat, lastMessageFromMe }: ChatListScreenProps) {
  // 더미 채팅방 데이터
  const chatRooms: ChatRoom[] = [
    {
      id: "main",
      name: "상대방",
      lastMessage: lastMessageFromMe || "메시지를 보내보세요",
      unreadCount: unreadFromMe,
      avatar: "👤",
      time: "방금",
    },
    {
      id: "group1",
      name: "가족방",
      lastMessage: "저녁 뭐 먹을까요?",
      unreadCount: 23,
      avatar: "👨‍👩‍👧‍👦",
      time: "오후 2:30",
    },
    {
      id: "friend1",
      name: "김철수",
      lastMessage: "내일 시간 돼?",
      unreadCount: 3,
      avatar: "🧑",
      time: "오후 1:15",
    },
    {
      id: "group2",
      name: "회사 동료들",
      lastMessage: "회의 시간 변경됐습니다",
      unreadCount: 47,
      avatar: "💼",
      time: "오전 11:00",
    },
    {
      id: "friend2",
      name: "박영희",
      lastMessage: "사진 보내줘~",
      unreadCount: 0,
      avatar: "👩",
      time: "어제",
    },
    {
      id: "friend3",
      name: "이민수",
      lastMessage: "ㅋㅋㅋㅋㅋ",
      unreadCount: 12,
      avatar: "🧔",
      time: "어제",
    },
  ]

  return (
    <div className="h-full flex flex-col bg-chat-bg">
      {/* 헤더 */}
      <div className="bg-chat-header px-4 py-3 flex items-center justify-between border-b border-border">
        <span className="font-bold text-foreground">채팅</span>
        <MessageCircle className="w-5 h-5 text-muted-foreground" />
      </div>

      {/* 채팅방 리스트 */}
      <div className="flex-1 overflow-y-auto">
        {chatRooms.map((room) => (
          <button
            key={room.id}
            onClick={() => onSelectChat(room.id)}
            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors border-b border-border/50"
          >
            {/* 아바타 */}
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              <span className="text-xl">{room.avatar}</span>
            </div>

            {/* 채팅방 정보 */}
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm text-foreground truncate">{room.name}</span>
                <span className="text-[10px] text-muted-foreground flex-shrink-0">{room.time}</span>
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <span className="text-xs text-muted-foreground truncate">{room.lastMessage}</span>
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
    </div>
  )
}
