"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CountryCodeSelect } from "@/components/country-code-select"
import { cn } from "@/lib/utils"
import {
  PLAN_ATTRIBUTE_FIELDS,
  hydratePlanAttributes,
  idProofLabelsMatch,
  inputPropsForFieldType,
  attributeVisibleForCheckout,
  isAttributeMandatory,
  isDateFieldType,
  type PlanAttributeKey,
  type PlanAttributes,
} from "@/lib/membershipPlanConfig"
const CLUB_MEMBER_ID_MANDATORY_TEAM_ID = "133604"

export type RegistrationFieldValues = {
  username: string
  first_name: string
  last_name: string
  email: string
  date_of_birth: string
  gender: string
  phoneNumber: string
  countryCode: string
  address_line1: string
  address_line2: string
  city: string
  state_province: string
  zip_code: string
  country: string
  id_proof_type: string
  id_proof_number: string
  club_member_id: string
}

type Props = {
  attributes?: PlanAttributes | null
  values: RegistrationFieldValues
  onChange: (patch: Partial<RegistrationFieldValues>) => void
  customFieldValues: Record<string, string>
  onCustomChange: (label: string, value: string) => void
  clubTeamId?: string
  phoneError?: string
  isDashboard?: boolean
  variant?: "themed" | "plain"
  /** Logged-in member: hide account fields and required answers they already have. */
  existingMember?: boolean
  profile?: Record<string, unknown> | null
}

const BASELINE: { key: keyof RegistrationFieldValues; label: string; required: true }[] = [
  { key: "first_name", label: "First Name", required: true },
  { key: "last_name", label: "Last Name", required: true },
]

