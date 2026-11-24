// import * as React from "react"
// import { Slot } from "@radix-ui/react-slot"
// import { cva, type VariantProps } from "class-variance-authority"

// import { cn } from "@/lib/utils"

// const buttonVariants = cva(
//   "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
//   {
//     variants: {
//       variant: {
//         default: "bg-primary text-primary-foreground hover:bg-primary/90",
//         destructive:
//           "bg-destructive text-destructive-foreground hover:bg-destructive/90",
//         outline:
//           "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
//         secondary:
//           "bg-secondary text-secondary-foreground hover:bg-secondary/80",
//         ghost: "hover:bg-accent hover:text-accent-foreground",
//         link: "text-primary underline-offset-4 hover:underline",
//       },
//       size: {
//         default: "h-10 px-4 py-2",
//         sm: "h-9 rounded-md px-3",
//         lg: "h-11 rounded-md px-8",
//         icon: "h-10 w-10",
//       },
//     },
//     defaultVariants: {
//       variant: "default",
//       size: "default",
//     },
//   }
// )

// export interface ButtonProps
//   extends React.ButtonHTMLAttributes<HTMLButtonElement>,
//     VariantProps<typeof buttonVariants> {
//   asChild?: boolean
// }

// const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
//   ({ className, variant, size, asChild = false, ...props }, ref) => {
//     const Comp = asChild ? Slot : "button"

//     return (
//       <Comp
//         className={cn(
//           buttonVariants({ variant, size }),
//           className
//         )}
//         ref={ref}
//         {...props}
//       />
//     )
//   }
// )
// Button.displayName = "Button"

// export { Button, buttonVariants }



// components/ui/button.tsx
import Link from "next/link";
import { twMerge } from "tailwind-merge";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "secondary" | "primary" | "ghost";

const base = "flex items-center justify-center rounded-[0.75rem] text-center";

const variants: Record<Variant, string> = {
  secondary:
    "h-[2.875rem] w-[11.25rem] border border-cyan-300/30 bg-wingman-green-button/10 " +
    "font-sf-compact text-[0.875rem] font-[656] leading-[1.25rem] text-white " +
    "transition-colors hover:border-cyan-300/60 hover:bg-wingman-green-button/[0.69]",

  primary:
    "relative isolate h-[4rem] w-[13.5625rem] bg-[linear-gradient(106.56deg,#00D4FF_0%,#9D05FF_100%)] " +
    "font-sf text-[1.5rem] font-[590] leading-[2rem] text-[#FFFFFF] " +
    "before:absolute before:inset-0 before:-z-10 before:rounded-[inherit] " +
    "before:bg-[linear-gradient(106.56deg,#85B7F6_0%,#B87AFE_73%)] " +
    "before:opacity-0 before:transition-opacity before:duration-500 " +
    "before:ease-[cubic-bezier(0.7,-0.4,0.4,1.4)] hover:before:opacity-100 " +
    "max-[767px]:h-[3.25rem] max-[767px]:w-[13.3125rem] max-[767px]:font-sf-compact " +
    "max-[767px]:text-[0.875rem] max-[767px]:font-[656] max-[767px]:leading-[1.25rem] " +
    "max-[767px]:text-[#001F27]",
    
    ghost:
    "h-[2.375rem] w-full gap-2 rounded-[0.25rem] border border-[#ffffff1a] bg-[#ffffff0d] " +
    "py-2 text-[0.875rem] font-semibold leading-[1.25rem] text-wingman-cyan " +
    "transition-colors hover:bg-[#ffffff1a]",
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
  className,
  children,
  href,
  ...rest
}: Props) {
  const classes = twMerge(base, variants[variant], className);

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
    <button type="button" className={classes} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}