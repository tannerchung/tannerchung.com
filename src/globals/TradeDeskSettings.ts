import type { GlobalConfig } from 'payload'
import { isAdmin } from '@/access/roles'

export const TradeDeskSettings: GlobalConfig = {
  slug: 'trade-desk-settings',
  label: 'Trade Desk Settings',
  access: {
    read: isAdmin,
    update: isAdmin,
  },
  fields: [
    {
      name: 'deskLabel',
      type: 'text',
      required: true,
      defaultValue: 'sovereign wealth & execution desk',
    },
    {
      name: 'cashFloorTarget',
      type: 'text',
      defaultValue: '$95,000 Cash & Treasury Floor (Thru Nov 30)',
    },
    {
      name: 'maxOptionSpreadPct',
      type: 'number',
      defaultValue: 8,
    },
    {
      name: 'taxShieldReadout',
      type: 'text',
      defaultValue: '-$18.5k Realized Schwab TLH Carry · $0.00 Net Tax Target',
    },
    {
      name: 'washSaleBlackoutThrough',
      type: 'text',
      defaultValue: '2026-12-10',
    },
    {
      name: 'washSaleTickers',
      type: 'text',
      defaultValue: 'DRAM, EUAD, ICLN, INTC, KTEC, MAGC, MRVL, SHLD, SMH',
    },
    {
      name: 'standingGuardrails',
      type: 'array',
      labels: {
        singular: 'Standing Guardrail',
        plural: 'Standing Guardrails',
      },
      fields: [
        {
          name: 'code',
          type: 'text',
          required: true,
        },
        {
          name: 'rule',
          type: 'text',
          required: true,
        },
      ],
    },
  ],
}