export function PlanRegistrationFields({
  attributes,
  values,
  onChange,
  customFieldValues,
  onCustomChange,
  clubTeamId,
  phoneError,
  isDashboard = false,
  variant = "themed",
  existingMember = false,
  profile = null,
}: Props) {
  const attrs = hydratePlanAttributes(attributes)
  const clubMandates = String(clubTeamId ?? "").trim() === CLUB_MEMBER_ID_MANDATORY_TEAM_ID
  const show = (key: PlanAttributeKey) =>
    key === "club_member_id" && clubMandates
      ? true
      : attributeVisibleForCheckout(attrs, key, profile, existingMember)
  const required = (key: PlanAttributeKey) => isAttributeMandatory(attrs, key)
  const idProofTypes = attrs.idProofTypes
  const selectedIdProof = idProofTypes.find((t) => idProofLabelsMatch(t.label, values.id_proof_type))
  const plain = variant === "plain"

  const labelCls = plain
    ? undefined
    : cn(
        "text-[10px] font-bold tracking-widest uppercase",
        isDashboard ? "text-muted-foreground" : "text-secondary"
      )
  const inputCls = plain
    ? "h-12"
    : cn(
        "h-12 rounded-xl focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-primary",
        isDashboard
          ? "border-input bg-background text-foreground placeholder:text-muted-foreground"
          : "border-secondary bg-white text-black placeholder:text-slate-400"
      )
  const star = (on: boolean) =>
    on ? <span className={plain ? "text-destructive ml-0.5" : "text-primary ml-0.5"}>*</span> : null

  const textField = (
    key: keyof RegistrationFieldValues,
    label: string,
    opts?: { required?: boolean; type?: string; span2?: boolean }
  ) => (
    <div key={key} className={cn("space-y-2", opts?.span2 && "sm:col-span-2")}>
      <Label htmlFor={key} className={labelCls}>
        {label}
        {star(Boolean(opts?.required))}
      </Label>
      <Input
        id={key}
        type={opts?.type || "text"}
        value={values[key]}
        onChange={(e) => onChange({ [key]: e.target.value })}
        required={opts?.required}
        className={inputCls}
      />
    </div>
  )

  const extra = (key: PlanAttributeKey) => {
    if (!show(key)) return null
    const meta = PLAN_ATTRIBUTE_FIELDS.find((f) => f.key === key)
    const label = meta?.label ?? key
    const req = required(key)

    if (key === "gender") {
      return (
        <div key={key} className="space-y-2">
          <Label htmlFor="gender" className={labelCls}>
            Gender{star(req)}
          </Label>
          <select
            id="gender"
            value={values.gender}
            onChange={(e) => onChange({ gender: e.target.value })}
            required={req}
            className={cn(
              "w-full h-12 px-3",
              plain
                ? "rounded-md border border-input bg-background text-foreground"
                : cn(
                    "rounded-xl border focus:outline-none focus:border-primary",
                    isDashboard ? "border-input bg-background text-foreground" : "border-secondary bg-white text-black"
                  )
            )}
          >
            {!values.gender ? <option value="">Select</option> : null}
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="non-binary">Non-binary</option>
          </select>
        </div>
      )
    }

    if (key === "date_of_birth") {
      return textField("date_of_birth", label, { required: req, type: "date" })
    }

    if (key === "id_proof") {
      return (
        <div key="id_proof" className="contents">
          <div className="space-y-2">
            <Label htmlFor="id_proof_type" className={labelCls}>
              ID Proof Type{star(req)}
            </Label>
            <select
              id="id_proof_type"
              value={
                idProofTypes.some((t) => idProofLabelsMatch(t.label, values.id_proof_type))
                  ? idProofTypes.find((t) => idProofLabelsMatch(t.label, values.id_proof_type))!.label
                  : idProofTypes[0]?.label ?? ""
              }
              onChange={(e) => onChange({ id_proof_type: e.target.value })}
              required={req}
              className={cn(
                "w-full h-12 px-3",
                plain
                  ? "rounded-md border border-input bg-background text-foreground"
                  : cn(
                      "rounded-xl border focus:outline-none focus:border-primary",
                      isDashboard ? "border-input bg-background text-foreground" : "border-secondary bg-white text-black"
                    )
              )}
            >
              {idProofTypes.map((type) => (
                <option key={type.label} value={type.label}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="id_proof_number" className={labelCls}>
              ID Proof Number{star(req)}
            </Label>
            <Input
              id="id_proof_number"
              {...(selectedIdProof ? inputPropsForFieldType(selectedIdProof.format) : { type: "text" as const })}
              maxLength={
                selectedIdProof && !isDateFieldType(selectedIdProof.format)
                  ? selectedIdProof.maxLength
                  : undefined
              }
              value={values.id_proof_number}
              onChange={(e) => onChange({ id_proof_number: e.target.value })}
              required={req}
              className={inputCls}
            />
          </div>
        </div>
      )
    }

    if (key === "club_member_id") {
      if (!show("club_member_id") && !clubMandates) return null
      const isMandatory = clubMandates || req
      return (
        <div key={key} className="space-y-2 sm:col-span-2">
          <Label htmlFor="club_member_id" className={labelCls}>
            Club Membership ID
            {isMandatory ? star(true) : <span className="text-muted-foreground text-xs ml-1">(Optional)</span>}
          </Label>
          <Input
            id="club_member_id"
            value={values.club_member_id}
            onChange={(e) => onChange({ club_member_id: e.target.value })}
            required={isMandatory}
            placeholder={
              clubMandates
                ? "Arsenal Membership No. (Digital or Red)"
                : "Optional — as registered on official site"
            }
            className={inputCls}
          />
        </div>
      )
    }

    return textField(key as keyof RegistrationFieldValues, label, { required: req })
  }

  const customFields = attrs.customFields
  const hasPlanFields = attrs.fields.some((f) => show(f.key as PlanAttributeKey)) || customFields.length > 0
  if (existingMember && !hasPlanFields) return null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {!existingMember && BASELINE.map((f) => textField(f.key, f.label, { required: true }))}
      {!existingMember && (
      <>
      <div className="space-y-2">
        <Label htmlFor="email" className={labelCls}>
          Email Address{star(true)}
        </Label>
        <Input
          id="email"
          type="email"
          value={values.email}
          onChange={(e) => onChange({ email: e.target.value })}
          required
          className={inputCls}
        />
      </div>

      <div className="sm:col-span-2 grid grid-cols-1 min-[420px]:grid-cols-[7rem_1fr] gap-3">
        <div className="space-y-2">
          <Label htmlFor="countryCode" className={labelCls}>
            Country Code{star(true)}
          </Label>
          <CountryCodeSelect
            id="countryCode"
            value={values.countryCode}
            onValueChange={(value) => onChange({ countryCode: value })}
            className={
              plain
                ? "h-12"
                : cn(
                    "h-12 rounded-xl focus:ring-0 focus:ring-offset-0 focus:border-primary",
                    isDashboard ? "border-input bg-background text-foreground" : "border-secondary bg-white text-black"
                  )
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phoneNumber" className={labelCls}>
            Phone Number{star(true)}
          </Label>
          <Input
            id="phoneNumber"
            type="tel"
            inputMode="numeric"
            minLength={7}
            maxLength={15}
            pattern="\d{7,15}"
            value={values.phoneNumber}
            onChange={(e) => onChange({ phoneNumber: e.target.value.replace(/\D/g, "").slice(0, 15) })}
            required
            className={inputCls}
          />
          {phoneError ? <p className="text-destructive text-sm">{phoneError}</p> : null}
        </div>
      </div>
      </>
      )}

      {attrs.fields.map((f) => extra(f.key as PlanAttributeKey))}

      {attrs.customFields.map((field) => (
        <div key={field.label} className="space-y-2">
          <Label htmlFor={`custom-${field.label}`} className={labelCls}>
            {field.label}
            {star(field.mandatory)}
          </Label>
          {field.type === "dropdown" ? (
            <select
              id={`custom-${field.label}`}
              value={customFieldValues[field.label] ?? ""}
              onChange={(e) => onCustomChange(field.label, e.target.value)}
              required={field.mandatory}
              className={cn(
                "w-full h-12 px-3",
                plain
                  ? "rounded-md border border-input bg-background text-foreground"
                  : cn(
                      "rounded-xl border focus:outline-none focus:border-primary",
                      isDashboard ? "border-input bg-background text-foreground" : "border-secondary bg-white text-black"
                    )
              )}
            >
              <option value="">{field.mandatory ? "Select…" : "Optional"}</option>
              {(field.options ?? []).map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          ) : (
            <Input
              id={`custom-${field.label}`}
              {...inputPropsForFieldType(field.type === "number" ? "number" : field.type === "date" ? "date" : field.type === "email" ? "email" : "text")}
              value={customFieldValues[field.label] ?? ""}
              onChange={(e) => onCustomChange(field.label, e.target.value)}
              required={field.mandatory}
              className={inputCls}
            />
          )}
        </div>
      ))}
    </div>
  )
}
