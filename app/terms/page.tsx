import type React from "react"
import Link from "next/link"
import {
    Info,
    Gavel,
    Ban,
    Code2,
    UserX,
    Mail,
    ShieldCheck,
    LifeBuoy,
    Clock,
    CheckCircle2,
    CircleHelp,
    ShieldAlert,
} from "lucide-react"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import SvgIcon from "@/components/svg-icon"
import Button from "@/components/landing/button"

export const metadata = {
    title: "Terms of Service | Wingman Pro",
    description: "Wingman Pro Terms of Service",
}

type Section = {
    id: string
    title: string
    content: React.ReactNode
}

const conductItems = [
    {
        icon: "/new-wingman/icons/hammer.svg",
        title: "Illegal Use",
        text: "Use the service for any illegal or unauthorized purpose.",
    },
    {
        icon: "/new-wingman/icons/stop.svg",
        title: "Harassment",
        text: "Harass, abuse, or harm another person or group.",
    },
    {
        icon: "/new-wingman/icons/bug.svg",
        title: "Reverse Engineering",
        text: "Attempt to decompile or extract source code from our systems.",
    },
    {
        icon: "/new-wingman/icons/user-off.svg",
        title: "Impersonation",
        text: "Misrepresent your identity or affiliation with any person.",
    },
]

const limitations = [
    "Third-party integrations may vary by region.",
    'Experimental "Pro" features are provided on an "as-is" basis.',
    "Data synchronization speeds depend on network latency.",
]

/* ---------- Mobile-only content (from mobile Figma frame) ---------- */
const mobileChips = [
    { id: "m-acceptance", label: "Acceptance" },
    { id: "m-accounts", label: "Accounts" },
    { id: "m-pro-features", label: "Pro Features" },
    { id: "m-conduct", label: "Conduct" },
    { id: "m-property", label: "Property" },
]

const mobileAccountItems = [
    {
        n: "2.1",
        text: "To access certain features of the service, you must register for an account. You agree to provide accurate, current, and complete information.",
    },
    {
        n: "2.2",
        text: "You are responsible for safeguarding the password that you use to access the service and for any activities or actions under your password.",
    },
    {
        n: "2.3",
        text: "Wingman Pro reserves the right to terminate accounts that are inactive for an extended period or that violate our community guidelines.",
    },
]

const mobileProFeatures = [
    "Real-time data synchronization",
    "Unlimited professional dashboards",
    "Priority 24/7 technical support",
]

const mobileProhibited = [
    {
        icon: "/new-wingman/icons/hammer.svg",
        title: "Data Mining",
        text: "Automated extraction of proprietary data from Wingman Pro services.",
    },
    {
        icon: "/new-wingman/icons/phone-alert.svg",
        title: "System Interference",
        text: "Circumventing security or authentication measures.",
    },
]

const mobileHeading =
    "font-['SF_Pro',sans-serif] text-[1.5rem] font-[590] leading-[2rem] bg-gradient-to-r from-[#ABE8FF] to-[#DFB7FF] bg-clip-text text-transparent inline-block"
const mobileBody =
    "font-['SF_Compact',sans-serif] text-[1rem] font-[457] leading-[1.5rem] text-wingman-secondary-text"
// const mobileAccentSection = "border-l-2 border-[#A8E8FF]/60 pl-4"

