export type ReactionType = "like" | "love" | "laugh" | "sad"
export type Reactions = { total: number; counts: Record<ReactionType, number>; mine: ReactionType | null }
export type ForumMedia = { url: string; type: "image" | "video" }
export type SubTopic = { id: string; name: string; description: string; threads: number; comments: number; lastActivity: string; archived: boolean }
export type Thread = {
  id: string; title: string; body: string; author: string; isAdmin: boolean; subTopicId: string; createdAt: string
  likes: number; comments: number; pinned: boolean; locked: boolean; archived: boolean
  authorId?: string; reactions?: Reactions; media?: ForumMedia[]; lockMessage?: string; isFavorite?: boolean
}
export type ForumComment = {
  id: string; threadId: string; parentId: string | null; author: string; role: "Member" | "Admin"
  createdAt: string; body: string; likes: number; reports: number; removed: boolean
  isOP?: boolean; authorId?: string; editedAt?: string; reactions?: Reactions
}
export type Report = {
  id: string; commentId: string; text: string; thread: string; author: string; count: number
  reasons: { label: string; members: string[] }[]; source: "member" | "profanity"; createdAt: string; status: "Open" | "Flagged" | "Resolved"
}
export type ForumSettings = { rules: string[]; config: Record<string, any> }
export type ThreadPatch = Partial<Pick<Thread, "pinned" | "locked" | "archived">> & { lockMessage?: string; unlockAt?: string }
export type MemberOverview = {
  club: { name: string; description: string; createdAt?: string }
  threads: Thread[]; pinned: Thread[]; favorites: Thread[]; rules: string[]
  config: { favs: number; maxLen: number; editWindow: number; depth: number; reporting: boolean }
}
export type ReactionRow = { userId: string; userName: string; type: ReactionType }
