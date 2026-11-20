import type { Access } from 'payload'

type UserLike = { id?: string; role?: string | null } | null | undefined

export const isAdmin: Access = ({ req }) => {
  const user = req.user as UserLike
  return Boolean(user && user.role === 'admin')
}

export const publishedOrAdmin: Access = ({ req }) => {
  const user = req.user as UserLike
  if (user && user.role === 'admin') return true
  return { _status: { equals: 'published' } }
}
