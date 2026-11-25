import type { CollectionConfig } from 'payload'
import { isAdmin } from '@/access/roles'
import { TRADE_BRIEFING_BLOCKS, validatePublicHttpsCitationUrl } from '@/blocks/trade-desk'

export const TradeSheets: CollectionConfig = {
  slug: 'trade-sheets',
  admin: {
    useAsTitle: 'title',
    defaultColumns: [
      'sheetDate',
      'title',
      'sourceMode',
      'executionProgress',
      'quotesRefreshedAt',
      'updatedAt',
    ],
    livePreview: {
      url: ({ data }) => {
        const base = process.env.NEXT_PUBLIC_SERVER_URL || ''
        const dateSlug =
          typeof data?.sheetDate === 'string' && data.sheetDate ? data.sheetDate : ''
        return dateSlug ? `${base}/trade/${dateSlug}` : `${base}/trade`
      },
      breakpoints: [
        { label: 'Desktop', name: 'desktop', width: 1280, height: 900 },
        { label: 'Mobile', name: 'mobile', width: 390, height: 844 },
      ],
    },
  },
  access: {
    read: isAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'sheetDate',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'sourceMode',
      type: 'select',
      defaultValue: 'curated',
      options: [
        { label: 'Curated', value: 'curated' },
        { label: 'Auto VM', value: 'auto_vm' },
        { label: 'Manual', value: 'manual' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'executionProgress',
      type: 'text',
      virtual: true,
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
      hooks: {
        afterRead: [
          ({ data, siblingData }) => {
            const src = (siblingData ?? data ?? {}) as Record<string, unknown>
            const tickets = Array.isArray(src.ticketsJson) ? src.ticketsJson : []
            const checked = Array.isArray(src.checkedRowIds) ? src.checkedRowIds : []
            const validIds = new Set(
              tickets
                .map((t) => (t && typeof t === 'object' ? (t as { id?: unknown }).id : null))
                .filter((id): id is string => typeof id === 'string'),
            )
            const checkedCount =
              validIds.size > 0
                ? checked.filter(
                    (id): id is string => typeof id === 'string' && validIds.has(id),
                  ).length
                : checked.filter((id): id is string => typeof id === 'string').length
            return `${checkedCount} / ${tickets.length} staged`
          },
        ],
      },
    },
    {
      name: 'quotesRefreshedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'relatedTradeNotes',
      type: 'relationship',
      relationTo: 'trade-notes',
      hasMany: true,
      maxDepth: 1,
      admin: {
        position: 'sidebar',
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: '01 · Execution Blotter',
          fields: [
            {
              name: 'title',
              type: 'text',
              required: true,
            },
            {
              name: 'subtitle',
              type: 'text',
            },
            {
              name: 'alertBanner',
              type: 'textarea',
            },
            {
              name: 'ticketsJson',
              type: 'json',
            },
            {
              name: 'checkedRowIds',
              type: 'json',
            },
          ],
        },
        {
          label: '02 · IC Briefing Blocks & Overrides',
          fields: [
            {
              name: 'briefingBlocks',
              type: 'blocks',
              blocks: TRADE_BRIEFING_BLOCKS,
            },
            {
              type: 'collapsible',
              label: 'Legacy Strategy JSON (Backward-Compatible Mirror)',
              admin: {
                initCollapsed: true,
              },
              fields: [
                {
                  name: 'strategyJson',
                  type: 'json',
                },
              ],
            },
          ],
        },
        {
          label: '03 · Citations & Telemetry',
          fields: [
            {
              name: 'kpisJson',
              type: 'json',
            },
            {
              name: 'citations',
              type: 'array',
              maxRows: 60,
              labels: {
                singular: 'Citation',
                plural: 'Citations',
              },
              fields: [
                {
                  name: 'index',
                  type: 'number',
                  required: true,
                },
                {
                  name: 'ticker',
                  type: 'text',
                },
                {
                  name: 'source',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'kind',
                  type: 'select',
                  defaultValue: 'news',
                  options: [
                    { label: 'SEC Filing', value: 'sec_filing' },
                    { label: 'News', value: 'news' },
                    { label: 'Macro', value: 'macro' },
                    { label: 'Research', value: 'research' },
                  ],
                },
                {
                  name: 'label',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'url',
                  type: 'text',
                  required: true,
                  validate: validatePublicHttpsCitationUrl,
                },
                {
                  name: 'publishedAt',
                  type: 'text',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
