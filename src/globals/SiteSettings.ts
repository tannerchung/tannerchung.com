import type { GlobalConfig } from 'payload'
import { isAdmin } from '@/access/roles'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site Settings & Theme',
  access: {
    read: () => true,
    update: isAdmin,
  },
  fields: [
    {
      name: 'siteName',
      type: 'text',
      required: true,
      defaultValue: 'tannerchung.com',
    },
    {
      name: 'tagline',
      type: 'text',
      defaultValue: 'systems, engineering & capital craft.',
    },
    {
      name: 'locationReadout',
      type: 'text',
      defaultValue: 'BROOKLYN, NY // EST. 2026',
    },
    {
      name: 'activeTheme',
      type: 'select',
      required: true,
      defaultValue: 'lumen',
      options: [
        { label: 'Hallmark · Lumen (Instrument + Apparatus)', value: 'lumen' },
        { label: 'Hallmark · Grid (Swiss Neo-Grotesque)', value: 'grid' },
        { label: 'Hallmark · Cobalt (Blueprint Instrument)', value: 'cobalt' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Active visual design language from cataloged skills.',
      },
    },
    {
      name: 'defaultDrop',
      type: 'select',
      required: true,
      defaultValue: 'night',
      options: [
        { label: 'Drop 01 · Night Foundry (Emission)', value: 'night' },
        { label: 'Drop 02 · Day Foundry (Refraction)', value: 'day' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Default palette physics drop (visitor can also toggle Night/Day).',
      },
    },
  ],
}
