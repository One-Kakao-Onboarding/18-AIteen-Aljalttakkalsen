import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { message, condition } = await request.json()

    if (!message || !condition) {
      return NextResponse.json({ error: "Message and condition are required" }, { status: 400 })
    }

    const apiKey = process.env.Gemini_key
    if (!apiKey) {
      console.error("Gemini API key not found in environment variables")
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 })
    }

    console.log("Calling Gemini API with message:", message, "and condition:", condition)

    // Gemini API 호출 (gemini-2.5-flash: 2025년 6월 출시 안정 버전)
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: `사용자가 설정한 알림 조건과 받은 메시지를 분석해서, 메시지가 조건에 해당하는지 판단해주세요.

알림 조건: "${condition}"
받은 메시지: "${message}"

이 메시지가 알림 조건에 해당하나요? 반드시 "YES" 또는 "NO"로만 답변해주세요.`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 10,
      },
    }

    console.log("Request URL:", apiUrl)
    console.log("Request body:", JSON.stringify(requestBody, null, 2))

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    console.log("Response status:", response.status)

    if (!response.ok) {
      const errorData = await response.text()
      console.error("Gemini API error response:", errorData)
      return NextResponse.json(
        { error: "Failed to call Gemini API", details: errorData },
        { status: 500 }
      )
    }

    const data = await response.json()
    console.log("Gemini API response:", JSON.stringify(data, null, 2))

    const result = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toUpperCase()
    console.log("Extracted result:", result)

    const shouldNotify = result?.includes("YES")
    console.log("Should notify:", shouldNotify)

    return NextResponse.json({ shouldNotify })
  } catch (error) {
    console.error("Error in check-notification API:", error)
    return NextResponse.json({ error: "Internal server error", details: String(error) }, { status: 500 })
  }
}
