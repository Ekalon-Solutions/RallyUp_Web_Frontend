# RallyUp Web Frontend CLI Guidelines

## Tech Stack
- Next.js 15 (App Router)
- Typescript
- Tailwind CSS & Radix UI / Lucide React
- Integrations: Firebase, Razorpay, Socket.io-client

## Useful Scripts
- `npm run dev` - Start the Next.js development server
- `npm run build` - Build the project for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint over the project
- `npm run env:dev` - Switch environment to strictly `dev`
- `npm run env:staging` - Switch environment to strictly `staging`
- `npm run env:prod` - Switch environment to strictly `prod`

## Architecture & Code Guidelines
- Utilize React Server Components (`RSC`) predominantly for pages inside the `app/` directory. 
- Prefix hooks and interactive components with `"use client"`.
- Use Tailwind classes for styling (leveraging Radix UI for structural components).
- Form states and validations are managed efficiently (e.g., using `react-hook-form` / `zod`).
- Keep components small, decoupled, and reusable. Avoid deeply nested structures.
