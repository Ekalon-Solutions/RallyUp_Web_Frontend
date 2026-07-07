"use client"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-background">
        <div className="mx-auto max-w-md text-center">
          <h1 className="text-4xl font-bold text-foreground">
            Something went wrong
          </h1>
          <p className="mt-4 text-muted-foreground">
            A critical error occurred while loading the application.
          </p>
          {process.env.NODE_ENV === "development" && (
            <p className="mt-2 text-sm text-destructive">
              {error.message}
            </p>
          )}
          <button
            onClick={reset}
            className="mt-6 rounded-md bg-primary px-6 py-2 text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
