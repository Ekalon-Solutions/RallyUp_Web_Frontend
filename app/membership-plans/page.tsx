import MembershipPlansClient from "./MembershipPlansClient"

export default function MembershipPlansPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>
}) {
  const clubIdRaw = searchParams?.clubId
  const clubId = typeof clubIdRaw === "string" ? clubIdRaw : ""

  return <MembershipPlansClient clubId={clubId} />
}
