import { z } from "zod"

export const DATA_DELETION_REQUEST_TYPES = [
  "Delete my account and all associated data.",
  "Request a copy of my data (Data Portability).",
] as const

export const dataDeletionRequestSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required").max(200),
  email: z.string().trim().email("Enter a valid email address").max(320),
  phone: z.string().trim().min(7, "Phone number is required").max(40),
  requestType: z.enum(DATA_DELETION_REQUEST_TYPES, {
    message: "Please select a type of request",
  }),
  reasonForDeletion: z.string().max(5000).optional(),
  confirmed: z.boolean().refine((v) => v === true, {
    message: "Please confirm that you understand this action is permanent.",
  }),
})

export type DataDeletionRequestInput = z.infer<typeof dataDeletionRequestSchema>
