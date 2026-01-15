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

type NotificationSensitivity = "high" | "medium" | "low"

interface ChatRoom {
  id: string
  name: string
  lastMessage: string
  unreadCount: number
  avatar: string
  time: string
  notificationEnabled: boolean
  notificationCondition?: string
  notificationSensitivity: NotificationSensitivity
  notifiedTopics: string[]
}

type RightPhoneScreen = "off" | "list" | "chat"

export function ChatDemo() {
  const [messages, setMessages] = useState<Message[]>([])
  const [rightPhoneScreen, setRightPhoneScreen] = useState<RightPhoneScreen>("off")
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState<string>("")
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [showConditionModal, setShowConditionModal] = useState(false)
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [conditionInput, setConditionInput] = useState("")
  const [sensitivityInput, setSensitivityInput] = useState<NotificationSensitivity>("medium")
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([
    {
      id: "main",
      name: "상대방",
      lastMessage: "메시지를 보내보세요",
      unreadCount: 0,
      avatar: "👤",
      time: "방금",
      notificationEnabled: true,
      notificationSensitivity: "medium",
      notifiedTopics: [],
    },
    {
      id: "group1",
      name: "가족방",
      lastMessage: "저녁 뭐 먹을까요?",
      unreadCount: 23,
      avatar: "👨‍👩‍👧‍👦",
      time: "오후 2:30",
      notificationEnabled: true,
      notificationSensitivity: "medium",
      notifiedTopics: [],
    },
    {
      id: "friend1",
      name: "김철수",
      lastMessage: "내일 시간 돼?",
      unreadCount: 3,
      avatar: "🧑",
      time: "오후 1:15",
      notificationEnabled: true,
      notificationSensitivity: "medium",
      notifiedTopics: [],
    },
    {
      id: "group2",
      name: "회사 동료들",
      lastMessage: "회의 시간 변경됐습니다",
      unreadCount: 47,
      avatar: "💼",
      time: "오전 11:00",
      notificationEnabled: true,
      notificationSensitivity: "medium",
      notifiedTopics: [],
    },
    {
      id: "friend2",
      name: "박영희",
      lastMessage: "사진 보내줘~",
      unreadCount: 0,
      avatar: "👩",
      time: "어제",
      notificationEnabled: true,
      notificationSensitivity: "medium",
      notifiedTopics: [],
    },
    {
      id: "friend3",
      name: "이민수",
      lastMessage: "ㅋㅋㅋㅋㅋ",
      unreadCount: 12,
      avatar: "🧔",
      time: "어제",
      notificationEnabled: true,
      notificationSensitivity: "medium",
      notifiedTopics: [],
    },
  ])

  const unreadCount = messages.filter((msg) => msg.sender === "other" && !msg.read).length
  const lastMessage = messages.length > 0 ? messages[messages.length - 1].text : undefined
  const mainChatRoom = chatRooms.find((room) => room.id === "main")

  // 알림 토글 핸들러
  const handleToggleNotification = (chatId: string) => {
    setChatRooms((prev) =>
      prev.map((room) => (room.id === chatId ? { ...room, notificationEnabled: !room.notificationEnabled } : room))
    )
  }

  // 알림 조건 설정 핸들러
  const handleNotificationSettings = (chatId: string) => {
    const room = chatRooms.find((r) => r.id === chatId)
    if (room) {
      setSelectedChatId(chatId)
      setConditionInput(room.notificationCondition || "")
      setSensitivityInput(room.notificationSensitivity)
      setShowConditionModal(true)
    }
  }

  // 알림 조건 저장
  const handleSaveCondition = () => {
    if (selectedChatId) {
      setChatRooms((prev) =>
        prev.map((room) =>
          room.id === selectedChatId
            ? {
                ...room,
                notificationCondition: conditionInput.trim() || undefined,
                notificationSensitivity: sensitivityInput,
                notificationEnabled: true,
              }
            : room
        )
      )
    }
    setShowConditionModal(false)
    setConditionInput("")
    setSensitivityInput("medium")
    setSelectedChatId(null)
  }

  // 알림 조건 삭제
  const handleRemoveCondition = () => {
    if (selectedChatId) {
      setChatRooms((prev) =>
        prev.map((room) => (room.id === selectedChatId ? { ...room, notificationCondition: undefined } : room))
      )
    }
    setShowConditionModal(false)
    setConditionInput("")
    setSelectedChatId(null)
  }

  // 조건 매칭 확인 함수 (LLM 사용)
  const checkConditionMatch = async (
    message: string,
    condition?: string,
    sensitivity: NotificationSensitivity = "medium"
  ): Promise<{ shouldNotify: boolean; topic: string }> => {
    if (!condition) return { shouldNotify: true, topic: "" } // 조건이 없으면 항상 알림

    try {
      const response = await fetch("/api/check-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message, condition, sensitivity }),
      })

      if (!response.ok) {
        console.error("Failed to check notification condition")
        return { shouldNotify: true, topic: "" } // API 실패 시 기본적으로 알림 허용
      }

      const data = await response.json()
      return { shouldNotify: data.shouldNotify, topic: data.topic || "" }
    } catch (error) {
      console.error("Error checking notification condition:", error)
      return { shouldNotify: true, topic: "" } // 에러 시 기본적으로 알림 허용
    }
  }

  // 알림음 재생 함수
  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      // 알림음 설정 (두 번의 짧은 비프음)
      oscillator.frequency.value = 800
      oscillator.type = "sine"

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.1)

      // 두 번째 비프음
      const oscillator2 = audioContext.createOscillator()
      const gainNode2 = audioContext.createGain()

      oscillator2.connect(gainNode2)
      gainNode2.connect(audioContext.destination)

      oscillator2.frequency.value = 1000
      oscillator2.type = "sine"

      gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime + 0.15)
      gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.25)

      oscillator2.start(audioContext.currentTime + 0.15)
      oscillator2.stop(audioContext.currentTime + 0.25)
    } catch (error) {
      console.error("알림음 재생 실패:", error)
    }
  }

  const sendMessage = async (text: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: "other",
      timestamp: new Date(),
      read: false,
    }
    setMessages((prev) => [...prev, newMessage])

    // chatRooms의 main 채팅방 업데이트
    setChatRooms((prev) =>
      prev.map((room) =>
        room.id === "main"
          ? {
              ...room,
              lastMessage: text,
              unreadCount: messages.filter((msg) => msg.sender === "other" && !msg.read).length + 1,
            }
          : room
      )
    )

    // 알림이 켜져 있는지 확인
    if (mainChatRoom?.notificationEnabled) {
      // 읽지 않은 메시지 전체를 합침 (새 메시지 포함)
      const unreadMessages = messages.filter((msg) => msg.sender === "other" && !msg.read)
      const allUnreadText = [...unreadMessages.map((msg) => msg.text), text].join(" ")

      console.log("Checking unread messages:", allUnreadText)

      // LLM으로 조건 체크 (읽지 않은 메시지 전체 + 민감도)
      const { shouldNotify, topic } = await checkConditionMatch(
        allUnreadText,
        mainChatRoom.notificationCondition,
        mainChatRoom.notificationSensitivity
      )

      if (shouldNotify) {
        // 이미 알림이 간 토픽인지 확인
        const alreadyNotified = topic && mainChatRoom.notifiedTopics.includes(topic)

        if (!alreadyNotified) {
          // 알림 메시지 생성
          let notifText = ""
          if (mainChatRoom.notificationCondition && topic) {
            // 조건이 있고 주제가 추출된 경우
            notifText = `${topic} 관련 이야기가 나오고 있어요!`
          } else {
            // 조건이 없는 경우 (일반 알림)
            notifText = text
          }

          setNotificationMessage(notifText)
          setShowNotification(true)

          // 알림음 재생
          playNotificationSound()

          // 토픽을 notifiedTopics에 추가
          if (topic) {
            setChatRooms((prev) =>
              prev.map((room) =>
                room.id === "main" ? { ...room, notifiedTopics: [...room.notifiedTopics, topic] } : room
              )
            )
          }

          // 기존 타이머가 있으면 제거
          if (notificationTimeoutRef.current) {
            clearTimeout(notificationTimeoutRef.current)
          }

          // 4초 후 알림 자동 숨김
          notificationTimeoutRef.current = setTimeout(() => {
            setShowNotification(false)
          }, 4000)
        }
      }
    }
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
  }

  // 전원 버튼 핸들러
  const handlePowerButton = () => {
    if (rightPhoneScreen === "off") {
      setRightPhoneScreen("list")
    } else {
      setRightPhoneScreen("off")
      setShowNotification(false)
      // 알림 타이머 정리
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current)
      }
    }
  }

  // 알림 클릭시 채팅방으로 이동
  const handleNotificationClick = () => {
    setShowNotification(false)
    setRightPhoneScreen("chat")
    setMessages((prev) => prev.map((msg) => (msg.sender === "other" ? { ...msg, read: true } : msg)))
    // chatRooms의 unreadCount와 notifiedTopics 초기화
    setChatRooms((prev) =>
      prev.map((room) => (room.id === "main" ? { ...room, unreadCount: 0, notifiedTopics: [] } : room))
    )
    // 알림 타이머 정리
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current)
    }
  }

  const handleLockScreenClick = () => {
    if (!showNotification) {
      setRightPhoneScreen("list")
    }
  }

  const handleSelectChat = (chatId: string) => {
    if (chatId === "main") {
      setRightPhoneScreen("chat")
      setMessages((prev) => prev.map((msg) => (msg.sender === "other" ? { ...msg, read: true } : msg)))
      // chatRooms의 unreadCount와 notifiedTopics 초기화
      setChatRooms((prev) =>
        prev.map((room) => (room.id === "main" ? { ...room, unreadCount: 0, notifiedTopics: [] } : room))
      )
    }
  }

  const handleBackToList = () => {
    setRightPhoneScreen("list")
  }

  useEffect(() => {
    if (rightPhoneScreen === "chat") {
      setMessages((prev) => prev.map((msg) => (msg.sender === "other" ? { ...msg, read: true } : msg)))
      // chatRooms의 unreadCount와 notifiedTopics 초기화
      setChatRooms((prev) =>
        prev.map((room) => (room.id === "main" ? { ...room, unreadCount: 0, notifiedTopics: [] } : room))
      )
    }
  }, [rightPhoneScreen])

  // 클린업: 알림 타이머 정리
  useEffect(() => {
    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current)
      }
    }
  }, [])

  const renderRightPhoneContent = () => {
    switch (rightPhoneScreen) {
      case "off":
        return (
          <LockScreen onClick={handleLockScreenClick}>
            {showNotification && notificationMessage && (
              <NotificationBanner message={notificationMessage} onClick={handleNotificationClick} />
            )}
          </LockScreen>
        )
      case "list":
        return (
          <div className="h-full relative">
            <ChatListScreen
              unreadFromMe={unreadCount}
              onSelectChat={handleSelectChat}
              lastMessageFromMe={lastMessage}
              chatRooms={chatRooms}
              onToggleNotification={handleToggleNotification}
              onNotificationSettings={handleNotificationSettings}
            />
            {/* 알림 조건 설정 모달 */}
            {showConditionModal && (
              <div
                className="absolute inset-0 z-50 flex items-center justify-center bg-black/50"
                onClick={() => setShowConditionModal(false)}
              >
                <div
                  className="bg-card border border-border rounded-lg shadow-xl p-4 max-w-[320px] w-[90%] max-h-[90%] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h2 className="text-base font-bold text-foreground mb-1">알림 조건 설정</h2>
                  <p className="text-xs text-muted-foreground mb-3">
                    {selectedChatId && chatRooms.find((r) => r.id === selectedChatId)?.name}
                  </p>

                  <div className="mb-3">
                    <label className="block text-xs font-medium text-foreground mb-1">
                      언제 알림을 받고 싶으신가요?
                    </label>
                    <textarea
                      value={conditionInput}
                      onChange={(e) => setConditionInput(e.target.value)}
                      placeholder='예: "여행 예약과 관련된 얘기가 나올 때 알려줘"'
                      className="w-full px-2 py-1.5 text-xs border border-border rounded-lg bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      AI가 메시지 내용을 분석하여 조건에 맞는 알림만 보내드립니다.
                    </p>
                  </div>

                  <div className="mb-3">
                    <label className="block text-xs font-medium text-foreground mb-1">반응 민감도</label>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setSensitivityInput("high")}
                        className={`flex-1 px-2 py-1.5 text-xs rounded-lg transition-colors ${
                          sensitivityInput === "high"
                            ? "bg-blue-500 text-white"
                            : "bg-muted text-foreground hover:bg-muted/70"
                        }`}
                      >
                        높음
                      </button>
                      <button
                        onClick={() => setSensitivityInput("medium")}
                        className={`flex-1 px-2 py-1.5 text-xs rounded-lg transition-colors ${
                          sensitivityInput === "medium"
                            ? "bg-blue-500 text-white"
                            : "bg-muted text-foreground hover:bg-muted/70"
                        }`}
                      >
                        중간
                      </button>
                      <button
                        onClick={() => setSensitivityInput("low")}
                        className={`flex-1 px-2 py-1.5 text-xs rounded-lg transition-colors ${
                          sensitivityInput === "low"
                            ? "bg-blue-500 text-white"
                            : "bg-muted text-foreground hover:bg-muted/70"
                        }`}
                      >
                        낮음
                      </button>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {sensitivityInput === "high" && "조금이라도 관련되면 알림"}
                      {sensitivityInput === "medium" && "명확하게 관련되면 알림"}
                      {sensitivityInput === "low" && "매우 직접적으로 관련될 때만 알림"}
                    </p>
                  </div>

                  <div className="flex gap-1.5 justify-end">
                    {selectedChatId && chatRooms.find((r) => r.id === selectedChatId)?.notificationCondition && (
                      <button
                        onClick={handleRemoveCondition}
                        className="px-3 py-1.5 text-xs text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        조건 삭제
                      </button>
                    )}
                    <button
                      onClick={() => setShowConditionModal(false)}
                      className="px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted/50 rounded-lg transition-colors"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleSaveCondition}
                      className="px-3 py-1.5 text-xs bg-blue-500 text-white hover:bg-blue-600 rounded-lg transition-colors"
                    >
                      저장
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      case "chat":
        return (
          <div className="h-full">
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
          <PhoneMockup onPowerButtonClick={handlePowerButton}>{renderRightPhoneContent()}</PhoneMockup>
        </div>
      </div>
    </div>
  )
}
