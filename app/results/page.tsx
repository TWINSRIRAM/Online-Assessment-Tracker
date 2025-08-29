"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Trophy } from "lucide-react"

interface AssessmentResult {
  totalScore: number
  totalMarks: number
  correctAnswers: number
  wrongAnswers: number
  submittedAt: string
  answeredQuestions?: number
  totalAvailableQuestions?: number
  marksFromAnsweredQuestions?: number
  totalExamMarks?: number
  reviewData?: any
}

export default function ResultsPage() {
  const [result, setResult] = useState<AssessmentResult | null>(null)
  const [studentName, setStudentName] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    console.log("[v0] Results page mounted, checking session data")

    try {
      const resultData = sessionStorage.getItem("assessmentResult")
      const name = sessionStorage.getItem("studentName")

      console.log("[v0] Session data found:", { hasResult: !!resultData, hasName: !!name })

      if (!resultData || !name) {
        console.log("[v0] Missing session data, redirecting to home")
        window.location.href = "/"
        return
      }

      const parsedResult = JSON.parse(resultData)
      console.log("[v0] Parsed result:", parsedResult)

      setResult(parsedResult.result)
      setStudentName(name)
      setIsLoading(false)

      if (parsedResult.result.reviewData) {
        sessionStorage.setItem("reviewData", JSON.stringify(parsedResult.result.reviewData))
      }

      // Removed navigation/keyboard/context menu locks and history stuffing.
      // Allow normal navigation now that SEB provides the exam security.
    } catch (error) {
      console.log("[v0] Error in main useEffect:", error)
      window.location.href = "/"
    }
  }, [router])

  if (isLoading || !result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  console.log("[v0] Rendering results page with data:", result)

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Trophy className="h-16 w-16 text-yellow-500" />
          </div>
          <CardTitle className="text-2xl text-green-700">Assessment Complete!</CardTitle>
          <p className="text-gray-600">Congratulations, {studentName}</p>
          {/* Removed "Navigation locked" note and lock icon */}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {result.totalScore}/{result.totalMarks}
              </div>
              <div className="text-sm text-gray-600">Total Marks</div>
              {result.answeredQuestions && result.totalAvailableQuestions && (
                <div className="text-xs text-gray-500 mt-1">
                  Attempted: {result.answeredQuestions}/{result.totalAvailableQuestions} questions
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <div className="text-lg font-semibold text-green-700">{result.correctAnswers}</div>
                <div className="text-sm text-green-600">Correct</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <XCircle className="h-6 w-6 text-red-600 mx-auto mb-2" />
                <div className="text-lg font-semibold text-red-700">{result.wrongAnswers}</div>
                <div className="text-sm text-red-600">Wrong</div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {result.wrongAnswers > 0 && (
              <Button
                onClick={() => {
                  console.log("[v0] Navigating to wrong answers page")
                  router.push("/wrong-answers")
                }}
                variant="destructive"
                className="w-full mb-2 flex items-center gap-2"
              >
                <XCircle className="h-4 w-4" />
                View Wrong Answers ({result.wrongAnswers})
              </Button>
            )}
            <Button
              onClick={() => {
                console.log("[v0] Printing results")
                window.print()
              }}
              variant="outline"
              className="w-full"
            >
              Print Results
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
