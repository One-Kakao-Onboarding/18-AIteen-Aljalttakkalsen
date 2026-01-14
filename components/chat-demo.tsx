"use client"

import { useState, useRef, useEffect } from "react"
import { PhoneMockup } from "./phone-mockup"
import { ChatScreen } from "./chat-screen"
import { LockScreen } from "./lock-screen"
import { NotificationBanner } from "./notification-banner"
import { ChatListScreen } from "./chat-list-screen"

interface Message {
  id: string
  text: string
  sender: "me" | "other"
  timestamp: Date
  read: boolean
}

type RightPhoneScreen = "off" | "list" | "chat"

export function ChatDemo() {
  const [messages, setMessages] = useState<Message[]>([])
  const [rightPhoneScreen, setRightPhoneScreen] = useState<RightPhoneScreen>("off")
  const [showNotification, setShowNotification] = useState(false)
  const [pendingNotification, setPendingNotification] = useState<Message | null>(null)
  const screenTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const unreadCount = messages.filter((msg) => msg.sender === "other" && !msg.read).length
  const lastMessage = messages.length > 0 ? messages[messages.length - 1].text : undefined

  const sendMessage = (text: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: "other",
      timestamp: new Date(),
      read: false,
    }
    setMessages((prev) => [...prev, newMessage])
    setPendingNotification(newMessage)
    setShowNotification(true)
  }

  const sendReply = (text: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: "me",
      timestamp: new Date(),
      read: true,
    }
    setMessages((prev) => [...prev, newMessage])
    resetScreenTimeout()
  }

  // 알림 클릭시 채팅방으로 이동
  const handleNotificationClick = () => {
    setShowNotification(false)
    setRightPhoneScreen("chat")
    setMessages((prev) => prev.map((msg) => (msg.sender === "other" ? { ...msg, read: true } : msg)))
    resetScreenTimeout()
  }

  const handleLockScreenClick = () => {
    if (!showNotification) {
      setRightPhoneScreen("list")
      resetScreenTimeout()
    }
  }

  const handleSelectChat = (chatId: string) => {
    if (chatId === "main") {
      setRightPhoneScreen("chat")
      setMessages((prev) => prev.map((msg) => (msg.sender === "other" ? { ...msg, read: true } : msg)))
    }
    resetScreenTimeout()
  }

  const handleBackToList = () => {
    setRightPhoneScreen("list")
    resetScreenTimeout()
  }

  // 화면 자동 꺼짐 타이머
  const resetScreenTimeout = () => {
    if (screenTimeoutRef.current) {
      clearTimeout(screenTimeoutRef.current)
    }
    screenTimeoutRef.current = setTimeout(() => {
      setRightPhoneScreen("off")
    }, 8000)
  }

  // 오른쪽 폰 활동시 타이머 리셋
  const handleRightPhoneActivity = () => {
    if (rightPhoneScreen !== "off") {
      resetScreenTimeout()
    }
  }

  useEffect(() => {
    if (rightPhoneScreen === "chat") {
      setMessages((prev) => prev.map((msg) => (msg.sender === "other" ? { ...msg, read: true } : msg)))
    }
  }, [rightPhoneScreen])

  // 클린업
  useEffect(() => {
    return () => {
      if (screenTimeoutRef.current) {
        clearTimeout(screenTimeoutRef.current)
      }
    }
  }, [])

  const renderRightPhoneContent = () => {
    switch (rightPhoneScreen) {
      case "off":
        return (
          <LockScreen onClick={handleLockScreenClick}>
            {showNotification && pendingNotification && (
              <NotificationBanner message={pendingNotification.text} onClick={handleNotificationClick} />
            )}
          </LockScreen>
        )
      case "list":
        return (
          <div onClick={handleRightPhoneActivity} className="h-full">
            <ChatListScreen unreadFromMe={unreadCount} onSelectChat={handleSelectChat} lastMessageFromMe={lastMessage} />
          </div>
        )
      case "chat":
        return (
          <div onClick={handleRightPhoneActivity} className="h-full">
            <ChatScreen
              messages={messages}
              onSendMessage={sendReply}
              isMe={true}
              showBackButton={true}
              onBack={handleBackToList}
            />
          </div>
        )
    }
  }

  return (
    <div className="flex flex-col items-center gap-8">
      <h1 className="text-2xl font-bold text-foreground">채팅 데모</h1>
      <p className="text-muted-foreground text-sm">왼쪽 폰에서 메시지를 보내면 오른쪽 폰에 알림이 나타납니다</p>
      <div className="flex flex-col md:flex-row gap-8 md:gap-16">
        <div className="flex flex-col items-center gap-2">
          <span className="text-sm text-muted-foreground">상대방</span>
          <PhoneMockup>
            <ChatScreen messages={messages} onSendMessage={sendMessage} isMe={false} />
          </PhoneMockup>
        </div>

        <div className="flex flex-col items-center gap-2">
          <span className="text-sm text-muted-foreground">나</span>
          <PhoneMockup>{renderRightPhoneContent()}</PhoneMockup>
        </div>
      </div>
    </div>
  )
}
