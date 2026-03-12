export interface Guild {
  id: string
  name: string
  icon: string | null
  owner: boolean
  permissions: string
}

export interface Channel {
  id: string
  name: string
  type: number
  parent_id: string | null
  position: number
}

export const CHANNEL_TYPE_FORUM = 15
