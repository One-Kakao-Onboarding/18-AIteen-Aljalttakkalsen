import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { message, conditions } = await request.json()

    if (!message || !conditions || conditions.length === 0) {
      return NextResponse.json({ error: "Message and conditions are required" }, { status: 400 })
    }

    const apiKey = process.env.Gemini_key
    if (!apiKey) {
      console.error("Gemini API key not found in environment variables")
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 })
    }

    console.log("Calling Gemini API with message:", message, "conditions:", conditions)

    // 민감도에 따른 판단 기준 설정 함수
    const getSensitivityGuideline = (sensitivity: string) => {
      if (sensitivity === "high") {
        return "조금이라도 관련이 있으면 YES로 판단하세요. 매우 넓게 해석하세요."
      } else if (sensitivity === "medium") {
        return "명확하게 관련이 있을 때만 YES로 판단하세요."
      } else {
        // low
        return "매우 직접적이고 확실하게 관련이 있을 때만 YES로 판단하세요. 엄격하게 판단하세요."
      }
    }

    // 조건 목록을 텍스트로 변환 (민감도 포함)
    const conditionsText = conditions
      .map(
        (cond: any, idx: number) =>
          `${idx + 1}. "${cond.condition}" (민감도: ${getSensitivityGuideline(cond.sensitivity || "medium")})`
      )
      .join("\n")

    // Gemini API 호출 (gemini-2.0-flash-001: thinking 없어서 빠르고 효율적)
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent?key=${apiKey}`

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: `사용자가 설정한 여러 알림 조건과 받은 메시지를 분석해주세요.

알림 조건들 (각 조건마다 민감도가 다름):
${conditionsText}

받은 메시지: "${message}"

각 조건마다 해당 조건의 민감도 기준에 따라 메시지가 해당하는지 판단하고, 해당한다면 조건의 핵심 주제를 간단히 추출해주세요.

응답 형식 (각 조건마다 한 줄씩, 순서대로):
- 해당함: "YES|주제" (예: "YES|돈", "YES|여행 예약")
- 해당 안함: "NO"

예시:
YES|여행
NO

반드시 위 형식으로만 답변해주세요. 각 조건당 정확히 한 줄씩 출력하세요.`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 200,
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

    const result = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
    console.log("Extracted result:", result)

    // 여러 줄 응답 파싱
    const results = []

    if (result) {
      const lines = result.split("\n").filter((line: string) => line.trim())

      // 각 조건에 대한 결과 파싱
      for (let i = 0; i < conditions.length; i++) {
        const line = lines[i] || "NO"
        const upperLine = line.toUpperCase()

        let shouldNotify = false
        let topic = ""

        if (upperLine.includes("YES")) {
          shouldNotify = true
          // "|" 로 분리해서 주제 추출
          const parts = line.split("|")
          if (parts.length > 1) {
            topic = parts[1].trim()
          }
        }

        results.push({
          conditionId: conditions[i].id,
          shouldNotify,
          topic,
        })
      }
    }

    console.log("Parsed results:", results)

    return NextResponse.json({ results })
  } catch (error) {
    console.error("Error in check-notification API:", error)
    return NextResponse.json({ error: "Internal server error", details: String(error) }, { status: 500 })
  }
}
