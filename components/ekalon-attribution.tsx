import Link from "next/link"
import { EKALON_URL } from "@/lib/pageContext"

type EkalonAttributionProps = {
  className?: string
}

export function EkalonAttribution({ className = "" }: EkalonAttributionProps) {
  return (
    <p className={`text-xs text-muted-foreground ${className}`.trim()}>
      Designed and Developed by{" "}
      <Link
        href={EKALON_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-sky-600 hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-300 underline-offset-2 hover:underline"
      >
        Ekalon Solutions
      </Link>
    </p>
  )
}
