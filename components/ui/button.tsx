// components/ui/button.tsx
import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "secondary" | "primary" | "ghost" | "main" | "price";

const base = "flex items-center justify-center text-center align-middle";

const variants: Record<Variant, string> = {
  // Glass button. Same on desktop and mobile
  secondary:
    "rounded-[0.75rem] border border-cyan-300/30 bg-wingman-green-button/10 " +
    "font-sf-compact text-[0.875rem] font-[656] leading-[1.25rem] tracking-[0rem] text-[#E5E2E1] " +
    "transition-colors duration-300 ease-out " +
    "hover:border-[#A8E8FFB0] hover:bg-[#A8E8FF1A]",

  // Gradient button. The hover gradient is a layer that fades in
  // Desktop: SF Pro 24px, white text. Mobile: SF Compact 14px, dark text
  primary:
    "relative isolate rounded-[0.75rem] bg-[linear-gradient(106.56deg,#00D4FF_0%,#9D05FF_100%)] " +
    "font-sf text-[1.5rem] font-[590] leading-[2rem] tracking-[0rem] text-[#FFFFFF] " +
    "before:absolute before:inset-0 before:-z-10 before:rounded-[inherit] " +
    "before:bg-[linear-gradient(106.56deg,#85B7F6_0%,#B87AFE_73%)] " +
    "before:opacity-0 before:transition-opacity before:duration-500 " +
    "before:ease-[cubic-bezier(0.7,-0.4,0.4,1.4)] hover:before:opacity-100 " +
    "max-[767px]:font-sf-compact max-[767px]:text-[0.875rem] max-[767px]:font-[656] " +
    "max-[767px]:leading-[1.25rem] max-[767px]:text-[#001F27]",

  // Same on every screen size
  ghost:
    "gap-2 rounded-[0.25rem] border border-[#ffffff1a] bg-[#ffffff0d] " +
    "text-[0.875rem] font-semibold leading-[1.25rem] text-wingman-cyan " +
    "transition-colors hover:bg-[#ffffff1a]",

  // Main page gradient button with 300ms hover gradient transition and icon support
  main:
    "relative isolate gap-2 rounded-[0.75rem] bg-[linear-gradient(90deg,#00D4FF_0%,#9D05FF_100%)] " +
    "font-sf-compact text-[1rem] font-[457] leading-[1.5rem] tracking-[0rem] text-[#003642] " +
    "before:absolute before:inset-0 before:-z-10 before:rounded-[inherit] " +
    "before:bg-[linear-gradient(90deg,#85B7F6_0%,#BE73FF_100%)] " +
    "before:opacity-0 before:transition-opacity before:duration-300 " +
    "before:ease-[cubic-bezier(0.7,-0.4,0.4,1.4)] hover:before:opacity-100",

  // Pill price button. White with a thin dark border, fills cyan on hover
  price:
    "shrink-0 whitespace-nowrap rounded-[6.25rem] border border-[#000000C4] bg-[#FFFFFF] " +
    "font-['Inter',sans-serif] text-[0.75rem] font-[700] leading-[100%] tracking-[0em] text-[#050505] " +
    "transition-colors duration-300 ease-in-out hover:bg-[#82E0FA]",
};

type Props = {
  variant?: Variant;
  className?: string;
  children: ReactNode;
  href?: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "children" | "href">;

export default function Button({
  variant = "secondary",
  className = "",
  children,
  href,
  ...rest
}: Props) {
  const classes = `${base} ${variants[variant]} ${className}`.trim();

  if (href) {
    const external = /^(mailto:|tel:|https?:\/\/)/.test(href);
    return external ? (
      <a href={href} className={classes} {...rest}>
        {children}
      </a>
    ) : (
      <Link href={href} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={classes}
      {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {children}
    </button>
  );
}