"use client"
import Image from "next/image";
import {
  Lock,
  Calendar,
  MapPin,
  Award,
  Search,
  Ticket,
  LayoutGrid,
  ArrowRight,
  ChevronLeft, ChevronRight
} from "lucide-react";
import { SiteNavbar } from "@/components/site-navbar";
import { SiteFooter } from "@/components/site-footer";
import { useEffect, useState } from "react";
import SvgIcon from "@/components/svg-icon";
import Button from "@/components/landing/button";
import Link from "next/link";
import type { Event } from "@/lib/api";
import { EventImage } from "@/components/events/event-image";
import { eventVariantUrl } from "@/lib/eventImageCache";
import { useLandingEvents, useLandingSearch, eventTag, eventShortDate, eventWhen, eventPrice, eventVenue, isOngoing } from "@/hooks/use-landing-events";
/* ---------------------------------- HERO ---------------------------------- */

interface HeroSlide {
  badgeText: string;
  title: React.ReactNode;
  description: string;
  buttonText: string;
  imageSrc: string;
}

const heroSlides: HeroSlide[] = [
  {
    badgeText: "SCREENING",
    title: (
      <>
        London Lions vs.
        <br />
        Manchester Titans
      </>
    ),
    description:
      "The clash of the season arrives at the Neo-Apex Arena. Witness the pinnacle of performance in a fully immersive sensory experience.",
    buttonText: "Buy Tickets",
    imageSrc: "/new-wingman/images/main-page-image-2.jpg",
  },
  {
    badgeText: "SCREENING",
    title: (
      <>
        London Lions vs.
        <br />
        Manchester Titans
      </>
    ),
    description:
      "The clash of the season arrives at the Neo-Apex Arena. Witness the pinnacle of performance in a fully immersive sensory experience.",
    buttonText: "Buy Tickets",
    imageSrc: "/new-wingman/images/main-page-image-3.jpg",
  },
  {
    badgeText: "SCREENING",
    title: (
      <>
        London Lions vs.
        <br />
        Manchester Titans
      </>
    ),
    description:
      "The clash of the season arrives at the Neo-Apex Arena. Witness the pinnacle of performance in a fully immersive sensory experience.",
    buttonText: "Buy Tickets",
    imageSrc: "/new-wingman/images/main-page-image-4.jpg",
  },
  {
    badgeText: "SCREENING",
    title: (
      <>
        London Lions vs.
        <br />
        Manchester Titans
      </>
    ),
    description:
      "The clash of the season arrives at the Neo-Apex Arena. Witness the pinnacle of performance in a fully immersive sensory experience.",
    buttonText: "Buy Tickets",
    imageSrc: "/new-wingman/images/main-page-image-5.jpg",
  },
];

interface HeroData {
  badgeText: string;
  title: React.ReactNode;
  description: string;
  buttonText: string;
  imageSrc: string;
}

const heroContent: HeroData = {
  badgeText: "Screening",
  title: (
    <>
      London Lions vs.
      <br />
      Manchester Titans
    </>
  ),
  description:
    "The clash of the century. Experience peak performance in a fully immersive watch party environment.",
  buttonText: "Buy Tickets",
  imageSrc: "/club-crowd.png",
};

