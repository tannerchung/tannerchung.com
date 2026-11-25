import type { Block } from 'payload'

const BLOCKED_DOMAINS = [
  'mail.google.com',
  'gmail.com',
  'outlook.live.com',
  'mail.yahoo.com',
  'fidelity.com',
  'schwab.com',
  'ml.com',
  'morganstanley.com',
  'interactivebrokers.com',
  'ibkr.com',
  'vanguard.com',
  'etrade.com',
  'tdameritrade.com',
  'robinhood.com',
] as const

const TRACKING_PARAMS = new Set(['fbclid', 'gclid', 'mc_cid', 'mc_eid'])

function isPrivateOrLocalHost(rawHostname: string): boolean {
  const host = rawHostname.toLowerCase().replace(/^\[|\]$/g, '').replace(/\.+$/, '')
  if (!host) return true
  if (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host.endsWith('.internal')
  ) {
    return true
  }

  // IPv6 loopback / unspecified / ULA (fc00::/7) / link-local (fe80::/10) / IPv4-mapped
  if (host.includes(':')) {
    if (host === '::1' || host === '::' || host === '0:0:0:0:0:0:0:1') return true
    if (/^f[cd][0-9a-f]{0,2}:/i.test(host)) return true
    if (/^fe[89ab][0-9a-f]:/i.test(host)) return true
    if (host.startsWith('::ffff:')) {
      const mapped = host.slice('::ffff:'.length)
      if (/^\d+\.\d+\.\d+\.\d+$/.test(mapped)) {
        return isPrivateIpv4(mapped)
      }
      // Hex form e.g. ::ffff:7f00:1, ::ffff:a00:1, ::ffff:c0a8:101, ::ffff:a9fe:1
      if (/^(7f|0?a|c0a8|a9fe|ac1[0-9a-f]|0+:0+)/i.test(mapped)) return true
    }
    return false
  }

  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    return isPrivateIpv4(host)
  }

  // Disallow single-label intranet hostnames without a public TLD separator
  if (!host.includes('.')) return true

  return false
}

function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split('.').map((p) => Number(p))
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    return true
  }
  const [a, b] = parts
  if (a === 0) return true // 0.0.0.0/8
  if (a === 10) return true // 10.0.0.0/8
  if (a === 127) return true // 127.0.0.0/8
  if (a === 169 && b === 254) return true // 169.254.0.0/16 link-local
  if (a === 172 && b >= 16 && b <= 31) return true // 172.16.0.0/12
  if (a === 192 && b === 168) return true // 192.168.0.0/16
  return false
}

function isBlockedDomain(rawHostname: string): boolean {
  const host = rawHostname.toLowerCase().replace(/\.+$/, '')
  return BLOCKED_DOMAINS.some((domain) => host === domain || host.endsWith(`.${domain}`))
}

export function validatePublicHttpsCitationUrl(value: unknown): string | true {
  if (typeof value !== 'string') {
    return 'Citation URL must be a non-empty https:// URL'
  }
  const trimmed = value.trim()
  if (!trimmed) {
    return 'Citation URL must be a non-empty https:// URL'
  }

  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    return 'Citation URL must be a valid absolute https:// URL'
  }

  if (parsed.protocol !== 'https:') {
    return 'Citation URL must use the https:// scheme'
  }

  if (parsed.username || parsed.password) {
    return 'Citation URL must not include embedded credentials'
  }

  if (isPrivateOrLocalHost(parsed.hostname)) {
    return 'Citation URL must reference a public internet host'
  }

  if (isBlockedDomain(parsed.hostname)) {
    return 'Citation URL cannot point to webmail or private brokerage domains'
  }

  return true
}

export function sanitizeCitationUrl(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  if (!trimmed) return null

  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    return null
  }

  const keysToDelete: string[] = []
  for (const key of parsed.searchParams.keys()) {
    const lower = key.toLowerCase()
    if (lower.startsWith('utm_') || TRACKING_PARAMS.has(lower)) {
      keysToDelete.push(key)
    }
  }
  for (const key of keysToDelete) {
    parsed.searchParams.delete(key)
  }

  const cleaned = parsed.toString()
  if (validatePublicHttpsCitationUrl(cleaned) !== true) {
    return null
  }
  return cleaned
}

