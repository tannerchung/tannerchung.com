import type { GlobalConfig } from 'payload'
import { isAdmin } from '@/access/roles'

export interface IcSeatConfig {
  seatKey: string
  displayName: string
  archetype: string
  mandate: string
}

export const DEFAULT_IC_SEATS: IcSeatConfig[] = [
  {
    seatKey: 'cio_chair',
    displayName: 'CIO Chair',
    archetype: 'Portfolio Architect',
    mandate: 'Synthesizes household capital allocation, wave sequencing, and final mandate discipline.',
  },
  {
    seatKey: 'druckenmiller',
    displayName: 'Druckenmiller',
    archetype: 'Macro Liquidity & Convexity',
    mandate: 'Evaluates Fed liquidity regimes, earnings inflection points, and asymmetric sizing.',
  },
  {
    seatKey: 'marks',
    displayName: 'Howard Marks',
    archetype: 'Cycle & Second-Level Risk',
    mandate: 'Polices market temperature, downside asymmetry, and consensus crowding.',
  },
  {
    seatKey: 'klarman',
    displayName: 'Seth Klarman',
    archetype: 'Margin of Safety & Cash Floor',
    mandate: 'Defends the liquidity reserve, insists on valuation cushions, and vetoes forced buying.',
  },
  {
    seatKey: 'buffett_munger',
    displayName: 'Buffett & Munger',
    archetype: 'Moat & Compounder Quality',
    mandate: 'Requires durable ROIC, honest management, and long-horizon reinvestment runways.',
  },
  {
    seatKey: 'lynch',
    displayName: 'Peter Lynch',
    archetype: 'GARP & Fundamental Inflection',
    mandate: 'Tracks PEG discipline, channel checks, and clean balance-sheet growth stories.',
  },
  {
    seatKey: 'ackman',
    displayName: 'Bill Ackman',
    archetype: 'Concentrated Catalyst & Governance',
    mandate: 'Presses for identifiable catalysts, free-cash-flow durability, and sharp capital allocation.',
  },
  {
    seatKey: 'simons_quant',
    displayName: 'Simons Quant',
    archetype: 'Factor Exposure & Microstructure',
    mandate: 'Monitors portfolio beta, factor correlation clusters, option spreads, and execution slippage.',
  },
  {
    seatKey: 'cpa_tax',
    displayName: 'CPA Tax Shield',
    archetype: 'After-Tax Wealth Preservation',
    mandate: 'Enforces 30-day wash-sale blackouts, account location, and net-zero short-term tax drag.',
  },
]

export const TradeDeskSettings: GlobalConfig = {
  slug: 'trade-desk-settings',
  label: 'Trade Desk Settings',
  access: {
    read: isAdmin,
    update: isAdmin,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: '01 · Guardrails & Tax Shield',
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
        },
        {
          label: '02 · IPS Targets & IC Panel Roster',
          fields: [
            {
              name: 'ipsTargets',
              type: 'group',
              label: 'IPS Targets',
              fields: [
                {
                  name: 'targetBetaMax',
                  type: 'number',
                  defaultValue: 1.15,
                },
                {
                  name: 'minCashFloorUsd',
                  type: 'number',
                  defaultValue: 95000,
                },
                {
                  name: 'coreAllocationTargetPct',
                  type: 'number',
                  defaultValue: 75,
                },
                {
                  name: 'satelliteMaxSingleWeightPct',
                  type: 'number',
                  defaultValue: 8,
                },
              ],
            },
            {
              name: 'icSeats',
              type: 'array',
              maxRows: 12,
              defaultValue: DEFAULT_IC_SEATS,
              labels: {
                singular: 'IC Panel Seat',
                plural: 'IC Panel Seats',
              },
              fields: [
                {
                  name: 'seatKey',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'displayName',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'archetype',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'mandate',
                  type: 'textarea',
                  required: true,
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
