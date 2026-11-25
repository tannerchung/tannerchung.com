import type { CollectionConfig, Where } from 'payload'
import { BlocksFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { isAdmin, publishedOrAdmin } from '@/access/roles'
import { TRADE_NOTE_LEXICAL_BLOCKS } from '@/blocks/trade-desk'

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
  versions: { drafts: true },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'ticker', 'conviction', 'valuationZone', '_status', 'updatedAt'],
  },
  access: {
    read: isAdmin,
    readVersions: isAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'ticker', type: 'text', index: true },
    {
      name: 'conviction',
      type: 'select',
      defaultValue: 'high',
      options: [
        { label: 'High', value: 'high' },
        { label: 'Medium', value: 'medium' },
        { label: 'Watch', value: 'watch' },
        { label: 'Avoid', value: 'avoid' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'valuationZone',
      type: 'select',
      defaultValue: 'hold_zone',
      options: [
        { label: 'Buy Zone', value: 'buy_zone' },
        { label: 'Hold Zone', value: 'hold_zone' },
        { label: 'Trim Zone', value: 'trim_zone' },
      ],
      admin: { position: 'sidebar' },
    },
    { name: 'strategy', type: 'text' },
    {
      name: 'thesis',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          BlocksFeature({ blocks: TRADE_NOTE_LEXICAL_BLOCKS }),
        ],
      }),
    },
    { name: 'metricsJson', type: 'json' },
    { name: 'sheetUrl', type: 'text' },
    {
      name: 'referencedInSheets',
      type: 'join',
      collection: 'trade-sheets',
      on: 'relatedTradeNotes',
      admin: {
        allowCreate: false,
        defaultColumns: ['sheetDate', 'title', 'sourceMode', 'updatedAt'],
      },
    },
  ],
}
