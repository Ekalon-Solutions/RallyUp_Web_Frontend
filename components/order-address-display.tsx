export interface OrderAddress {
  firstName?: string
  lastName?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
}

interface OrderAddressDisplayProps {
  address?: OrderAddress | null
  emptyMessage?: string
}

export function OrderAddressDisplay({
  address,
  emptyMessage = "Not provided",
}: OrderAddressDisplayProps) {
  if (!address?.address && !address?.city && !address?.zipCode) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>
  }

  const name = [address.firstName, address.lastName].filter(Boolean).join(" ")
  const locality = [address.city, address.state].filter(Boolean).join(", ")

  return (
    <div className="text-sm">
      {name ? <div className="font-medium">{name}</div> : null}
      {address.address ? <div>{address.address}</div> : null}
      {locality || address.zipCode ? (
        <div>
          {locality}
          {address.zipCode ? `${locality ? " " : ""}${address.zipCode}` : ""}
        </div>
      ) : null}
      {address.country ? <div>{address.country}</div> : null}
    </div>
  )
}
