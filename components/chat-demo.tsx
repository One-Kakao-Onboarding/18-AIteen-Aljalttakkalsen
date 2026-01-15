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

interface Notification {
  id: string
  message: string
  chatName: string
  timestamp: Date
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
  notificationConditions: Array<{ id: string; condition: string }>
  notificationSensitivity: NotificationSensitivity
  notifiedTopics: string[]
}

type RightPhoneScreen = "off" | "list" | "chat" | "global-settings" | "individual-settings"

export function ChatDemo() {
  const [messages, setMessages] = useState<Message[]>([])
  const [rightPhoneScreen, setRightPhoneScreen] = useState<RightPhoneScreen>("off")
  const [notifications, setNotifications] = useState<Notification[]>([])
  const notificationTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map())
  const [showConditionModal, setShowConditionModal] = useState(false)
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [conditionInput, setConditionInput] = useState("")
  const [sensitivityInput, setSensitivityInput] = useState<NotificationSensitivity>("medium")
  const [showGlobalModal, setShowGlobalModal] = useState(false)
  const [globalConditionInput, setGlobalConditionInput] = useState("")
  const [globalSensitivityInput, setGlobalSensitivityInput] = useState<NotificationSensitivity>("medium")
  const [globalConditions, setGlobalConditions] = useState<Array<{ id: string; condition: string }>>([])
  const [globalSensitivity, setGlobalSensitivity] = useState<NotificationSensitivity>("medium")
  const [globalNotificationEnabled, setGlobalNotificationEnabled] = useState(false)
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([
    {
      id: "main",
      name: "상대방",
      lastMessage: "메시지를 보내보세요",
      unreadCount: 0,
      avatar: "👤",
      time: "방금",
      notificationEnabled: true,
      notificationConditions: [],
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
      notificationConditions: [],
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
      notificationConditions: [],
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
      notificationConditions: [],
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
      notificationConditions: [],
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
      notificationConditions: [],
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

  // 알림 조건 설정 화면으로 이동
  const handleNotificationSettings = (chatId: string) => {
    setSelectedChatId(chatId)
    setRightPhoneScreen("individual-settings")
  }

  // 개별 채팅방 키워드 추가
  const handleAddIndividualCondition = () => {
    if (conditionInput.trim() && selectedChatId) {
      const room = chatRooms.find((r) => r.id === selectedChatId)
      if (room && room.notificationConditions.length < 20) {
        const newCondition = {
          id: Date.now().toString(),
          condition: conditionInput.trim(),
        }
        setChatRooms((prev) =>
          prev.map((r) =>
            r.id === selectedChatId
              ? { ...r, notificationConditions: [...r.notificationConditions, newCondition] }
              : r
          )
        )
        setConditionInput("")
      }
    }
  }

  // 개별 채팅방 키워드 삭제
  const handleRemoveIndividualCondition = (conditionId: string) => {
    if (selectedChatId) {
      setChatRooms((prev) =>
        prev.map((r) =>
          r.id === selectedChatId
            ? { ...r, notificationConditions: r.notificationConditions.filter((c) => c.id !== conditionId) }
            : r
        )
      )
    }
  }

  // 전역 알림 설정 화면으로 이동
  const handleGlobalNotificationSettings = () => {
    setRightPhoneScreen("global-settings")
  }

  // 전역 키워드 추가
  const handleAddGlobalCondition = () => {
    if (globalConditionInput.trim() && globalConditions.length < 20) {
      const newCondition = {
        id: Date.now().toString(),
        condition: globalConditionInput.trim(),
      }
      setGlobalConditions([...globalConditions, newCondition])
      setGlobalConditionInput("")
    }
  }

  // 전역 키워드 삭제
  const handleRemoveGlobalCondition = (id: string) => {
    setGlobalConditions(globalConditions.filter((c) => c.id !== id))
  }

  // 여러 조건 동시 매칭 확인 함수 (LLM 사용)
  const checkMultipleConditions = async (
    message: string,
    conditions: Array<{ id: string; condition: string; sensitivity: NotificationSensitivity }>
  ): Promise<Array<{ conditionId: string; shouldNotify: boolean; topic: string }>> => {
    if (conditions.length === 0) return []

    try {
      const response = await fetch("/api/check-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          conditions: conditions.map((c) => ({ id: c.id, condition: c.condition, sensitivity: c.sensitivity })),
        }),
      })

      if (!response.ok) {
        console.error("Failed to check notification conditions")
        return []
      }

      const data = await response.json()
      return data.results || []
    } catch (error) {
      console.error("Error checking notification conditions:", error)
      return []
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

    // 1. 일반 메시지 알림 (알림이 켜져있을 때만)
    if (mainChatRoom?.notificationEnabled) {
      const generalNotification: Notification = {
        id: Date.now().toString(),
        message: text,
        chatName: mainChatRoom.name,
        timestamp: new Date(),
      }

      setNotifications((prev) => [generalNotification, ...prev])
      playNotificationSound()

      // 4초 후 일반 알림 자동 제거
      const generalTimeoutId = setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== generalNotification.id))
        notificationTimeoutsRef.current.delete(generalNotification.id)
      }, 4000)

      notificationTimeoutsRef.current.set(generalNotification.id, generalTimeoutId)
    }

    // 2. 키워드 알림 (알림 on/off 여부와 관계없이 키워드 조건이 있으면 체크)
    // 읽지 않은 메시지 전체를 합침 (새 메시지 포함)
    const unreadMessages = messages.filter((msg) => msg.sender === "other" && !msg.read)
    const allUnreadText = [...unreadMessages.map((msg) => msg.text), text].join(" ")

    // 개별 조건과 전역 조건을 배열로 모음
    const conditionsToCheck: Array<{ id: string; condition: string; sensitivity: NotificationSensitivity }> = []

    if (mainChatRoom && mainChatRoom.notificationConditions.length > 0) {
      mainChatRoom.notificationConditions.forEach((cond) => {
        conditionsToCheck.push({
          id: `individual-${cond.id}`,
          condition: cond.condition,
          sensitivity: mainChatRoom.notificationSensitivity,
        })
      })
    }

    if (globalNotificationEnabled && globalConditions.length > 0) {
      globalConditions.forEach((cond, idx) => {
        conditionsToCheck.push({
          id: `global-${cond.id}`,
          condition: cond.condition,
          sensitivity: globalSensitivity,
        })
      })
    }

    // 조건이 있으면 한 번에 검사
    if (conditionsToCheck.length > 0) {
      console.log("Checking keywords:", allUnreadText, "conditions:", conditionsToCheck)

      const results = await checkMultipleConditions(allUnreadText, conditionsToCheck)

      // 매칭된 토픽들을 수집
      const matchedTopics: string[] = []

      for (const result of results) {
        if (result.shouldNotify && result.topic) {
          // 이미 알림이 간 토픽인지 확인
          const alreadyNotified = mainChatRoom?.notifiedTopics.includes(result.topic)

          if (!alreadyNotified) {
            matchedTopics.push(result.topic)
          }
        }
      }

      // 매칭된 토픽이 있으면 하나의 알림으로 표시
      if (matchedTopics.length > 0) {
        const topicsText = matchedTopics.join(", ")
        const keywordNotification: Notification = {
          id: `${Date.now()}-keywords`,
          message: `${topicsText} 관련 이야기가 나오고 있어요!`,
          chatName: mainChatRoom?.name || "메시지",
          timestamp: new Date(),
        }

        setNotifications((prev) => [keywordNotification, ...prev])
        playNotificationSound()

        // 모든 토픽을 notifiedTopics에 추가
        setChatRooms((prev) =>
          prev.map((room) =>
            room.id === "main" ? { ...room, notifiedTopics: [...room.notifiedTopics, ...matchedTopics] } : room
          )
        )

        // 4초 후 알림 자동 제거
        const timeoutId = setTimeout(() => {
          setNotifications((prev) => prev.filter((n) => n.id !== keywordNotification.id))
          notificationTimeoutsRef.current.delete(keywordNotification.id)
        }, 4000)

        notificationTimeoutsRef.current.set(keywordNotification.id, timeoutId)
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
      setNotifications([])
      // 모든 알림 타이머 정리
      notificationTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout))
      notificationTimeoutsRef.current.clear()
    }
  }

  // 알림 클릭시 채팅방으로 이동
  const handleNotificationClick = (notificationId: string) => {
    // 클릭한 알림 제거
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId))

    // 해당 알림의 타이머 정리
    const timeout = notificationTimeoutsRef.current.get(notificationId)
    if (timeout) {
      clearTimeout(timeout)
      notificationTimeoutsRef.current.delete(notificationId)
    }

    setRightPhoneScreen("chat")
    setMessages((prev) => prev.map((msg) => (msg.sender === "other" ? { ...msg, read: true } : msg)))
    // chatRooms의 unreadCount와 notifiedTopics 초기화
    setChatRooms((prev) =>
      prev.map((room) => (room.id === "main" ? { ...room, unreadCount: 0, notifiedTopics: [] } : room))
    )
  }

  const handleLockScreenClick = () => {
    if (notifications.length === 0) {
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
    setShowGlobalModal(false)
    setShowConditionModal(false)
    setConditionInput("")
    setSelectedChatId(null)
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
      notificationTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout))
      notificationTimeoutsRef.current.clear()
    }
  }, [])

  const renderRightPhoneContent = () => {
    switch (rightPhoneScreen) {
      case "off":
        return (
          <LockScreen onClick={handleLockScreenClick}>
            <div className="w-full space-y-2 px-2">
              {notifications.map((notification) => (
                <NotificationBanner
                  key={notification.id}
                  message={notification.message}
                  chatName={notification.chatName}
                  onClick={() => handleNotificationClick(notification.id)}
                />
              ))}
            </div>
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
              onGlobalNotificationSettings={handleGlobalNotificationSettings}
            />
          </div>
        )
      case "individual-settings":
        const selectedRoom = chatRooms.find((r) => r.id === selectedChatId)
        return (
          <div className="h-full flex flex-col" style={{ backgroundColor: "#ffffff" }}>
            {/* 헤더 */}
            <div className="px-4 py-3 flex items-center border-b border-border" style={{ backgroundColor: "#ffffff" }}>
              <button onClick={handleBackToList} className="mr-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="font-bold text-foreground">{selectedRoom?.name} 알림 설정</span>
            </div>

            {/* 내용 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* 알림 켜기/끄기 토글 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">알림 받기</span>
                  <button
                    onClick={() => handleToggleNotification(selectedChatId!)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      selectedRoom?.notificationEnabled ? "bg-yellow-400" : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        selectedRoom?.notificationEnabled ? "translate-x-6" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">이 채팅방의 메시지에 대한 알림을 받습니다.</p>
              </div>

              {/* 알림 발생 민감도 */}
              <div className="space-y-2">
                <span className="text-sm font-medium text-foreground">알림 발생 민감도</span>
                <p className="text-xs text-muted-foreground">민감도가 낮을수록 관련도가 높은 대화일때만 알림을 보내요</p>
                <div className="flex items-center gap-3 mt-4">
                  <span className="text-xs text-muted-foreground">낮음</span>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    value={
                      selectedRoom?.notificationSensitivity === "low"
                        ? 0
                        : selectedRoom?.notificationSensitivity === "medium"
                        ? 1
                        : 2
                    }
                    onChange={(e) => {
                      const val = Number(e.target.value)
                      const sensitivity = val === 0 ? "low" : val === 1 ? "medium" : "high"
                      setChatRooms((prev) =>
                        prev.map((r) => (r.id === selectedChatId ? { ...r, notificationSensitivity: sensitivity } : r))
                      )
                    }}
                    className="flex-1 h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-gray-400"
                  />
                  <span className="text-xs text-muted-foreground">높음</span>
                </div>
              </div>

              {/* 관심사 리스트 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    관심사 ({selectedRoom?.notificationConditions.length || 0}/20)
                  </span>
                  <button
                    onClick={() => setShowConditionModal(true)}
                    className="px-3 py-1 text-xs border border-border rounded-full text-foreground hover:bg-muted"
                  >
                    추가
                  </button>
                </div>

                {/* 키워드 목록 */}
                <div className="space-y-2">
                  {selectedRoom?.notificationConditions.map((cond) => (
                    <div
                      key={cond.id}
                      className="flex items-center justify-between px-3 py-2 bg-muted/30 rounded-lg"
                    >
                      <span className="text-sm text-foreground">{cond.condition}</span>
                      <button
                        onClick={() => handleRemoveIndividualCondition(cond.id)}
                        className="w-5 h-5 rounded-full bg-gray-400 flex items-center justify-center text-white hover:bg-gray-500"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}

                  {selectedRoom && selectedRoom.notificationConditions.length === 0 && (
                    <p className="text-center text-xs text-muted-foreground py-4">
                      추가 버튼을 눌러 관심사를 등록해보세요
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 키워드 추가 모달 */}
            {showConditionModal && (
              <div
                className="absolute inset-0 z-50 flex items-center justify-center bg-black/50"
                onClick={() => setShowConditionModal(false)}
              >
                <div
                  className="bg-card border border-border rounded-lg shadow-xl p-4 max-w-[300px] w-[90%]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className="text-base font-bold text-foreground mb-3">관심사 추가</h3>
                  <input
                    type="text"
                    value={conditionInput}
                    onChange={(e) => setConditionInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleAddIndividualCondition()
                        setShowConditionModal(false)
                      }
                    }}
                    placeholder="예) 여행 관련 애기"
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-2 justify-end mt-4">
                    <button
                      onClick={() => {
                        setShowConditionModal(false)
                        setConditionInput("")
                      }}
                      className="px-4 py-2 text-sm text-muted-foreground hover:bg-muted/50 rounded-lg"
                    >
                      취소
                    </button>
                    <button
                      onClick={() => {
                        handleAddIndividualCondition()
                        setShowConditionModal(false)
                      }}
                      className="px-4 py-2 text-sm bg-blue-500 text-white hover:bg-blue-600 rounded-lg"
                    >
                      추가
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
      case "global-settings":
        return (
          <div className="h-full flex flex-col" style={{ backgroundColor: "#ffffff" }}>
            {/* 헤더 */}
            <div className="px-4 py-3 flex items-center border-b border-border" style={{ backgroundColor: "#ffffff" }}>
              <button onClick={handleBackToList} className="mr-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="font-bold text-foreground">관심사 알림 설정</span>
            </div>

            {/* 내용 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* 관심사 알림 이용하기 토글 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">관심사 알림 이용하기</span>
                  <button
                    onClick={() => setGlobalNotificationEnabled(!globalNotificationEnabled)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      globalNotificationEnabled ? "bg-yellow-400" : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        globalNotificationEnabled ? "translate-x-6" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  등록된 관심사에 관련된 대화가 이루어지면 채팅방 알림이 꺼져 있어도 푸시 알림을 받게됩니다.
                </p>
              </div>

              {/* 알림 발생 민감도 */}
              <div className="space-y-2">
                <span className="text-sm font-medium text-foreground">알림 발생 민감도</span>
                <p className="text-xs text-muted-foreground">민감도가 낮을수록 관련도가 높은 대화일때만 알림을 보내요</p>
                <div className="flex items-center gap-3 mt-4">
                  <span className="text-xs text-muted-foreground">낮음</span>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    value={globalSensitivity === "low" ? 0 : globalSensitivity === "medium" ? 1 : 2}
                    onChange={(e) => {
                      const val = Number(e.target.value)
                      setGlobalSensitivity(val === 0 ? "low" : val === 1 ? "medium" : "high")
                    }}
                    className="flex-1 h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-gray-400"
                  />
                  <span className="text-xs text-muted-foreground">높음</span>
                </div>
              </div>

              {/* 관심사 리스트 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">관심사 ({globalConditions.length}/20)</span>
                  <button
                    onClick={() => setShowGlobalModal(true)}
                    className="px-3 py-1 text-xs border border-border rounded-full text-foreground hover:bg-muted"
                  >
                    추가
                  </button>
                </div>

                {/* 키워드 목록 */}
                <div className="space-y-2">
                  {globalConditions.map((cond) => (
                    <div
                      key={cond.id}
                      className="flex items-center justify-between px-3 py-2 bg-muted/30 rounded-lg"
                    >
                      <span className="text-sm text-foreground">{cond.condition}</span>
                      <button
                        onClick={() => handleRemoveGlobalCondition(cond.id)}
                        className="w-5 h-5 rounded-full bg-gray-400 flex items-center justify-center text-white hover:bg-gray-500"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}

                  {globalConditions.length === 0 && (
                    <p className="text-center text-xs text-muted-foreground py-4">
                      추가 버튼을 눌러 관심사를 등록해보세요
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 키워드 추가 모달 */}
            {showGlobalModal && (
              <div
                className="absolute inset-0 z-50 flex items-center justify-center bg-black/50"
                onClick={() => setShowGlobalModal(false)}
              >
                <div
                  className="bg-card border border-border rounded-lg shadow-xl p-4 max-w-[300px] w-[90%]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className="text-base font-bold text-foreground mb-3">관심사 추가</h3>
                  <input
                    type="text"
                    value={globalConditionInput}
                    onChange={(e) => setGlobalConditionInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleAddGlobalCondition()
                        setShowGlobalModal(false)
                      }
                    }}
                    placeholder="예) 여행 관련 애기"
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-2 justify-end mt-4">
                    <button
                      onClick={() => {
                        setShowGlobalModal(false)
                        setGlobalConditionInput("")
                      }}
                      className="px-4 py-2 text-sm text-muted-foreground hover:bg-muted/50 rounded-lg"
                    >
                      취소
                    </button>
                    <button
                      onClick={() => {
                        handleAddGlobalCondition()
                        setShowGlobalModal(false)
                      }}
                      className="px-4 py-2 text-sm bg-blue-500 text-white hover:bg-blue-600 rounded-lg"
                    >
                      추가
                    </button>
                  </div>
                </div>
              </div>
            )}
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
