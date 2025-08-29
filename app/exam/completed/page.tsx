"use client"

export default function ExamCompletedPage() {
  const isSEB = typeof navigator !== "undefined" && /SEB/i.test(navigator.userAgent || "")

  return (
    <section className="mx-auto max-w-md p-6 text-center">
      <h1 className="text-2xl font-semibold mb-4">Exam Completed</h1>
      <p className="text-muted-foreground mb-6">Your responses have been submitted successfully.</p>

      {isSEB ? (
        <a
          href="seb://quit"
          className="inline-block rounded-md bg-red-600 px-4 py-2 text-white"
          aria-label="Quit Safe Exam Browser"
        >
          Quit Safe Exam Browser
        </a>
      ) : (
        <p className="text-sm text-muted-foreground">You can now safely close this browser window.</p>
      )}
    </section>
  )
}