export const ExecutiveMandateBlock: Block = {
  slug: 'executiveMandate',
  dbName: 'exec_mandate',
  labels: {
    singular: 'Executive Mandate',
    plural: 'Executive Mandates',
  },
  fields: [
    {
      name: 'posture',
      type: 'select',
      required: true,
      defaultValue: 'balanced',
      options: [
        { label: 'Risk On', value: 'risk_on' },
        { label: 'Balanced', value: 'balanced' },
        { label: 'Defensive', value: 'defensive' },
        { label: 'Stand Aside', value: 'stand_aside' },
      ],
    },
    {
      name: 'mandateHeadline',
      type: 'text',
      required: true,
    },
    {
      name: 'cashFloorGate',
      type: 'text',
    },
    {
      name: 'regimeCall',
      type: 'text',
    },
    {
      name: 'summaryPoints',
      type: 'array',
      fields: [
        {
          name: 'text',
          type: 'textarea',
          required: true,
        },
      ],
    },
    {
      name: 'holdOffNotes',
      type: 'array',
      fields: [
        {
          name: 'note',
          type: 'textarea',
          required: true,
        },
      ],
    },
    {
      name: 'citationRefs',
      type: 'text',
      admin: {
        description: 'Comma-separated citation indices, e.g. "1, 2"',
      },
    },
  ],
}

export const MoveRationalesBlock: Block = {
  slug: 'moveRationales',
  labels: {
    singular: 'Move Rationales',
    plural: 'Move Rationales',
  },
  fields: [
    {
      name: 'sectionTitle',
      type: 'text',
      defaultValue: 'Ticket-by-Ticket Action Rationale',
    },
    {
      name: 'items',
      type: 'array',
      fields: [
        {
          name: 'ticker',
          type: 'text',
          required: true,
        },
        {
          name: 'action',
          type: 'text',
          required: true,
        },
        {
          name: 'conviction',
          type: 'select',
          defaultValue: 'medium',
          options: [
            { label: 'High', value: 'high' },
            { label: 'Medium', value: 'medium' },
            { label: 'Low', value: 'low' },
            { label: 'Trim', value: 'trim' },
            { label: 'Hold', value: 'hold' },
          ],
        },
        {
          name: 'horizon',
          type: 'text',
        },
        {
          name: 'rationale',
          type: 'textarea',
          required: true,
        },
        {
          name: 'keyRisks',
          type: 'textarea',
        },
        {
          name: 'citationRefs',
          type: 'text',
        },
      ],
    },
  ],
}

export const PanelDebatesBlock: Block = {
  slug: 'panelDebates',
  labels: {
    singular: 'IC Panel Debate',
    plural: 'IC Panel Debates',
  },
  fields: [
    {
      name: 'topic',
      type: 'text',
      required: true,
    },
    {
      name: 'consensusSummary',
      type: 'textarea',
    },
    {
      name: 'dissentHeadline',
      type: 'text',
    },
    {
      name: 'strongestUnresolvedObjection',
      type: 'textarea',
    },
    {
      name: 'seats',
      type: 'array',
      maxRows: 12,
      fields: [
        {
          name: 'seatKey',
          type: 'text',
          required: true,
        },
        {
          name: 'seatName',
          type: 'text',
          required: true,
        },
        {
          name: 'stance',
          type: 'select',
          required: true,
          defaultValue: 'approve',
          options: [
            { label: 'Approve', value: 'approve' },
            { label: 'Caution', value: 'caution' },
            { label: 'Dissent', value: 'dissent' },
            { label: 'Abstain', value: 'abstain' },
          ],
        },
        {
          name: 'thesis',
          type: 'textarea',
          required: true,
        },
        {
          name: 'objection',
          type: 'textarea',
        },
        {
          name: 'citationRefs',
          type: 'text',
        },
      ],
    },
  ],
}

export const RedTeamChallengerBlock: Block = {
  slug: 'redTeamChallenger',
  dbName: 'red_team',
  labels: {
    singular: 'Red-Team Challenger',
    plural: 'Red-Team Challengers',
  },
  fields: [
    {
      name: 'challengerTitle',
      type: 'text',
      defaultValue: 'Autonomous Red-Team & Second-Level Blind Spots',
    },
    {
      name: 'overallSeverity',
      type: 'select',
      defaultValue: 'elevated',
      options: [
        { label: 'Low', value: 'low' },
        { label: 'Elevated', value: 'elevated' },
        { label: 'Critical', value: 'critical' },
      ],
    },
    {
      name: 'preMortemSummary',
      type: 'textarea',
      required: true,
    },
    {
      name: 'blindSpots',
      type: 'array',
      fields: [
        {
          name: 'category',
          type: 'select',
          defaultValue: 'concentration',
          options: [
            { label: 'Macro', value: 'macro' },
            { label: 'Concentration', value: 'concentration' },
            { label: 'Liquidity', value: 'liquidity' },
            { label: 'Tax / Wash Sale', value: 'tax_wash_sale' },
            { label: 'Options Pin', value: 'options_pin' },
            { label: 'Valuation', value: 'valuation' },
          ],
        },
        {
          name: 'severity',
          type: 'select',
          defaultValue: 'medium',
          options: [
            { label: 'Low', value: 'low' },
            { label: 'Medium', value: 'medium' },
            { label: 'High', value: 'high' },
          ],
        },
        {
          name: 'claim',
          type: 'textarea',
          required: true,
        },
        {
          name: 'mitigation',
          type: 'textarea',
        },
        {
          name: 'citationRefs',
          type: 'text',
        },
      ],
    },
  ],
}

