import type { CollectionConfig, Where } from 'payload'
import { isAdmin, publishedOrAdmin } from '@/access/roles'

export const Projects: CollectionConfig = {
  slug: 'projects',
  versions: { drafts: true },
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'slug', 'statusLabel', 'updatedAt'] },
  access: { read: publishedOrAdmin, create: isAdmin, update: isAdmin, delete: isAdmin },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'summary', type: 'textarea', required: true },
    { name: 'statusLabel', type: 'text', defaultValue: 'Shipped' },
    { name: 'liveUrl', type: 'text' },
    { name: 'repoUrl', type: 'text' },
    { name: 'cover', type: 'upload', relationTo: 'media' },
    { name: 'body', type: 'richText' },
    { name: 'featured', type: 'checkbox', defaultValue: false },
  ],
}

export const Posts: CollectionConfig = {
  slug: 'posts',
  versions: { drafts: true },
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'slug', 'publishedAt', '_status'] },
  access: { read: publishedOrAdmin, create: isAdmin, update: isAdmin, delete: isAdmin },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'excerpt', type: 'textarea' },
    { name: 'publishedAt', type: 'date' },
    { name: 'cover', type: 'upload', relationTo: 'media' },
    { name: 'body', type: 'richText', required: true },
  ],
}

export const Experiments: CollectionConfig = {
  slug: 'experiments',
  versions: { drafts: true },
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'slug', 'category', 'visibility'] },
  access: {
    read: ({ req }) => {
      if ((req.user as { role?: string } | null)?.role === 'admin') return true
      const query: Where = {
        and: [{ _status: { equals: 'published' } }, { visibility: { equals: 'public' } }],
      }
      return query
    },
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    {
      name: 'category',
      type: 'select',
      required: true,
      defaultValue: 'motion',
      options: ['motion', 'theme', 'interactive', 'instagram-skill', 'shader'],
    },
    {
      name: 'visibility',
      type: 'select',
      required: true,
      defaultValue: 'public',
      options: ['public', 'private'],
    },
    { name: 'componentKey', type: 'text', required: true },
    { name: 'notes', type: 'richText' },
  ],
}

export const TradeNotes: CollectionConfig = {
  slug: 'trade-notes',
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'ticker', 'strategy', 'updatedAt'] },
  access: { read: isAdmin, create: isAdmin, update: isAdmin, delete: isAdmin },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'ticker', type: 'text', index: true },
    { name: 'strategy', type: 'text' },
    { name: 'thesis', type: 'richText' },
    { name: 'metricsJson', type: 'json' },
    { name: 'sheetUrl', type: 'text' },
  ],
}
