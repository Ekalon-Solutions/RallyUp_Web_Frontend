import MembershipPlansClient from "./MembershipPlansClient"

export default async function MembershipPlansPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const clubIdRaw = params?.clubId
  const clubId = typeof clubIdRaw === "string" ? clubIdRaw : ""

  return <MembershipPlansClient clubId={clubId} />
}
