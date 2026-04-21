"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DATA_DELETION_REQUEST_TYPES,
  dataDeletionRequestSchema,
  type DataDeletionRequestInput,
} from "@/lib/data-deletion-request-schema"
import type { DefaultValues } from "react-hook-form"

const SUCCESS_MESSAGE =
  "Your request has been received. Your data will be purged within 30 days."

const CONFIRMATION_LABEL =
  "I understand that this action is permanent and my ticket history, memberships, and profile cannot be recovered."

export function DataDeletionRequestForm(): React.JSX.Element {
  const [submitted, setSubmitted] = React.useState(false)
  const [submitError, setSubmitError] = React.useState<string | null>(null)
  const [isPending, startTransition] = React.useTransition()

  const form = useForm<DataDeletionRequestInput>({
    resolver: zodResolver(dataDeletionRequestSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      reasonForDeletion: "",
      confirmed: false,
    } satisfies DefaultValues<DataDeletionRequestInput>,
  })

  function onSubmit(values: DataDeletionRequestInput) {
    setSubmitError(null)
    startTransition(async () => {
      try {
        const res = await fetch("/api/data-deletion-request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: values.fullName,
            email: values.email,
            phone: values.phone,
            requestType: values.requestType,
            reasonForDeletion: values.reasonForDeletion?.trim() || undefined,
            confirmed: values.confirmed,
          }),
        })
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        if (!res.ok) {
          setSubmitError(data.error || "Something went wrong. Please try again.")
          return
        }
        setSubmitted(true)
        form.reset()
      } catch {
        setSubmitError("Network error. Please check your connection and try again.")
      }
    })
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4 text-center h-full">
        <div className="w-16 h-16 rounded-full bg-secondary-purple text-primary flex items-center justify-center text-3xl">✓</div>
        <p className="text-background font-bold text-xl">{SUCCESS_MESSAGE}</p>
        <Button
          variant="outline"
          className="border-0 bg-primary rounded-[5px] text-xs font-medium uppercase tracking-wide text-white hover:text-white mt-2"
          onClick={() => setSubmitted(false)}
        >
          Submit another
        </Button>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 bg-secondary-purple/50 p-4 sm:p-6 rounded-[10px]">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel className="text-secondary text-xs font-semibold">Full Name</FormLabel>
              <FormControl>
                <Input type="text" autoComplete="name" required className="w-full h-11 px-4 border rounded-[10px] text-xs placeholder-[#888] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-secondary shadow-none bg-white" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel className="text-secondary text-xs font-semibold">Email address</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="Must match the email used in the app"
                  className="w-full h-11 px-4 border rounded-[10px] text-xs placeholder-[#888] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-secondary shadow-none bg-white"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel className="text-secondary text-xs font-semibold">Phone number</FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  autoComplete="tel"
                  required
                  placeholder="Must match the number used for Twilio / OTP"
                  className="w-full h-11 px-4 border rounded-[10px] text-xs placeholder-[#888] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-secondary shadow-none bg-white"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="requestType"
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel className="text-secondary text-xs font-semibold">Type of request</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger aria-required className="w-full h-11 px-4 border rounded-[10px] text-xs focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:border-secondary shadow-none bg-white data-[placeholder]:text-[#888]">
                    <SelectValue placeholder="Select one option" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-white">
                  {DATA_DELETION_REQUEST_TYPES.map((label) => (
                    <SelectItem key={label} value={label} className="text-xs focus:bg-secondary-purple/20 cursor-pointer">
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="reasonForDeletion"
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel className="text-secondary text-xs font-semibold">Reason for deletion (optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Product feedback — optional"
                  className="min-h-[100px] w-full px-4 py-3 border rounded-[10px] text-xs placeholder-[#888] resize-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-secondary shadow-none bg-white"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmed"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start gap-3 space-y-0 p-4 border rounded-[10px] bg-white">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} className="mt-0.5 border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="cursor-pointer text-xs font-medium text-[#888] leading-tight">
                  {CONFIRMATION_LABEL}
                </FormLabel>
                <FormMessage className="text-[10px]" />
              </div>
            </FormItem>
          )}
        />

        {submitError ? (
          <p className="text-xs font-medium text-destructive px-1" role="alert">
            {submitError}
          </p>
        ) : null}

        <div className="pt-2 flex flex-col gap-3">
          <Button type="submit" variant="secondary" className="bg-secondary/40 h-11 rounded-[10px] text-xs shadow-none" disabled={isPending}>
            {isPending ? "Submitting…" : "Submit request"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
