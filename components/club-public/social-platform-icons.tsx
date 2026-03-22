import type { SVGProps } from "react"

export type PublicSocialPlatform = "facebook" | "twitter" | "instagram" | "youtube"

type IconProps = SVGProps<SVGSVGElement>

export function FacebookBrandIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

export function XBrandIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

export function InstagramBrandIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.35 3.608 1.325.975.975 1.263 2.242 1.325 3.608.058 1.266.069 1.646.069 4.85s-.012 3.584-.07 4.85c-.062 1.366-.35 2.633-1.325 3.608-.975.975-2.242 1.263-3.608 1.325-1.266.058-1.646.069-4.85.069s-3.584-.012-4.85-.07c-1.366-.062-2.633-.35-3.608-1.325-.975-.975-1.263-2.242-1.325-3.608-.058-1.266-.069-1.646-.069-4.85s.012-3.584.07-4.85c.062-1.366.35-2.633 1.325-3.608.975-.975 2.242-1.263 3.608-1.325 1.266-.058 1.646-.069 4.85-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-1.277.058-2.415.306-3.308.998-.893.692-1.44 1.495-1.998 2.772-.592 1.367-.95 2.505-1.008 3.782-.058 1.28-.072 1.688-.072 4.947s.014 3.667.072 4.947c.058 1.277.306 2.415.998 3.308.692.893 1.495 1.44 2.772 1.998 1.367.592 2.505.95 3.782 1.008 1.28.058 1.688.072 4.947.072s3.667-.014 4.947-.072c1.277-.058 2.415-.306 3.308-.998.893-.692 1.44-1.495 1.998-2.772.592-1.367.95-2.505 1.008-3.782.058-1.28.072-1.688.072-4.947s-.014-3.667-.072-4.947c-.058-1.277-.306-2.415-.998-3.308-.692-.893-1.495-1.44-2.772-1.998-1.367-.592-2.505-.95-3.782-1.008-1.28-.058-1.688-.072-4.947-.072z" />
      <path d="M12 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zm0 10.162a3.999 3.999 0 110-7.998 3.999 3.999 0 010 7.998zm6.406-11.845a1.44 1.44 0 11-2.881 0 1.44 1.44 0 012.881 0z" />
    </svg>
  )
}

export function YouTubeBrandIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}

const PLATFORM_STYLES: Record<
  PublicSocialPlatform,
  { className: string; iconClass: string }
> = {
  facebook: {
    className:
      "bg-[#1877F2] text-white shadow-md shadow-[#1877F2]/25 hover:shadow-lg hover:shadow-[#1877F2]/35 hover:-translate-y-0.5",
    iconClass: "h-[22px] w-[22px]",
  },
  twitter: {
    className:
      "bg-neutral-900 text-white shadow-md shadow-black/20 hover:shadow-lg hover:shadow-black/30 hover:-translate-y-0.5 dark:bg-neutral-950",
    iconClass: "h-[18px] w-[18px]",
  },
  instagram: {
    className:
      "bg-gradient-to-br from-[#f09433] via-[#dc2743] to-[#bc1888] text-white shadow-md shadow-pink-500/20 hover:shadow-lg hover:shadow-pink-500/30 hover:-translate-y-0.5",
    iconClass: "h-[22px] w-[22px]",
  },
  youtube: {
    className:
      "bg-[#FF0000] text-white shadow-md shadow-red-600/25 hover:shadow-lg hover:shadow-red-600/35 hover:-translate-y-0.5",
    iconClass: "h-[20px] w-[20px]",
  },
}

export function SocialBrandButton({
  platform,
  href,
  label,
}: {
  platform: PublicSocialPlatform
  href: string
  label: string
}) {
  const styles = PLATFORM_STYLES[platform]
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={label}
      aria-label={label}
      className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${styles.className}`}
    >
      {platform === "facebook" && <FacebookBrandIcon className={styles.iconClass} />}
      {platform === "twitter" && <XBrandIcon className={styles.iconClass} />}
      {platform === "instagram" && <InstagramBrandIcon className={styles.iconClass} />}
      {platform === "youtube" && <YouTubeBrandIcon className={styles.iconClass} />}
    </a>
  )
}
