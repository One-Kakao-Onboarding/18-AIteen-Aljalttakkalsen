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

    // 조건 목록을 텍스트로 변환
    const conditionsText = conditions.map((cond: any, idx: number) => `${idx + 1}. "${cond.condition}"`).join("\n")

    // Gemini API 호출 (gemini-2.0-flash-001: thinking 없어서 빠르고 효율적)
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent?key=${apiKey}`

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: `당신은 채팅 메시지를 분석하여 각 알림 조건과 메시지의 연관도를 확률로 판단하는 시스템입니다.

알림 조건들:
${conditionsText}

받은 메시지: "${message}"

각 조건마다 메시지가 해당 조건과 얼마나 관련이 있는지 0-100 사이의 확률(%)로 판단하세요:
- 0%: 전혀 관련 없음
- 1-30%: 매우 간접적이거나 막연한 관련성
- 31-60%: 어느 정도 관련이 있지만 명확하지 않음
- 61-80%: 명확히 관련이 있음
- 81-100%: 매우 직접적이고 구체적으로 관련됨

판단 예시:
- 조건: "해외여행"
  * "일본 여행 가자" → 95% (매우 구체적)
  * "여행 계획 세우자" → 40% (해외인지 불명확)
  * "놀러가고 싶다" → 15% (막연한 표현)
  * "오늘 점심 뭐 먹지?" → 0% (관련 없음)

- 조건: "운동"
  * "헬스장 가자" → 95%
  * "살 빼고 싶다" → 50%
  * "배부르다" → 5%

응답 형식 (각 조건마다 정확히 한 줄씩, 순서대로):
확률%|주제명

예시:
95|해외여행
40|여행
15|놀러가기
0

반드시 위 형식으로만 답변하세요. 각 조건당 정확히 한 줄씩 출력하세요.`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
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
        const line = lines[i] || "0"
        const condition = conditions[i]
        // 민감도를 역전: 민감도 100 = 임계값 0 (매우 민감), 민감도 0 = 임계값 100 (매우 엄격)
        const threshold = 100 - (condition.sensitivity || 60)

        let probability = 0
        let topic = ""

        // "확률|주제" 형식 파싱
        if (line.includes("|")) {
          const parts = line.split("|")
          probability = parseInt(parts[0].trim()) || 0
          topic = parts[1]?.trim() || ""
        } else {
          // 숫자만 있는 경우
          probability = parseInt(line.trim()) || 0
        }

        const shouldNotify = probability >= threshold

        results.push({
          conditionId: condition.id,
          shouldNotify,
          topic: shouldNotify ? topic || condition.condition : "",
          probability, // 디버깅용
          threshold, // 디버깅용
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
