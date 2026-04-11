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
      <div
        role="status"
        className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-6 text-slate-800 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-100"
      >
        <p className="text-base font-medium leading-relaxed">{SUCCESS_MESSAGE}</p>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full name</FormLabel>
              <FormControl>
                <Input type="text" autoComplete="name" required {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email address</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="Must match the email used in the app"
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
            <FormItem>
              <FormLabel>Phone number</FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  autoComplete="tel"
                  required
                  placeholder="Must match the number used for Twilio / OTP"
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
            <FormItem>
              <FormLabel>Type of request</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger aria-required>
                    <SelectValue placeholder="Select one option" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {DATA_DELETION_REQUEST_TYPES.map((label) => (
                    <SelectItem key={label} value={label}>
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
            <FormItem>
              <FormLabel>Reason for deletion (optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Product feedback — optional"
                  className="min-h-[100px] resize-y"
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
            <FormItem className="flex flex-row items-start gap-3 space-y-0 rounded-md border border-slate-200 p-4 dark:border-white/10">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="cursor-pointer font-normal text-sm leading-snug">
                  {CONFIRMATION_LABEL}
                </FormLabel>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        {submitError ? (
          <p className="text-sm font-medium text-destructive" role="alert">
            {submitError}
          </p>
        ) : null}

        <Button type="submit" className="w-full sm:w-auto" disabled={isPending}>
          {isPending ? "Submitting…" : "Submit request"}
        </Button>
      </form>
    </Form>
  )
}
