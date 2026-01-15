"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Send, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Message {
  id: string
  text: string
  sender: "me" | "other"
  timestamp: Date
  read: boolean
}

interface ChatScreenProps {
  messages: Message[]
  onSendMessage: (text: string) => void | Promise<void>
  isMe: boolean
  onBack?: () => void
  showBackButton?: boolean
}

export function ChatScreen({ messages, onSendMessage, isMe, onBack, showBackButton }: ChatScreenProps) {
  const [inputValue, setInputValue] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim()) {
      const messageText = inputValue.trim()
      setInputValue("")
      onSendMessage(messageText)
    }
  }

  // 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // 메시지 시간 포맷
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: "#ffffff" }}>
      {/* 헤더 */}
      <div className="px-4 py-3 flex items-center gap-3 border-b border-border" style={{ backgroundColor: "#ffffff" }}>
        {showBackButton && (
          <button onClick={onBack} className="p-1 -ml-2 hover:bg-muted rounded-full transition-colors">
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
        )}
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <span className="text-xs">👤</span>
        </div>
        <span className="font-medium text-sm text-foreground">{isMe ? "상대방" : "주인공"}</span>
      </div>

      {/* 메시지 영역 */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-2" style={{ backgroundColor: "#ffffff" }}>
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground text-xs mt-8">메시지를 보내보세요</div>
        )}
        {messages.map((message) => {
          const isMine = (isMe && message.sender === "me") || (!isMe && message.sender === "other")
          return (
            <div key={message.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div className={`flex items-end gap-1 max-w-[80%] ${isMine ? "flex-row-reverse" : ""}`}>
                <div
                  className={`px-3 py-2 rounded-2xl text-sm ${isMine ? "rounded-tr-sm" : "rounded-tl-sm"}`}
                  style={{
                    backgroundColor: isMine ? "#fee500" : "#f6f6f6",
                    color: "#000000",
                  }}
                >
                  {message.text}
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  {!isMe && message.sender === "other" && !message.read && (
                    <span className="text-[10px] text-unread font-bold">1</span>
                  )}
                  <span className="text-[10px] text-muted-foreground">{formatTime(message.timestamp)}</span>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* 입력 영역 */}
      <form onSubmit={handleSubmit} className="p-2 pb-7 pr-4 pl-4 border-t border-border" style={{ backgroundColor: "#ffffff" }}>
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="메시지를 입력하세요"
            className="flex-1 text-sm h-9 bg-muted border-0"
          />
          <Button type="submit" size="sm" className="h-9 w-9 p-0 bg-[#ffffff] hover:bg-[#fee500]">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  )
}
