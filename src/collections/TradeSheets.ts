import type { CollectionConfig } from 'payload'
import { isAdmin } from '@/access/roles'

export const TradeSheets: CollectionConfig = {
  slug: 'trade-sheets',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['sheetDate', 'title', 'quotesRefreshedAt', 'updatedAt'],
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
    },
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
      name: 'kpisJson',
      type: 'json',
    },
    {
      name: 'strategyJson',
      type: 'json',
    },
    {
      name: 'ticketsJson',
      type: 'json',
    },
    {
      name: 'checkedRowIds',
      type: 'json',
    },
    {
      name: 'quotesRefreshedAt',
      type: 'date',
    },
  ],
}