const P = ({ children }: { children: React.ReactNode }) => (
    <p className="align-middle font-['SF_Compact',sans-serif] text-[1rem] font-[457] leading-[1.625rem] tracking-[0rem] text-wingman-secondary-text">
        {children}
    </p>
)
const sections: Section[] = [
    {
        id: "acceptance-of-terms",
        title: "Acceptance of Terms",
        content: (
            <>
                <P>
                    By creating an account, downloading the mobile application, or otherwise using the Wingman Pro
                    platform (&ldquo;the Service&rdquo;), you acknowledge that you have read, understood, and agreed to
                    be bound by these Terms of Service. If you do not agree to these terms, you may not access or use
                    the Service.
                </P>
                <P>
                    We reserve the right to modify these terms at any time. Changes will be effective immediately upon
                    posting to the Service. Your continued use of Wingman Pro following the posting of changes
                    constitutes your acceptance of such changes.
                </P>
            </>
        ),
    },
    {
        id: "platform-services",
        title: "Platform Services",
        content: (
            <>
                <P>
                    Wingman Pro provides a high-performance precision interface for professional networking, event
                    management, and club discovery. While we strive for 99.9% uptime, we do not guarantee that the
                    service will be available without interruption or errors.
                </P>

                <div className="glass-panel">
                    <div className="mb-4 flex items-center gap-3">
                        <SvgIcon
                            src="/new-wingman/icons/info.svg"
                            className="h-[1.25rem] w-[1.25rem] shrink-0 bg-wingman-cyan"
                        />
                        <span className="align-middle font-['SF_Compact',sans-serif] text-[1rem] font-[656] leading-[1.625rem] tracking-[0rem] text-wingman-primary-text">
                            Key Service Limitations
                        </span>
                    </div>
                    <ul className="list-inside list-disc space-y-2 pl-2">
                        {limitations.map((item) => (
                            <li
                                key={item}
                                className="align-middle font-['SF_Compact',sans-serif] text-[1rem] font-[457] leading-[1.625rem] tracking-[0rem] text-wingman-secondary-text"
                            >
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>
            </>
        ),
    },
    {
        id: "user-accounts",
        title: "User Accounts",
        content: (
            <>
                <P>
                    To access most features of the Service, you must register for an account. You agree to provide
                    accurate, current, and complete information during the registration process and to update such
                    information to keep it accurate and complete.
                </P>
                <P>
                    Access to Wingman Pro is secured via a One-Time Password (OTP) sent to your email and mobile
                    number. You are responsible for safeguarding your devices and email access, and you take sole
                    responsibility for any activities or actions under your account, whether or not you have
                    authorized such activities or actions.
                </P>
            </>
        ),
    },
    {
        id: "code-of-conduct",
        title: "Code of Conduct",
        content: (
            <>
                <P>
                    Wingman Pro is a community of professionals. To maintain this environment, you agree not to:
                </P>
                {/* w-full ensures it stretches, gap-4 applies exactly 1rem spacing */}
                <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
                    {conductItems.map(({ icon, title, text }) => (
                        <div
                            key={title}
                            // Removed max-w-[402px] so the boxes fill the grid columns evenly
                            className="flex h-[6.625rem] w-full flex-col gap-[0.5rem] rounded-[0.5rem] border border-[#FFFFFF1F] p-[1rem]"
                        >
                            <div className="flex items-center gap-[0.5rem]">
                                <SvgIcon
                                    src={icon}
                                    className="h-[1.1875rem] w-[1.125rem] shrink-0 bg-[#FFB4AB]"
                                />
                                <span className="align-middle font-['SF_Compact',sans-serif] text-[1rem] font-[656] leading-[1.5rem] tracking-[0rem] text-wingman-primary-text">
                                    {title}
                                </span>
                            </div>
                            <p className="align-middle font-['SF_Compact',sans-serif] text-[0.875rem] font-[656] leading-[1.25rem] tracking-[0rem] text-wingman-secondary-text">
                                {text}
                            </p>
                        </div>
                    ))}
                </div>
            </>
        ),
    },
    {
        id: "billing-subscriptions",
        title: "Billing & Subscriptions",
        content: (
            <>
                <P>
                    Wingman Pro offers both free and paid subscription tiers. Subscription fees are billed in advance
                    on a monthly or annual basis and are non-refundable except as required by law.
                </P>
                <P>
                    Failure to pay subscription fees will result in the downgrading or suspension of your account
                    services. We reserve the right to change our subscription fees upon 30 days&apos; notice.
                </P>
            </>
        ),
    },
    {
        id: "intellectual-property",
        title: "Intellectual Property",
        content: (
            <>
                <P>
                    All content, trademarks, logos, and service marks displayed on the platform are the property of
                    RallyUp Solutions Private Limited or their respective third-party owners. You are granted a
                    limited, non-exclusive license to use the platform for its intended purposes.
                </P>
                <P>
                    You may not reproduce, distribute, or create derivative works from any part of the Service without
                    our express written consent.
                </P>
            </>
        ),
    }
]

function SectionBlock({ section, index }: { section: Section; index: number }): React.JSX.Element {
    return (
        <section id={section.id} className="scroll-mt-28 space-y-6">
            <div className="flex items-center gap-4">
                {/* 40x40 Number Box */}
                <div className="flex h-[2.5rem] w-[2.5rem] items-center justify-center rounded-[0.5rem] bg-[#A8E8FF1A]">
                    <span className="text-center align-middle font-['SF_Compact',sans-serif] text-[1rem] font-[656] leading-[1.5rem] tracking-[0rem] text-wingman-cyan">
                        {String(index + 1).padStart(2, "0")}
                    </span>
                </div>
                {/* Section Title */}
                <h2 className="align-middle font-['SF_Pro',sans-serif] text-[2rem] font-[700] leading-[2.5rem] tracking-[-0.02rem] text-wingman-primary-text">
                    {section.title}
                </h2>
            </div>
            <div className="space-y-4">{section.content}</div>
        </section>
    )
}

export default function TermsPage(): React.JSX.Element {
    return (
        // overflow-x-clip (not hidden) keeps the glow from causing horizontal scroll without breaking position: sticky
        <main
            className="min-h-screen bg-[#050505] md:bg-[#131313] text-white"
            style={{
                backgroundImage: `
            radial-gradient(ellipse 30% 28.125rem at top left, #A8E8FF1A 0%, transparent 100%),
            radial-gradient(ellipse 30% 28.125rem at top right, #DFB7FF1A 0%, transparent 100%)
        `,
                backgroundRepeat: "no-repeat"
            }}
        >
            <SiteNavbar />

            {/* Hero */}
            <div className="relative">
                {/* Blur glow: hsla(196, 100%, 83%, 0.1) */}
                <div className="pointer-events-none absolute left-1/2 top-0 h-[21.25rem] w-[56.25rem] max-w-full -translate-x-1/2 rounded-full" />

                <div className="relative mx-auto flex w-full max-w-8xl flex-col items-start gap-4 px-4 pb-6 pt-8 text-left mobile:items-center mobile:gap-6 mobile:px-8 mobile:pb-16 mobile:pt-16 mobile:text-center">
                    {/* Mobile heading */}
                    <h1 className="font-sf text-[1.5rem] font-bold leading-[2.25rem] mobile:hidden">
                        Terms of Service
                    </h1>

                    {/* Desktop heading */}
                    <h1 className="heading-main hidden mobile:block">
                        Terms of Service
                    </h1>

                    {/* Mobile meta */}
                    <div className="flex flex-col items-start gap-3 mobile:hidden">
                        <span className="flex h-[1.625rem] w-[8.125rem] items-center justify-center rounded-full border border-[#A8E8FF4D] font-sf-compact text-[0.75rem] font-[457] uppercase leading-[1rem] text-wingman-cyan">
                            Legal Document
                        </span>
                        <span className="flex h-[2.375rem] w-[14.75rem] items-center justify-center gap-2 rounded-full border border-[#A8E8FF33] bg-[#A8E8FF1A] font-sf-compact text-[0.75rem] font-[457] leading-[1.5rem] text-wingman-cyan">
                            <SvgIcon
                                src="/new-wingman/icons/history.svg"
                                className="h-[0.75rem] w-[0.75rem] shrink-0 bg-wingman-cyan"
                            />
                            Last Updated: October 24, 2025
                        </span>
                    </div>

                    {/* Desktop description */}
                    <p className="subheading-main hidden mobile:block">
                        Please read these terms carefully before using Wingman Pro. By accessing our platform, you agree
                        to be bound by these legal conditions designed to protect you and our community.
                    </p>

                    {/* Desktop last updated */}
                    <p className="hidden text-center align-middle font-sf-compact text-[0.875rem] font-[656] uppercase leading-[1.25rem] tracking-[0.175rem] text-wingman-cyan mobile:block">
                        LAST UPDATED: OCTOBER 24, 2025
                    </p>
                </div>
            </div>

            {/* ================= MOBILE ONLY BODY ================= */}
            <div className="mx-auto flex w-full max-w-8xl flex-col gap-8 px-4 pb-12 mobile:hidden">

                {/* Sections chips */}
                <div>
                    <h2 className="font-['SF_Pro',sans-serif] text-[1.5rem] font-[590] leading-[2rem] text-wingman-primary-text">
                        Sections
                    </h2>
                    <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1">
                        {mobileChips.map(({ id, label }) => (
                            <a
                                key={id}
                                href={`#${id}`}
                                className="flex h-[2rem] shrink-0 items-center justify-center rounded-full border border-[#FFFFFF1F] bg-[#1C1B1B] px-4 font-['SF_Compact',sans-serif] text-[0.8125rem] font-[457] text-wingman-primary-text"
                            >
                                {label}
                            </a>
                        ))}
                    </div>
                </div>

                {/* 1. Acceptance of Terms */}
                <section id="m-acceptance" className="scroll-mt-24 relative pl-5">
                    {/* Left Glowing Vertical Bar */}
                    <div
                        className="absolute bottom-0 left-0 top-1.5 w-[0.125rem]"
                        style={{
                            background: "linear-gradient(180deg, #3CD7FF 0%, rgba(60, 215, 255, 0) 100%)",
                            boxShadow: "0 0 0.5rem 0 #3CD7FF"
                        }}
                    />
                    <h2 className={mobileHeading}>1. Acceptance of Terms</h2>
                    <div className="mt-4 flex flex-col gap-4">
                        <p className={mobileBody}>
                            By accessing or using the Wingman Pro platform, you agree to be bound by these Terms of
                            Service and all applicable laws and regulations. If you do not agree with any of these
                            terms, you are prohibited from using or accessing this site.
                        </p>
                        <p className={mobileBody}>
                            The materials contained in this platform are protected by applicable copyright and
                            trademark law. Wingman Pro provides high-performance data analytics and professional
                            precision tools.
                        </p>
                    </div>
                </section>

                {/* 2. User Accounts & Security */}
                <section id="m-accounts" className="scroll-mt-24 relative pl-5">
                    {/* Left Glowing Vertical Bar */}
                    <div
                        className="absolute bottom-0 left-0 top-1.5 w-[0.125rem]"
                        style={{
                            background: "linear-gradient(180deg, #3CD7FF 0%, rgba(60, 215, 255, 0) 100%)",
                            boxShadow: "0 0 0.5rem 0 #3CD7FF"
                        }}
                    />
                    <h2 className={mobileHeading}>2. User Accounts &amp; Security</h2>
                    <ol className="mt-4 flex flex-col gap-4">
                        {mobileAccountItems.map(({ n, text }) => (
                            <li key={n} className="flex gap-4">
                                <span className="w-8 shrink-0 font-['SF_Compact',sans-serif] text-[1rem] font-[656] leading-[1.625rem] text-wingman-cyan">
                                    {n}
                                </span>
                                <p className={mobileBody}>{text}</p>
                            </li>
                        ))}
                    </ol>
                </section>


                {/* 3. Pro Features & Subscriptions */}
                <section
                    id="m-pro-features"
                    className="glass-panel relative scroll-mt-24 overflow-hidden border border-[#FFFFFF14]"
                >
                    {/* Left Glowing Vertical Bar (on the box's left edge) */}
                    <div
                        className="absolute bottom-0 left-0 top-0 w-[0.125rem]"
                        style={{
                            background: "linear-gradient(180deg, #3CD7FF 0%, rgba(60, 215, 255, 0) 100%)",
                            boxShadow: "0 0 0.5rem 0 #3CD7FF",
                        }}
                    />


                    {/* Top Right Blur */}

                    <div className="absolute right-[0.0625rem] top-[0.0625rem] h-[8rem] w-[8rem] rounded-full bg-[#00D4FF1A] blur-[3.75rem]" />
                    <div className="relative z-10">
                        <h2 className={mobileHeading}>3. Pro Features &amp; Subscriptions</h2>
                        <p className={`mt-4 ${mobileBody}`}>
                            Wingman Pro offers premium subscription tiers. By subscribing, you agree to the specific
                            billing cycles and payment terms outlined during the checkout process.
                        </p>
                        <ul className="mt-4 flex flex-col gap-3">
                            {mobileProFeatures.map((item) => (
                                <li key={item} className="flex items-start gap-3">
                                    <CheckCircle2 className="mt-[0.125rem] h-[0.75rem] w-[0.75rem] shrink-0 text-[#00FADC]" />
                                    <span className="font-['SF_Compact',sans-serif] text-[0.875rem] font-[656] leading-[1.25rem] text-wingman-secondary-text">
                                        {item}
                                    </span>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-5 rounded-[0.5rem] border border-[#00D4FF33] bg-[#00D4FF0D] p-4">
                            <p className="font-['SF_Compact',sans-serif] text-[0.75rem] font-[556] italic leading-[1rem] text-wingman-cyan">
                                Note: All fees are non-refundable except as required by law or as explicitly stated in our
                                Refund Policy.
                            </p>
                        </div>
                    </div>
                </section>

                {/* 4. Acceptable Use Policy */}
                <section id="m-conduct" className="scroll-mt-24 relative pl-5">
                    {/* Left Glowing Vertical Bar */}
                    <div
                        className="absolute bottom-0 left-0 top-1.5 w-[0.125rem]"
                        style={{
                            background: "linear-gradient(180deg, #3CD7FF 0%, rgba(60, 215, 255, 0) 100%)",
                            boxShadow: "0 0 0.5rem 0 #3CD7FF"
                        }}
                    />
                    <h2 className={mobileHeading}>4. Acceptable Use Policy</h2>
                    <p className={`mt-4 ${mobileBody}`}>
                        You may not use Wingman Pro for any illegal purpose or in any manner that could damage,
                        disable, overburden, or impair our servers. Prohibited actions include:
                    </p>
                    <div className="mt-4 flex flex-col gap-3">
                        {mobileProhibited.map(({ icon, title, text }) => (
                            <div key={title} className="flex h-[7rem] flex-col justify-center rounded-[0.75rem] border border-[#FFFFFF1F] p-[1.0625rem]">
                                <div className="flex items-center gap-3">
                                    <SvgIcon
                                        src={icon}
                                        className="h-[1.1875rem] w-[1.125rem] shrink-0 bg-[#FFB4AB]"
                                    />
                                    <p className="font-['SF_Compact',sans-serif] text-[1rem] font-[656] leading-[1.625rem] text-wingman-primary-text">
                                        {title}
                                    </p>
                                </div>
                                <p className="mt-2 font-['SF_Compact',sans-serif] text-[0.75rem] font-[556] leading-[1rem] text-wingman-secondary-text">
                                    {text}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 5. Intellectual Property */}
                <section id="m-property" className="scroll-mt-24 relative pl-5">
                    {/* Left Glowing Vertical Bar */}
                    <div
                        className="absolute bottom-0 left-0 top-1.5 w-[0.125rem]"
                        style={{
                            background: "linear-gradient(180deg, #3CD7FF 0%, rgba(60, 215, 255, 0) 100%)",
                            boxShadow: "0 0 0.5rem 0 #3CD7FF"
                        }}
                    />
                    <h2 className={mobileHeading}>5. Intellectual Property</h2>
                    <p className={`mt-4 ${mobileBody}`}>
                        The Service and its original content, features, and functionality are and will remain the
                        exclusive property of Wingman Pro and its licensors. Our trademarks and trade dress may not be
                        used in connection with any product or service without prior written consent.
                    </p>
                </section>

                {/* Questions or Concerns */}
                <section className="mt-4 flex h-[27rem] flex-col items-center justify-center rounded-[1.5rem] border border-[#A8E8FF33] bg-[#00D4FF0D] px-6 text-center">
                    <span className="flex h-[4rem] w-[4rem] items-center justify-center rounded-full bg-[#A8E8FF33]">
                        <SvgIcon
                            src="/new-wingman/icons/help-circle.svg"
                            className="h-[1.5625rem] w-[1.3125rem] shrink-0 bg-wingman-cyan"
                        />                    </span>
                    <h2 className="mt-6 font-['SF_Pro',sans-serif] text-[1.5rem] font-[590] leading-[2rem] text-wingman-primary-text">
                        Questions or<br />Concerns?
                    </h2>
                    <p className="mt-3 font-['SF_Compact',sans-serif] text-[1rem] font-[457] leading-[1.625rem] text-wingman-secondary-text">
                        Our legal team is available to clarify<br />any parts of this agreement.
                    </p>
                    <div className="mt-8 flex w-full flex-col gap-2">
                        <Button
                            variant="primary"
                            href="mailto:response@wingman-pro.com"
                            className="
    h-[3.5rem] w-full
    !font-sf-compact !text-[1rem] !font-[656] !leading-[1.625rem] !text-wingman-light-accent-text
  "
                        >
                            Contact Us
                        </Button>
                        <Link
                            href="/help"
                            className="flex h-[3.5rem] w-full items-center justify-center rounded-[0.75rem] border border-wingman-cyan bg-transparent font-['SF_Compact',sans-serif] text-[1rem] font-[656] leading-[1.625rem] text-wingman-cyan transition-opacity hover:opacity-80"
                        >
                            Visit Help Center
                        </Link>
                    </div>
                </section>
            </div>

            {/* Body (desktop, modified layout logic): nav pinned far left (sticky), content centered */}
            <div className="mx-auto hidden w-full max-w-8xl px-4 pb-20 mobile:block aside-hide:grid aside-hide:grid-cols-[16rem_minmax(0,1fr)] aside-hide:items-start aside-hide:gap-8 aside-hide:px-12">

                {/* Added self-start to prevent the aside from stretching, allowing sticky to work */}
                <aside className="hidden aside-hide:flex sticky top-28 self-start h-[24.25rem] w-[18.75rem] flex-col gap-[1rem] border-l border-[#FFFFFF1F] pl-[1.5rem]">
                    <p className="align-middle font-['SF_Compact',sans-serif] text-[0.875rem] font-[656] uppercase leading-[1.25rem] tracking-[0.0875rem] text-wingman-cyan">
                        NAVIGATION
                    </p>
                    <nav className="flex flex-col gap-[1rem]">
                        {sections.map((section, i) => (
                            <a
                                key={section.id}
                                href={`#${section.id}`}
                                className="align-middle font-['SF_Compact',sans-serif] text-[1rem] font-[457] leading-[1.5rem] tracking-[0rem] text-wingman-secondary-text transition-colors hover:text-wingman-cyan"
                            >
                                {i + 1}. {section.title}
                            </a>
                        ))}
                    </nav>
                </aside>

                {/* Changed to max-w-8xl here to take full width when aside is hidden */}
                <div className="mx-auto w-full max-w-8xl space-y-12 aside-hide:max-w-none">
                    {sections.map((section, i) => (
                        <SectionBlock key={section.id} section={section} index={i} />
                    ))}

                    {/* Questions card */}
                    <div className="glass-panel relative overflow-hidden">
                        {/* Top Right Glow/Blur Overlay */}
                        <div className="absolute -top-[2.4375rem] -right-[1.25rem] h-[10rem] w-[10rem] rounded-full bg-[#A8E8FF33] blur-[3.75rem]" />

                        <h3 className="relative align-middle font-['SF_Pro',sans-serif] text-[2rem] font-[700] leading-[2.5rem] tracking-[-0.02rem] text-wingman-primary-text">
                            Have questions?
                        </h3>
                        <p className="relative max-w-[43.75rem] align-middle font-['SF_Compact',sans-serif] text-[1rem] font-[457] leading-[1.5rem] tracking-[0rem] text-wingman-secondary-text">
                            If you have any questions regarding these Terms, please contact our legal department for clarification. We are here to ensure your experience with Wingman Pro is transparent and secure.
                        </p>

                        <div className="relative mt-2 flex flex-wrap gap-4">
                            {/* Contact Us */}
                            <Button
                                variant="primary"
                                href="mailto:response@wingman-pro.com"
                                className="
    h-[3.125rem] w-[9.4375rem] gap-[0.5rem] whitespace-nowrap px-[2rem] py-[0.8125rem]
    !font-sf-compact !text-[1rem] !font-[656] !leading-[1.5rem] !text-wingman-emphasis-text
  "
                            >
                                <Mail className="h-[1.125rem] w-[1.125rem] shrink-0" />
                                Contact Us
                            </Button>

                            {/* Privacy Policy */}
                            <Link
                                href="/privacy"
                                className="flex h-[3.125rem] w-[11.0625rem] whitespace-nowrap items-center justify-center gap-[0.5rem] rounded-[0.75rem] border border-[#FFFFFF1F] px-[2rem] py-[0.75rem] text-center align-middle font-['SF_Compact',sans-serif] text-[1rem] font-[656] leading-[1.5rem] tracking-[0rem] text-wingman-primary-text transition-colors hover:bg-white/5"
                            >
                                <ShieldCheck className="h-[1.125rem] w-[1.125rem] shrink-0" />
                                Privacy Policy
                            </Link>

                            {/* Visit Help Center */}
                            <Link
                                href="/help"
                                className="flex h-[3.125rem] w-[12.5rem] whitespace-nowrap items-center justify-center gap-[0.5rem] rounded-[0.75rem] border border-[#FFFFFF1F] px-[2rem] py-[0.75rem] text-center align-middle font-['SF_Compact',sans-serif] text-[1rem] font-[656] leading-[1.5rem] tracking-[0rem] text-wingman-primary-text transition-colors hover:bg-white/5"
                            >
                                <LifeBuoy className="h-[1.125rem] w-[1.125rem] shrink-0" />
                                Visit Help Center
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <SiteFooter />
        </main>
    )
}