export const NewsCatalystsBlock: Block = {
  slug: 'newsCatalysts',
  labels: {
    singular: 'News & Catalysts',
    plural: 'News & Catalysts',
  },
  fields: [
    {
      name: 'windowLabel',
      type: 'text',
      defaultValue: 'Last 72h Corroborated Wire & SEC Filings',
    },
    {
      name: 'items',
      type: 'array',
      fields: [
        {
          name: 'ticker',
          type: 'text',
        },
        {
          name: 'headline',
          type: 'text',
          required: true,
        },
        {
          name: 'catalystKind',
          type: 'select',
          defaultValue: 'sec_filing',
          options: [
            { label: 'SEC Filing', value: 'sec_filing' },
            { label: 'Earnings', value: 'earnings' },
            { label: 'Macro', value: 'macro' },
            { label: 'Analyst', value: 'analyst' },
            { label: 'Geopolitical', value: 'geopolitical' },
          ],
        },
        {
          name: 'impactSummary',
          type: 'textarea',
        },
        {
          name: 'publishedAt',
          type: 'text',
        },
        {
          name: 'citationIndex',
          type: 'number',
        },
      ],
    },
  ],
}

export const DeskAnnotationBlock: Block = {
  slug: 'deskAnnotation',
  labels: {
    singular: 'Desk Annotation',
    plural: 'Desk Annotations',
  },
  fields: [
    {
      name: 'author',
      type: 'text',
      defaultValue: 'Tanner Chung',
    },
    {
      name: 'pinToTop',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'scope',
      type: 'select',
      defaultValue: 'session',
      options: [
        { label: 'Session', value: 'session' },
        { label: 'Ticker', value: 'ticker' },
        { label: 'Risk Override', value: 'risk_override' },
        { label: 'Post-Mortem', value: 'post_mortem' },
      ],
    },
    {
      name: 'ticker',
      type: 'text',
    },
    {
      name: 'heading',
      type: 'text',
      required: true,
    },
    {
      name: 'body',
      type: 'textarea',
      required: true,
    },
    {
      name: 'createdAtNote',
      type: 'date',
    },
  ],
}

export const TRADE_BRIEFING_BLOCKS: Block[] = [
  ExecutiveMandateBlock,
  MoveRationalesBlock,
  PanelDebatesBlock,
  RedTeamChallengerBlock,
  NewsCatalystsBlock,
  DeskAnnotationBlock,
]

export const ValuationBandBlock: Block = {
  slug: 'valuationBand',
  labels: {
    singular: 'Valuation Band',
    plural: 'Valuation Bands',
  },
  fields: [
    {
      name: 'ticker',
      type: 'text',
      required: true,
    },
    {
      name: 'asOfDate',
      type: 'text',
    },
    {
      name: 'buyBelowUsd',
      type: 'number',
    },
    {
      name: 'fairValueUsd',
      type: 'number',
    },
    {
      name: 'trimAboveUsd',
      type: 'number',
    },
    {
      name: 'currentSpotUsd',
      type: 'number',
    },
    {
      name: 'methodology',
      type: 'text',
    },
    {
      name: 'notes',
      type: 'textarea',
    },
  ],
}

export const KillSwitchRuleBlock: Block = {
  slug: 'killSwitchRule',
  labels: {
    singular: 'Kill-Switch Rule',
    plural: 'Kill-Switch Rules',
  },
  fields: [
    {
      name: 'ticker',
      type: 'text',
      required: true,
    },
    {
      name: 'triggerKind',
      type: 'select',
      defaultValue: 'fundamental',
      options: [
        { label: 'Fundamental', value: 'fundamental' },
        { label: 'Technical', value: 'technical' },
        { label: 'Regulatory', value: 'regulatory' },
        { label: 'Allocation', value: 'allocation' },
      ],
    },
    {
      name: 'condition',
      type: 'textarea',
      required: true,
    },
    {
      name: 'action',
      type: 'text',
      required: true,
    },
    {
      name: 'severity',
      type: 'select',
      defaultValue: 'watch',
      options: [
        { label: 'Watch', value: 'watch' },
        { label: 'Mandatory Exit', value: 'mandatory_exit' },
      ],
    },
  ],
}

export const TRADE_NOTE_LEXICAL_BLOCKS: Block[] = [
  ValuationBandBlock,
  KillSwitchRuleBlock,
]
