"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Clock, AlertCircle, Play } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Question, ExamConfig } from "@/lib/google-sheets"

interface StudentAnswer {
  questionId: number
  selectedAnswer: string[]
  textAnswer?: string
}

const AssessmentInterface = () => {
  const [questions, setQuestions] = useState<Question[]>([])
  const [examConfig, setExamConfig] = useState<ExamConfig | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<StudentAnswer[]>([])
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [studentInfo, setStudentInfo] = useState<{ id: string; name: string } | null>(null)
  const [examStarted, setExamStarted] = useState(false)
  const hasSubmitted = useRef(false)

  const router = useRouter()
  const { toast } = useToast()

  const handlePreviousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) setCurrentQuestionIndex((i) => i - 1)
  }, [currentQuestionIndex])

  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) setCurrentQuestionIndex((i) => i + 1)
  }, [currentQuestionIndex, questions.length])

  const startExam = () => {
    setExamStarted(true)
    sessionStorage.setItem("examStarted", "true")
    toast({
      title: "Exam Started",
      description: `You have ${examConfig?.examDurationMinutes ?? 60} minutes to complete the assessment.`,
    })
  }

  const getAnsweredCount = () =>
    answers.filter(
      (ans) =>
        (ans.selectedAnswer && ans.selectedAnswer.length > 0) || (ans.textAnswer && ans.textAnswer.trim().length > 0),
    ).length

  const getAvailableOptions = (question: Question | undefined) => {
    if (!question) return []
    const options = [
      { key: "A" as const, text: question.optionA },
      { key: "B" as const, text: question.optionB },
      { key: "C" as const, text: question.optionC },
      { key: "D" as const, text: question.optionD },
      { key: "E" as const, text: question.optionE },
    ]
    return options.filter((o) => o.text && o.text.trim() !== "")
  }

  const handleAnswerSelect = (optionKey: string) => {
    const currentQuestion = questions[currentQuestionIndex]
    const isMultipleChoice = currentQuestion.questionType === "MSQ"
    setAnswers((prev) =>
      prev.map((ans) => {
        if (ans.questionId === currentQuestion.id) {
          if (isMultipleChoice) {
            const currentSelections = ans.selectedAnswer || []
            const isSelected = currentSelections.includes(optionKey)
            return {
              ...ans,
              selectedAnswer: isSelected
                ? currentSelections.filter((a) => a !== optionKey)
                : [...currentSelections, optionKey],
            }
          } else {
            return { ...ans, selectedAnswer: [optionKey] }
          }
        }
        return ans
      }),
    )
  }

  const handleTextAnswerChange = (value: string) => {
    const currentQuestion = questions[currentQuestionIndex]
    setAnswers((prev) =>
      prev.map((ans) =>
        ans.questionId === currentQuestion.id ? { ...ans, textAnswer: value, selectedAnswer: [] } : ans,
      ),
    )
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  useEffect(() => {
    const loadAssessment = async () => {
      try {
        const studentId = sessionStorage.getItem("studentId")
        const studentName = sessionStorage.getItem("studentName")

        if (!studentId || !studentName) {
          toast({
            title: "Access Denied",
            description: "Please register first to access the assessment",
            variant: "destructive",
          })
          router.push("/")
          return
        }

        setStudentInfo({ id: studentId, name: studentName })

        const sessionId = `${studentId}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
        const response = await fetch(`/api/questions?sessionId=${sessionId}&t=${Date.now()}`, {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache, no-store, must-revalidate", Pragma: "no-cache" },
        })
        const data = await response.json()

        if (response.ok && data.questions.length > 0) {
          setQuestions(data.questions)
          setExamConfig(data.examConfig)

          const durationMinutes = data.examConfig?.examDurationMinutes || 60
          setTimeRemaining(durationMinutes * 60)

          setAnswers(data.questions.map((q: Question) => ({ questionId: q.id, selectedAnswer: [], textAnswer: "" })))
        } else {
          toast({
            title: "Assessment Not Available",
            description: "The test has been disabled by the administrator. No questions are currently available.",
            variant: "destructive",
          })
        }
      } catch {
        toast({
          title: "Error",
          description: "Failed to load assessment. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadAssessment()
  }, [router, toast])

  useEffect(() => {
    if (!examStarted || timeRemaining <= 0 || questions.length === 0) return
    const timer = setTimeout(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          toast({
            title: "Time's Up!",
            description: "Your assessment has been automatically submitted.",
            variant: "destructive",
            className: "fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md",
          })
          handleSubmitExam()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearTimeout(timer)
  }, [timeRemaining, examStarted, questions.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmitExam = useCallback(async () => {
    if (hasSubmitted.current || isSubmitting || !studentInfo) return
    hasSubmitted.current = true
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/assessment/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: Number.parseInt(studentInfo.id),
          answers,
          lockedQuestionIds: [], // evaluate all answers
          studentName: studentInfo.name,
          studentSection: sessionStorage.getItem("studentSection") || "Unknown",
          studentDepartment: sessionStorage.getItem("studentDepartment") || "Unknown",
          studentEmail: sessionStorage.getItem("studentEmail") || "",
          status: "completed",
        }),
      })
      const result = await response.json()
      if (response.ok) {
        sessionStorage.setItem("assessmentResult", JSON.stringify(result))
        router.push("/results")
      } else {
        toast({ title: "Submission Failed", description: result.error || "Please try again", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Failed to submit assessment. Please try again.", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }, [studentInfo, answers, router, toast])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading assessment...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!examStarted && questions.length > 0 && examConfig) {
    const userName = studentInfo?.name
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-blue-700">Online Assessment</CardTitle>
            <p className="text-gray-600">Welcome, {userName}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 p-6 rounded-lg space-y-4">
              <h3 className="font-semibold text-lg text-blue-900">Assessment Instructions</h3>
              <div className="space-y-2 text-blue-800">
                <p>
                  • Total Questions: <strong>{questions.length}</strong>
                </p>
                <p>
                  • Time Duration: <strong>{examConfig.examDurationMinutes} minutes</strong>
                </p>
                <p>• Your selections are saved automatically; you can change them before submitting</p>
                <p>• The assessment will auto‑submit when time runs out</p>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertCircle className="h-5 w-5" />
                <p className="font-medium">Important: Once you start, the timer cannot be paused.</p>
              </div>
            </div>

            <div className="text-center">
              <Button onClick={startExam} size="lg" className="bg-green-600 hover:bg-green-700 flex items-center gap-2">
                <Play className="h-5 w-5" />
                Start Assessment
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-orange-700">Assessment Not Available</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-orange-500 mx-auto" />
            <p className="text-gray-600">No questions are currently available. Please contact your administrator.</p>
            <Button onClick={() => router.push("/")} variant="outline">
              Back to Registration
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const isNATQuestion = currentQuestion?.questionType === "NAT"
  const availableOptions = getAvailableOptions(currentQuestion)
  const userName = studentInfo?.name
  const answeredCount = getAnsweredCount()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto p-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">Online Assessment</h1>
              <p className="text-gray-600">Welcome, {userName}</p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={handleSubmitExam}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700"
                disabled={isSubmitting}
              >
                Submit Assessment
              </Button>
              <div className="flex items-center gap-2 bg-green-100 px-3 py-1 rounded-full">
                <Clock className="h-4 w-4 text-green-600" />
                <span className="text-green-700 font-medium">{formatTime(timeRemaining)}</span>
              </div>
              <div className="bg-blue-100 px-3 py-1 rounded-full">
                <span className="text-blue-700 font-medium">
                  {answeredCount} / {questions.length} Answered
                </span>
              </div>
            </div>
          </div>
          <Progress value={((currentQuestionIndex + 1) / questions.length) * 100} className="h-2 mt-4" />
        </div>
      </div>

      <div className="flex container mx-auto">
        <div className="flex-1 p-6">
          <Card className="mb-6">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </CardTitle>
                <div className="flex gap-2">
                  <Badge variant="outline">
                    {currentQuestion?.marks} Mark{currentQuestion?.marks > 1 ? "s" : ""}
                  </Badge>
                  {isNATQuestion ? (
                    <Badge variant="secondary" className="text-xs">
                      Fill in the blank
                    </Badge>
                  ) : currentQuestion?.questionType === "MSQ" ? (
                    <Badge variant="secondary" className="text-xs">
                      Multiple Select
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      Single Choice
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-lg max-h-96 overflow-y-auto">
                <div className="text-lg leading-relaxed space-y-2">
                  <p className="font-semibold text-gray-900 sticky top-0 bg-gray-50 pb-2">
                    {currentQuestionIndex + 1}. {currentQuestion?.question}
                  </p>
                  {!isNATQuestion && (
                    <div className="space-y-2">
                      {availableOptions.map((option) => (
                        <p key={option.key} className="ml-4 py-1">
                          {option.key}) {option.text}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {isNATQuestion ? (
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">Your Answer:</label>
                  <input
                    type="text"
                    value={answers.find((a) => a.questionId === currentQuestion?.id)?.textAnswer || ""}
                    onChange={(e) => handleTextAnswerChange(e.target.value)}
                    placeholder="Type your answer here..."
                    className="w-full p-4 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {availableOptions.map((option) => {
                    const isSelected =
                      answers.find((a) => a.questionId === currentQuestion?.id)?.selectedAnswer?.includes(option.key) ||
                      false
                    return (
                      <div
                        key={option.key}
                        onClick={() => handleAnswerSelect(option.key)}
                        className={`flex items-center gap-3 p-4 rounded-lg border transition-all cursor-pointer hover:bg-blue-50 ${
                          isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300"
                        }`}
                      >
                        <div className="flex items-center">
                          {currentQuestion?.questionType === "MSQ" ? (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                          ) : (
                            <input
                              type="radio"
                              checked={isSelected}
                              onChange={() => {}}
                              className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                          )}
                        </div>
                        <span className="font-medium text-lg text-gray-900">{option.key}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between items-center pt-4 border-t">
            <Button
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
              variant="outline"
              className="flex items-center gap-2 px-6 py-2 bg-transparent"
            >
              Previous
            </Button>

            <div className="flex gap-3">
              {currentQuestionIndex < questions.length - 1 && (
                <Button
                  onClick={handleNextQuestion}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700"
                >
                  Next
                </Button>
              )}
              {currentQuestionIndex === questions.length - 1 && (
                <Button
                  onClick={handleSubmitExam}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700"
                  disabled={isSubmitting}
                >
                  Submit Exam
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Question Navigation Panel */}
        <div className="w-80 lg:w-96 xl:w-80 bg-white shadow-sm border-l min-h-screen flex flex-col">
          <div className="p-4 border-b flex-shrink-0">
            <h3 className="font-semibold text-gray-900">Question Navigation</h3>
            <p className="text-xs text-gray-500 mt-1">Select any question to jump</p>
          </div>
          <div className="flex-1 relative">
            <div className="absolute inset-0 p-4 overflow-y-auto">
              <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 xl:grid-cols-5 gap-2 pb-8">
                {questions.map((_, index) => {
                  const hasAnswer =
                    (answers[index]?.selectedAnswer && answers[index].selectedAnswer.length > 0) ||
                    (answers[index]?.textAnswer && answers[index].textAnswer.trim().length > 0)
                  const canNavigate = true
                  return (
                    <button
                      key={index}
                      onClick={() => canNavigate && setCurrentQuestionIndex(index)}
                      disabled={!canNavigate}
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg text-xs sm:text-sm font-medium transition-all relative flex-shrink-0 ${
                        index === currentQuestionIndex
                          ? "bg-blue-600 text-white shadow-lg"
                          : hasAnswer
                            ? "bg-yellow-100 text-yellow-700 border border-yellow-300 hover:bg-yellow-200"
                            : "bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200"
                      }`}
                      title={hasAnswer ? "Question has answer" : "Question not answered"}
                    >
                      {index + 1}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export { AssessmentInterface }
export default AssessmentInterface