function HeroSection({ slides }: { slides: HeroSlide[] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  const goToPrev = () => {
    setActiveIndex((prev) => (prev === 0 ? slides?.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setActiveIndex((prev) => (prev === slides?.length - 1 ? 0 : prev + 1));
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev === slides?.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, [slides?.length]);

  const currentSlide = slides[activeIndex];

  return (
    <div className="relative w-full max-w-8xl h-[38rem] rounded-[1.5rem] overflow-hidden mb-[3.5rem] opacity-100">
      {slides.map((slide, index) => {
        const isActive = index === activeIndex;
        return (
          <div
            key={`${slide.imageSrc}-${index}`}
            className={`absolute inset-0 transition-all duration-700 ease-out ${isActive
              ? "opacity-100 scale-100 z-0"
              : "opacity-0 scale-105 pointer-events-none z-0"
              }`}
          >
            <Image
              src={slide.imageSrc}
              alt={`Hero slide ${index + 1}`}
              fill
              className="object-cover"
              priority={index === 0}
            />
          </div>
        );
      })}

      <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/90 via-black/45 to-transparent" />

      <div className="relative z-20 h-full flex flex-col justify-center px-[3rem] lg:px-[6rem]">
        <div className="min-w-[7.9375rem] h-[2.125rem] px-[1rem] py-[0.25rem] mb-[1.5rem] rounded-full border border-[#A8E8FF4D] bg-[#A8E8FF33] backdrop-blur-[0.75rem] opacity-100 inline-flex items-center justify-center w-max">
          <span className="font-['SF_Compact',_sans-serif] font-[457] text-[1rem] leading-[1.5rem] tracking-[0.1rem] uppercase align-middle text-wingman-cyan">
            {currentSlide.badgeText}
          </span>
        </div>

        <h1 className="font-['SF_Pro',_sans-serif] font-[400] text-[4rem] leading-[5rem] tracking-[-0.08rem] align-middle w-full max-w-[34.375rem] mb-[0.75rem] text-wingman-emphasis-text opacity-100">
          {currentSlide.title}
        </h1>

        <p className="font-['SF_Compact',_sans-serif] font-[457] text-[1.125rem] leading-[1.75rem] tracking-[0px] align-middle w-full max-w-[30.75rem] opacity-100 text-wingman-emphasis-text">
          {currentSlide.description}
        </p>

        <button className="relative mt-[1rem] w-[10.8333rem] h-[3.625rem] rounded-[0.75rem] bg-[linear-gradient(90deg,#00D4FF_0%,#9D05FF_100%)] opacity-100 hover:opacity-95 transition-opacity inline-flex items-center justify-center gap-[0.5rem] text-wingman-light-accent-text">
          <span className="font-['SF_Compact',_sans-serif] font-[457] text-[1rem] leading-[1.5rem] tracking-[0px] text-center align-middle text-wingman-light-accent-text">
            {currentSlide.buttonText}
          </span>
          <SvgIcon
            src="/new-wingman/icons/lock.svg"
            className="w-[0.8333rem] h-[1.0417rem] opacity-100 bg-[#003642] shrink-0"
          />
        </button>
      </div>

      {/* Manual rotation controls */}
      <button
        type="button"
        onClick={goToPrev}
        aria-label="Previous hero slide"
        className="absolute left-[1.25rem] top-1/2 -translate-y-1/2 z-30 w-[2.5rem] h-[2.5rem] rounded-full border border-white/20 bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/75 transition-colors"
      >
        <ChevronLeft className="w-[1.25rem] h-[1.25rem]" />
      </button>

      <button
        type="button"
        onClick={goToNext}
        aria-label="Next hero slide"
        className="absolute right-[1.25rem] top-1/2 -translate-y-1/2 z-30 w-[2.5rem] h-[2.5rem] rounded-full border border-white/20 bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/75 transition-colors"
      >
        <ChevronRight className="w-[1.25rem] h-[1.25rem]" />
      </button>

      {/* Slide indicators */}
      <div className="absolute bottom-[1.5rem] left-1/2 -translate-x-1/2 z-30 flex items-center gap-[0.5rem]">
        {slides.map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setActiveIndex(index)}
            aria-label={`Go to slide ${index + 1}`}
            className={`h-[0.5rem] rounded-full transition-all duration-300 ${index === activeIndex
              ? "w-[1.75rem] bg-[#A8E8FF]"
              : "w-[0.5rem] bg-white/40 hover:bg-white/70"
              }`}
          />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------ EVENT CARDS ------------------------------- */

// Full-bleed event image (falls back to the stock photo while loading / when missing).
function EventCover({ event, className = "" }: { event: Event; className?: string }) {
  return (
    <>
      <Image src="/new-wingman/images/main-page-image-1.jpg" alt="" fill className="object-cover" />
      <EventImage
        eventId={event._id}
        imageVersion={event.imageVersion}
        size="list"
        directUrl={eventVariantUrl(event, "list")}
        alt={event.title}
        aspectClassName=""
        className={`!absolute inset-0 h-full bg-transparent [&_img]:h-full [&_img]:w-full [&_img]:object-cover ${className}`}
      />
    </>
  );
}

function EventCard({ event }: { event: Event }) {
  return (
    <Link href="/events" className="group relative block w-full min-w-0 max-w-[24.3125rem] h-[21rem] rounded-[1rem] overflow-hidden border border-white/10 bg-[#0B0D12]">
      <EventCover event={event} className="transition-transform duration-500 group-hover:scale-105" />

      {/* Bottom dark gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(0deg, #000000 0%, rgba(0, 0, 0, 0.4) 50%, rgba(0, 0, 0, 0) 100%)",
        }}
      />

      {/* Top row: left badge + right date */}
       <div className="relative z-10 flex items-center justify-between gap-[0.5rem] px-[2rem] pt-[1rem]">
        <span className="w-[5.5rem] h-[1.25rem] shrink-0 rounded-[0.375rem] bg-[#8B5CF6] inline-flex items-center justify-center gap-[0.25rem] font-['Inter',_sans-serif] font-[700] text-[0.625rem] leading-none tracking-[0.1em] text-wingman-emphasis-text uppercase whitespace-nowrap">
          <Image
            src="/new-wingman/icons/star.svg"
            alt=""
            width={9}
            height={8}
            className="w-[8.334px] h-[7.947px] opacity-100 shrink-0 object-contain block"
          />
          <span className="truncate">{eventTag(event)}</span>
        </span>
        {eventShortDate(event) && (
          <span className="min-w-[3.375rem] px-[0.375rem] h-[1.25rem] shrink-0 rounded-[0.375rem] bg-[#000000B3] inline-flex items-center justify-center font-['Inter',_sans-serif] font-[700] text-[0.625rem] leading-[100%] tracking-[0em] text-wingman-emphasis-text uppercase whitespace-nowrap">
            {eventShortDate(event)}
          </span>
        )}
      </div>

      {/* Bottom content */}
      <div className="relative z-10 h-[calc(100%-2.25rem)] px-[2rem] pb-[1.5rem] flex flex-col justify-end min-w-0">
        <h3 className="font-['Inter',_sans-serif] font-[900] text-[1.375rem] leading-[1.75rem] tracking-[-0.03125rem] text-wingman-emphasis-text uppercase break-words">
          {event.title}
        </h3>
        <p className="mt-[0.25rem] line-clamp-1 font-['Inter',_sans-serif] font-[600] text-[0.625rem] leading-[1.2] tracking-[0.12em] text-wingman-muted-text uppercase">
          {eventWhen(event)}
        </p>

        {/* Divider */}
        <div className="mt-[0.75rem] w-full h-[0.0625rem] bg-wingman-emphasis-text opacity-[0.12]" />

        <div className="mt-[0.75rem] w-full flex items-center justify-between gap-[0.5rem]">
          <div className="flex items-center gap-[0.375rem] min-w-0">
            <SvgIcon
              src="/new-wingman/icons/map-pin.svg"
              className="w-[0.875rem] h-[0.875rem] shrink-0 bg-[#9CA3AF]"
            />
            <span className="truncate font-['Inter',_sans-serif] font-[500] text-[0.75rem] leading-[100%] tracking-[0em] text-wingman-muted-text">
              {eventVenue(event)}
            </span>
          </div>

          <span className="inline-flex shrink-0 items-center justify-center h-[1.9375rem] min-w-[6.4375rem] px-[0.75rem] rounded-[6.25rem] border border-[#000000C4] bg-[#FFFFFF] font-['Inter',sans-serif] text-[0.75rem] font-[700] text-[#050505] whitespace-nowrap transition-colors duration-300 group-hover:bg-[#82E0FA]">
            {eventPrice(event)}
          </span>
        </div>
      </div>
    </Link>
  );
}

function EventsEmpty({ loading }: { loading: boolean }) {
  return (
    <p className="w-full py-[3rem] text-center font-['SF_Compact',_sans-serif] text-[1rem] text-wingman-secondary-text">
      {loading ? "Loading events…" : "No events found."}
    </p>
  );
}

function EventsGrid({ events, loading }: { events: Event[]; loading: boolean }) {
  if (events.length === 0) return <div className="mt-[2.5rem]"><EventsEmpty loading={loading} /></div>;
  return (
    <div className="grid w-full min-w-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 justify-items-center gap-[1rem] mt-[2.5rem]">
      {events.map((event) => (
        <EventCard key={event._id} event={event} />
      ))}
    </div>
  );
}




/* --------------------------- MEMBERSHIP SECTION --------------------------- */

interface PlanData {
  id: number;
  name: string;
  description: string;
  price: string;
  validity: string;
}

const plans: PlanData[] = [
  { id: 1, name: "Basic", description: "Perfect for getting started with essential access.", price: "₹0.00", validity: "Sep, 2026 - Sep, 2027" },
  { id: 2, name: "VIP", description: "Great value with expanded benefits and features.", price: "₹1,082.60", validity: "Sep, 2026 - Sep, 2027" },
  { id: 3, name: "Premium", description: "Premium experience with exclusive privileges.", price: "₹1,948.68", validity: "Sep, 2026 - Sep, 2027" },
  { id: 4, name: "Elite", description: "Enhanced benefits for a better experience.", price: "₹2,165.20", validity: "Sep, 2026 - Sep, 2027" },
  { id: 5, name: "Ultimate", description: "A plan for testing features and access.", price: "₹2,166.28", validity: "Sep, 2026 - Sep, 2027" },
];

function PlanCard({ plan }: { plan: PlanData }) {
  return (
    <div className="w-full min-w-0 h-[21.125rem] rounded-[0.75rem] border-[0.0625rem] border-[#26343E] bg-[#0B0F14] p-[1.125rem] flex flex-col">
      {/* Header: icon + name + description */}
      <div className="flex items-start gap-[0.75rem] h-[5.125rem] pt-[1rem] min-w-0">
        <div className="w-[2rem] h-[2rem] rounded-full bg-[#1A2B3D] shrink-0" />
        <div className="flex flex-col min-w-0">
          <h3 className="font-['Inter',_sans-serif] font-[700] text-[1.125rem] leading-[1.375rem] tracking-[0em] text-wingman-emphasis-text">
            {plan.name}
          </h3>
          <p className="font-['Inter',_sans-serif] font-[400] text-[0.75rem] leading-[1rem] tracking-[0em] text-wingman-secondary-text">
            {plan.description}
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="w-full h-[0.0625rem] bg-[#26343E]" />

      {/* Price + validity */}
      <div className="mt-[1rem] flex flex-col">
        <span className="font-['Inter',_sans-serif] font-[400] text-[0.6875rem] leading-[0.9375rem] tracking-[0em] text-wingman-muted-text">
          Price
        </span>
        <span className="font-['Inter',_sans-serif] font-[700] text-[1.4375rem] leading-[1.6875rem] tracking-[0em] text-wingman-emphasis-text">
          {plan.price}
        </span>

        <span className="mt-[0.75rem] font-['Inter',_sans-serif] font-[400] text-[0.6875rem] leading-[0.9375rem] tracking-[0em] text-wingman-muted-text">
          Validity
        </span>
        <span className="font-['Inter',_sans-serif] font-[400] text-[0.75rem] leading-[1rem] tracking-[0em] text-wingman-secondary-text">
          {plan.validity}
        </span>
      </div>

      {/* Actions */}
      <div className="mt-auto flex flex-col items-center gap-[0.75rem]">
        <button className="w-full h-[2.125rem] rounded-[0.5rem] bg-[#82E0FA] font-['Inter',_sans-serif] font-[700] text-[0.75rem] leading-[1rem] tracking-[0em] text-center text-wingman-light-surface-text hover:opacity-90 transition-opacity whitespace-nowrap">
          Purchase Membership Plan
        </button>
        <button className="font-['Inter',_sans-serif] font-[700] text-[0.75rem] leading-[1rem] tracking-[0em] text-center text-wingman-cyan hover:opacity-80 transition-opacity whitespace-nowrap">
          Know More About The Plan ↗
        </button>
      </div>
    </div>
  );
}

function MembershipSection() {
  return (
    <div className="w-full min-w-0 max-w-[74rem] mt-[2rem]">
      <h2 className="font-['Inter',_sans-serif] font-[800] text-[2rem] leading-[2.375rem] tracking-[0em] text-wingman-emphasis-text">
        Choose your pass
      </h2>
      <p className="mt-[0.5rem] max-w-[28rem] font-['Inter',_sans-serif] font-[400] text-[0.875rem] leading-[1.375rem] tracking-[0em] text-wingman-muted-text">
        Pick the plan that fits your schedule, then unlock access to exclusive
        events, priority booking, and member-only perks.
      </p>

      <div className="mt-[2rem] grid w-full min-w-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[0.5rem]">
        {plans.map((plan) => (
          <PlanCard key={plan.id} plan={plan} />
        ))}
      </div>
    </div>
  );
}


/* ------------------------- AFFILIATED CLUB SECTION ------------------------ */

const clubPerks = [
  {
    icon: "/new-wingman/icons/circle-check.svg",
    text: "Purchase memberships for individual clubs to unlock exclusive perks",
  },
  {
    icon: "/new-wingman/icons/cash.svg",
    text: "Access member-only pricing and priority ticket windows",
  },
  {
    icon: "/new-wingman/icons/dashboard.svg",
    text: "Unlock your personal Club Dashboard and local leaderboards",
  },
];

function AffiliatedClubSection() {
  return (
    <div className="w-full max-w-[74rem] min-h-[33.0783rem] mt-[5rem] mb-16 rounded-[1.5rem] bg-[#303030D9] border-[0.0625rem] border-[#FFFFFF1F] backdrop-blur-[4rem] overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-[1.5rem] lg:gap-[2rem] px-[2.5rem] py-[3rem] lg:px-[4rem] lg:py-[2rem]">
      {/* Left: text & action */}
      <div className="flex flex-col w-full lg:w-[50%] lg:max-w-[35rem] min-w-0">
        <h2 className="font-['SF_Pro',_sans-serif] font-[400] text-[3rem] leading-[3.75rem] tracking-[0rem] text-wingman-primary-text mb-[2rem]">
          Join an Affiliated Club
        </h2>

        <ul className="flex flex-col gap-[1.25rem] mb-[2.5rem]">
          {clubPerks.map(({ icon, text }) => (
            <li key={text} className="flex items-start gap-[0.75rem]">
              <SvgIcon
                src={icon}
                className="w-[1.375rem] h-[1.3125rem] mt-[0.3125rem] bg-[#DFB7FF] shrink-0"
              />
              <p className="font-['SF_Compact',_sans-serif] font-[457] text-[1.125rem] leading-[1.75rem] tracking-[0rem] text-wingman-primary-text">
                {text}
              </p>
            </li>
          ))}
        </ul>

        <Button
          variant="primary"
          className="h-[3.625rem] w-fit px-[2rem] text-[#FFFFFF] max-[767px]:text-[#FFFFFF]"
        >
          Explore Club Memberships
        </Button>
      </div>

      {/* Right: tilted membership card */}
      <div className="flex w-full lg:flex-1 min-w-0 justify-center lg:justify-end py-[1.5rem]">
        <div className="relative w-full max-w-[27.5rem] aspect-[440/300] rounded-[1.25rem] -rotate-[11.06deg] p-[1.5rem] flex flex-col justify-between border border-white/10 shadow-[0_1.25rem_3.125rem_rgba(75,0,126,0.45)] bg-[linear-gradient(295.52deg,#0D0513_1.77%,rgba(20,4,32,0.92)_43.03%,rgba(75,0,126,0.64)_100%)] lg:-mr-[1rem]">
          {/* Top: club name */}
          <span className="font-['Inter',_sans-serif] font-[800] text-[1.125rem] leading-[100%] tracking-[-0.03125rem] text-wingman-emphasis-text">
            Demo Club
          </span>

          {/* Center: title + details */}
          <div className="flex flex-col items-center text-center">
            <h3 className="font-['Inter',_sans-serif] font-[700] text-[1.875rem] leading-[100%] tracking-[-0.03125rem] text-wingman-emphasis-text">
              CLUB MEMBER
            </h3>
            <span className="mt-[1rem] font-['Inter',_sans-serif] font-[500] text-[0.75rem] leading-[100%] text-[#FFFFFF99]">
              Membership ID
            </span>
            <span className="mt-[0.25rem] font-['SF_Pro',_sans-serif] font-[400] text-[1rem] leading-[1.5rem] tracking-[0rem] text-wingman-emphasis-text">
              #009-PRO-2024
            </span>
            <span className="mt-[0.5rem] font-['Inter',_sans-serif] font-[500] text-[0.75rem] leading-[100%] text-[#FFFFFF99]">
              Plan
            </span>
            <span className="mt-[0.25rem] font-['Inter',_sans-serif] font-[700] text-[1.125rem] leading-[100%] text-wingman-emphasis-text">
              XYZ
            </span>
          </div>

          {/* Bottom: validity + status */}
          <div className="flex justify-between items-end">
            <div className="flex flex-col gap-[0.375rem]">
              <span className="font-['Inter',_sans-serif] font-[500] text-[0.6875rem] leading-[100%] text-[#FFFFFF99]">
                Valid Thru
              </span>
              <span className="font-['Inter',_sans-serif] font-[700] text-[0.875rem] leading-[100%] text-wingman-emphasis-text">
                Aug 10, 2027
              </span>
            </div>

            <div className="flex flex-col items-center gap-[0.375rem]">
              <span className="font-['Inter',_sans-serif] font-[500] text-[0.6875rem] leading-[100%] text-center text-[#FFFFFF99]">
                Status
              </span>
              <span className="w-[3.75rem] h-[1.4375rem] px-[0.75rem] py-[0.25rem] rounded-full bg-[#10B981] inline-flex items-center justify-center font-['Inter',_sans-serif] font-[700] text-[0.75rem] leading-[100%] text-wingman-emphasis-text">
                active
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


/* ------------------------- MOBILE VIEW (< 768px) -------------------------- */

const mobilePills = ["All", "Screenings", "Watch-Parties", "Membership"];

interface SearchFilterProps {
  tab: string;
  onTab: (tab: string) => void;
  search: string;
  onSearch: (q: string) => void;
}

function MobileSearchAndFilters({ tab, onTab, search, onSearch }: SearchFilterProps) {
  return (
    <>
      <div className="relative h-[3.375rem] w-full">
        <SvgIcon
          src="/new-wingman/icons/search.svg"
          className="absolute left-[1rem] top-1/2 -translate-y-1/2 w-[1.125rem] h-[1.125rem] opacity-100 bg-[#859398]"
        />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          aria-label="Search events"
          placeholder="Find matches, socials, or clinics..."
          className="w-full h-full rounded-[0.75rem] bg-[#2A2A2A] border border-[#FFFFFF1F] pl-[3rem] pr-[1rem] font-['SF_Compact',_sans-serif] font-[457] text-[1rem] leading-none tracking-[0px] text-wingman-primary-text placeholder:text-[#859398] focus:outline-none focus:ring-[0.0625rem] focus:ring-[#26DAFF] focus:border-[#26DAFF] transition-all"
        />
      </div>

      <div className="mt-[0.75rem] flex flex-nowrap items-center gap-[0.25rem] overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {mobilePills.map((label) => (
          <button
            key={label}
            type="button"
            onClick={() => onTab(label === "All" ? "All Events" : label)}
            className={
              (label === "All" ? "All Events" : label) === tab
                ? "shrink-0 h-[2.125rem] px-[1rem] rounded-full bg-[#A8E8FF] font-['SF_Pro',_sans-serif] font-[860] text-[0.75rem] leading-[1.5rem] tracking-[0px] text-center align-middle text-[#003642]"
                : "shrink-0 h-[2.125rem] px-[0.75rem] rounded-full bg-[#201F1F] border border-[#FFFFFF1F] font-['SF_Pro',_sans-serif] font-[860] text-[0.75rem] leading-[1.5rem] tracking-[0px] text-center align-middle text-[#BBC9CF] hover:bg-[#2A2929] transition-colors"
            }
          >
            {label}
          </button>
        ))}
      </div>
    </>
  );
}

function MobileOngoingCard({ event }: { event: Event }) {
  return (
    <div className="relative mt-[3rem] w-full max-w-8xl h-[26.89875rem] opacity-100 overflow-hidden rounded-[1.5rem]">
      <EventCover event={event} />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

      <span className="absolute top-[2.5625rem] left-[1rem] min-w-[7.875rem] h-[1.5625rem] px-[0.5rem] py-[0.25rem] whitespace-nowrap rounded-full border border-[#A8E8FF66] bg-[#A8E8FF33] backdrop-blur-[0.75rem] opacity-100 inline-flex items-center justify-center font-['SF_Compact',_sans-serif] font-[457] text-[0.625rem] leading-[1rem] tracking-[0.0375rem] uppercase align-middle text-wingman-cyan">
        {eventTag(event)}
      </span>

      <div className="absolute left-[1rem] right-[1rem] bottom-[1.75rem] flex flex-col items-start">
        <h3 className="font-['SF_Pro',_sans-serif] font-[700] text-[1.75rem] leading-[2.25rem] tracking-[0px] align-middle text-wingman-primary-text max-w-[16.25rem] mb-[1rem]">
          {event.title}
        </h3>
        <Link href="/events" className="relative top-[1rem] inline-flex items-center justify-center w-[7.5625rem] h-[3.25rem] rounded-[0.75rem] opacity-100 bg-[linear-gradient(90deg,#00D4FF_0%,#9D05FF_100%)] font-['SF_Compact',_sans-serif] font-[457] text-[1rem] leading-[1.5rem] tracking-[0px] text-center align-middle text-[#001F27] hover:opacity-95 transition-opacity">
          Register
        </Link>
      </div>
    </div>
  );
}

function MobileJoinClub() {
  return (
    <div className="w-full max-w-8xl rounded-[1rem] border border-white/10 bg-white/[0.03] backdrop-blur-md p-[1.5rem] flex flex-col">
      <div className="flex items-center gap-[0.75rem] mb-[1rem]">
        <SvgIcon
          src="/new-wingman/icons/badge.svg"
          className="relative top-[0.015625rem] w-[1.5rem] h-[1.96875rem] opacity-100 bg-[#DFB7FF] shrink-0"
        />
        <h3 className="font-['SF_Pro',_sans-serif] font-[400] text-[1.5rem] leading-[2rem] tracking-[0px] align-middle text-wingman-primary-text">
          Join A Club
        </h3>
      </div>
      <p className="font-['SF_Compact',_sans-serif] font-[457] text-[1rem] leading-[1.625rem] tracking-[0px] align-middle text-wingman-secondary-text mb-[1.5rem]">
        Join an affiliated club to unlock discounts, early access to events,
        membership perks and full features.
      </p>
      <Link href="/clubs" className="mx-auto inline-flex items-center justify-center w-[13.3125rem] h-[2.9375rem] rounded-[0.375rem] bg-[linear-gradient(90deg,#00D4FF_0%,#9D05FF_100%)] font-['SF_Compact',_sans-serif] font-[656] text-[0.875rem] leading-[1.25rem] tracking-[0.04375rem] text-center align-middle uppercase text-[#003642] hover:opacity-90 transition-opacity">
        Explore clubs
      </Link>
    </div>
  );
}

function MobileEventCard({ event }: { event: Event }) {
  return (
    <div className="w-full max-w-8xl min-h-[24.65625rem] rounded-[1rem] border border-[#FFFFFF1F] bg-white/[0.03] overflow-hidden opacity-100">
      <div className="relative w-full h-[12rem] overflow-hidden">
        <EventCover event={event} />
        <span className="absolute z-10 top-[1rem] left-[1rem] min-w-[5.5rem] h-[1.75rem] px-[0.625rem] py-[0.25rem] rounded-[0.5rem] border border-[#FFFFFF1F] bg-[#050505CC] backdrop-blur-[0.75rem] opacity-100 inline-flex items-center justify-center font-['SF_Compact',_sans-serif] font-[457] text-[0.75rem] leading-[1rem] tracking-[0px] align-middle uppercase text-wingman-primary-text">
          {eventTag(event)}
        </span>
      </div>

      <div className="p-[1.25rem] flex flex-col">
        <div className="flex items-start justify-between gap-[0.75rem]">
          <h3 className="font-['SF_Pro',_sans-serif] font-[400] text-[1.5rem] leading-[1.875rem] tracking-[0px] align-middle text-wingman-primary-text">
            {event.title}
          </h3>
          <div className="flex flex-col items-end shrink-0">
            <span className="font-['SF_Pro',_sans-serif] font-[400] text-[1rem] leading-[1.5rem] tracking-[0px] text-right align-middle text-[#A8E8FF]">
              {eventPrice(event)}
            </span>
          </div>
        </div>

        <div className="mt-[0.375rem] flex items-center gap-[0.375rem] font-['SF_Compact',_sans-serif] font-[457] text-[0.875rem] leading-[1.25rem] tracking-[0px] align-middle text-wingman-secondary-text">
          <SvgIcon
            src="/new-wingman/icons/calender2.svg"
            className="w-[0.84375rem] h-[0.9375rem] shrink-0 bg-[#BBC9CF]"
          />
          {eventWhen(event)}
        </div>
        <div className="mt-[0.375rem] flex items-center gap-[0.375rem] font-['SF_Compact',_sans-serif] font-[457] text-[0.875rem] leading-[1.25rem] tracking-[0px] align-middle text-wingman-secondary-text">
          <SvgIcon
            src="/new-wingman/icons/map-pin.svg"
            className="w-[0.84375rem] h-[0.9375rem] shrink-0 bg-[#9CA3AF]"
          />
          {eventVenue(event)}
        </div>

        <div className="mt-[1rem] pt-[1.06875rem] border-t border-white/10 flex justify-center">
          <Link
            href="/events"
            className="inline-flex items-center justify-center w-[11.25rem] h-[3.125rem] rounded-[0.75rem] border border-wingman-cyan bg-transparent font-['SF_Compact',_sans-serif] font-[457] text-[1rem] leading-[1.5rem] tracking-[0px] text-center align-middle text-wingman-cyan hover:bg-wingman-cyan/10 transition-colors"
          >
            Buy Ticket
          </Link>
        </div>
      </div>
    </div>
  );
}

function MobileView({ events, loading, ...filters }: SearchFilterProps & { events: Event[]; loading: boolean }) {
  const ongoing = events.filter((e) => isOngoing(e));
  const featured = ongoing[0] ?? events[0];
  const upcoming = events.filter((e) => e !== featured && !isOngoing(e));

  return (
    <div className="md:hidden mx-auto w-full max-w-8xl pt-[1.25rem] pb-[3rem]">
      <MobileSearchAndFilters {...filters} />

      {filters.tab === "Membership" ? (
        <MembershipSection />
      ) : (
        <>
          <h2 className="mt-[2.25rem] mb-[1rem] font-['SF_Pro',_sans-serif] font-[400] text-[1.5rem] leading-[2rem] tracking-[0px] align-middle text-wingman-primary-text">
            {ongoing.length > 0 ? "Ongoing Events" : "Featured Event"}
          </h2>
          {featured ? <MobileOngoingCard event={featured} /> : <EventsEmpty loading={loading} />}

          <div className="mt-[1.5rem]">
            <MobileJoinClub />
          </div>

          {upcoming.length > 0 && (
            <>
              <h2 className="mt-[2.5rem] mb-[1rem] font-['SF_Pro',_sans-serif] font-[400] text-[1.5rem] leading-[2rem] tracking-[0px] align-middle text-wingman-primary-text">
                Upcoming Events
              </h2>
              <div className="flex flex-col gap-[1.5rem]">
                {upcoming.map((event) => (
                  <MobileEventCard key={event._id} event={event} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

/* ---------------------------------- PAGE ---------------------------------- */

const filterPill =
  "shrink-0 min-h-[2.875rem] px-[1.25rem] rounded-full bg-[#1C1B1B] border border-[#FFFFFF1F] font-['SF_Compact',_sans-serif] font-[457] text-[0.875rem] md:text-[1rem] leading-[1.5rem] tracking-[0px] text-center align-middle text-wingman-secondary-text hover:text-white hover:bg-[#252424] transition-colors inline-flex items-center justify-center whitespace-nowrap";

// NEW (1/3): tab names, above the component
const tabs = ["All Events", "Screenings", "Watch-Parties", "Membership"];

export default function LandingPage() {
  // NEW (2/3): active tab state, first lines inside the component
  const [activeTab, setActiveTab] = useState("All Events");
  const [search, setSearch] = useLandingSearch();
  const { events, loading } = useLandingEvents(activeTab, search);

  return (
    <div className="min-h-screen">
      <SiteNavbar brandName="Wingman Pro" />

      <main className="mx-auto w-full px-4 md:px-12 mt-4">
        {/* Tablet + desktop (>= 768px): unchanged layout */}
        <div className="hidden md:block">
          <HeroSection slides={heroSlides} />

          {/* Filter bar */}
          <div className="w-full max-w-8xl min-h-[5rem] md:min-h-[6rem] border-y border-[#FFFFFF1F] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-[0.875rem] py-[1rem] md:py-[1.5rem]">
            {/* Left: category filters */}
            <div className="flex w-full lg:w-auto flex-wrap items-center gap-[0.625rem] md:gap-[0.75rem]">
              {/* NEW (3/3): replaces the 4 hard-coded buttons */}
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={
                    activeTab === tab
                      ? "shrink-0 min-h-[2.875rem] px-[1.375rem] md:px-[1.5rem] rounded-full border border-wingman-cyan bg-[#A8E8FF1A] font-['SF_Compact',_sans-serif] font-[457] text-[0.875rem] md:text-[1rem] leading-[1.5rem] tracking-[0px] text-center align-middle text-wingman-cyan transition-colors inline-flex items-center justify-center whitespace-nowrap"
                      : filterPill
                  }
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Right: date & location filters (unchanged) */}
            <div className="flex items-center gap-[0.5rem] w-full sm:w-auto min-h-[2.875rem]">
              <button className="flex-1 sm:flex-initial sm:min-w-[7.5rem] flex items-center justify-center gap-[0.5rem] min-h-[2.875rem] px-[1rem] rounded-[0.75rem] bg-[#1C1B1B] border border-[#FFFFFF1F] font-['SF_Compact',_sans-serif] font-[457] text-[0.875rem] md:text-[1rem] leading-[1.5rem] tracking-[0px] text-center align-middle text-wingman-primary-text hover:bg-[#252424] transition-colors whitespace-nowrap">
                <SvgIcon
                  src="/new-wingman/icons/calender2.svg"
                  className="w-[0.84375rem] h-[0.9375rem] shrink-0 bg-[#E5E2E1]"
                />
                Any Date
              </button>
              <button className="flex-1 sm:flex-initial sm:min-w-[7.25rem] flex items-center justify-center gap-[0.5rem] min-h-[2.875rem] px-[1rem] rounded-[0.75rem] bg-[#1C1B1B] border border-[#FFFFFF1F] font-['SF_Compact',_sans-serif] font-[457] text-[0.875rem] md:text-[1rem] leading-[1.5rem] tracking-[0px] text-center align-middle text-wingman-primary-text hover:bg-[#252424] transition-colors whitespace-nowrap">
                <SvgIcon
                  src="/new-wingman/icons/map-pin.svg"
                  className="w-[0.84375rem] h-[0.9375rem] shrink-0 bg-[#9CA3AF]"
                />
                London
              </button>
            </div>
          </div>

          {/* Guest view banner (unchanged) */}
          <div className="mt-[2rem] md:mt-[2.875rem] flex w-full max-w-8xl min-h-[4rem] md:min-h-[4.625rem] items-center gap-[0.75rem] rounded-[1rem] border border-[#FFFFFF1F] bg-[#201F1F33] px-[1rem] md:px-[1.25rem] py-[0.875rem] md:py-[1rem]">
            <SvgIcon
              src="/new-wingman/icons/lock.svg"
              className="h-[1.3125rem] w-[1rem] shrink-0 bg-[#A8E8FF]"
            />
            <p className="font-['SF_Compact',_sans-serif] font-[457] text-[0.875rem] md:text-[1rem] leading-[1.375rem] md:leading-[1.5rem] tracking-[0px] align-middle text-white/80">
              <span className="font-[656] text-white">Guest View:</span> Club
              Dashboards, Leaderboards, and Member Perks are restricted. Join a club to
              unlock full access &amp; discounts.
            </p>
          </div>

          {/* NEW: swaps the events grid for the pass section */}
          {activeTab === "Membership" ? <MembershipSection /> : <EventsGrid events={events} loading={loading} />}

          <AffiliatedClubSection />
        </div>

        {/* Mobile (< 768px) */}
        <MobileView events={events} loading={loading} tab={activeTab} onTab={setActiveTab} search={search} onSearch={setSearch} />
      </main>

      <SiteFooter />
    </div>
  );
}