import type React from "react"
import Image from "next/image"
import type { Metadata } from "next"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import Button from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Page Not Found | Wingman Pro",
  description: "The page you're looking for was tackled out of bounds.",
}

export default function NotFound(): React.JSX.Element {
  return (
    <main className="min-h-screen overflow-x-clip bg-wingman-light-surface-text text-white">
      <SiteNavbar />

      <section className="relative flex flex-col mobile:min-h-[49rem]">
        {/* Image + 404 heading */}
        <div className="relative h-[33.5rem] w-full overflow-hidden mobile:absolute mobile:inset-0 mobile:h-auto">
          {/* Mobile image */}
          <Image
            src="/new-wingman/images/404-page-2.jpg"
            alt="Football pitch on a coastal island"
            fill
            sizes="100vw"
            className="object-cover object-bottom mobile:hidden"
          />

          {/* Desktop image */}
          <Image
            src="/new-wingman/images/404-page-1.png"
            alt="Football pitch on a coastal island"
            fill
            priority
            sizes="100vw"
            className="hidden object-cover object-bottom mobile:block"
          />

          {/* Heading block: full width on mobile & desktop, no curve */}
          <div className="relative z-10 w-full mobile:mx-auto mobile:max-w-[80rem]">
            <div className="relative flex w-full flex-col items-center gap-[1rem] rounded-none border border-[#FFFFFF1F] bg-[#E5E2E11A] px-[1.75rem] py-[2.5rem] text-center backdrop-blur-[1.25rem] mobile:min-h-[19.875rem] mobile:justify-center mobile:gap-[1.25rem] mobile:rounded-none mobile:border-[#FFFFFF1F] mobile:bg-[#1212121A] mobile:px-[4.5rem] mobile:py-[3.5rem] mobile:backdrop-blur-[1.25rem]">
              <h1 className="bg-[linear-gradient(90deg,#00D4FF_0%,#9D05FF_100%)] bg-clip-text font-sf text-[4.5rem] font-[1000] leading-[1] tracking-[-0.125rem] text-transparent drop-shadow-[0_0_1.25rem_#00D4FF4D] mobile:text-[10rem] mobile:font-[1000] mobile:leading-[1] mobile:tracking-[-0.1875rem]">
                404
              </h1>

              <p className="mx-auto w-full font-sf-compact text-[1.75rem] font-[1000] leading-[1] tracking-[0] text-[#00000099] mobile:max-w-none mobile:text-[2.25rem] mobile:font-[1000] mobile:leading-[1] mobile:tracking-[0] mobile:text-wingman-primary-text">
                Offside! You&apos;ve drifted off the pitch.
              </p>
            </div>
          </div>
        </div>

        {/* Message + button */}
        <div className="relative z-10 -mt-2 flex w-full flex-col items-center gap-[1rem] rounded-[1.5rem] border border-[#FFFFFF1F] bg-[#E5E2E11A] px-[1.75rem] py-[2.5rem] text-center backdrop-blur-[1.25rem] mobile:absolute mobile:inset-x-0 mobile:bottom-0 mobile:mx-auto mobile:mt-0 mobile:min-h-[8.375rem] mobile:w-full mobile:max-w-[80rem] mobile:justify-center mobile:gap-[0.75rem] mobile:rounded-none mobile:border mobile:border-[#FFFFFF1F] mobile:bg-[#1212121A] mobile:px-[4.5rem] mobile:py-[1.25rem] mobile:backdrop-blur-[1.25rem]">
          <p className="w-full font-sf-compact text-[0.9375rem] font-[1000] leading-[1] tracking-[0] text-wingman-cyan mobile:max-w-none mobile:text-[1.5rem] mobile:font-[1000] mobile:leading-[1] mobile:tracking-[0] mobile:text-wingman-cyan">
            The page you&apos;re looking for was tackled out of bounds. Let&apos;s get you back in the game.
          </p>

          <Button
            variant="primary"
            href="/"
            className="
              h-[3.25rem] w-[13.875rem] mobile:w-[13.5rem]
              mobile:!font-sf-compact mobile:!text-[1rem] mobile:!leading-[1.5rem] mobile:!text-wingman-emphasis-text
            "
          >
            Back to Discovery
          </Button>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}