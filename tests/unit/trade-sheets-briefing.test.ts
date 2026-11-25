import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  compileBriefingToPayloadBlocks,
  extractSheetTickers,
  mergeIngestBriefingBlocks,
  sanitizeTradeSheetInput,
  scrubBriefingProse,
  stripEmojis,
  type TradeBriefingBlock,
} from '@/lib/trade-sheets'

const mockPayload = {
  find: vi.fn(),
  update: vi.fn(),
  create: vi.fn(),
}

vi.mock('payload', () => ({
  getPayload: vi.fn(async () => mockPayload),
}))

vi.mock('@payload-config', () => ({
  default: {},
}))

import { POST as ingestPost } from '@/app/api/trade-sheets/ingest/route'

describe('Trade Sheets Briefing Compiler & Prose Scrubber', () => {
  it('strips emojis, markdown artifacts, inline URLs, and 8+ digit account numbers from briefing prose', () => {
    expect(stripEmojis('🚀 Trim NVDA 🔥 now ✅')).toBe('Trim NVDA now')
    const dirty =
      '## 🚀 **Trim NVDA** from account 1234567890 per [SEC 10-Q](https://www.sec.gov/test) and check https://reuters.com/foo (`urgent`)'
    const clean = scrubBriefingProse(dirty)
    expect(clean).not.toContain('🚀')
    expect(clean).not.toContain('**')
    expect(clean).not.toContain('https://')
    expect(clean).not.toContain('1234567890')
    expect(clean).toContain('[REDACTED-ACCT]')
    expect(clean).toContain('Trim NVDA')
    expect(clean).toContain('SEC 10-Q')
    expect(clean).toContain('urgent')
  })

  it('compiles structured briefing JSON into 5 Payload blocks and remaps filtered citations', () => {
    const { briefingBlocks, citations } = compileBriefingToPayloadBlocks({
      executiveMandate: {
        posture: 'defensive',
        mandateHeadline: '🛡️ **Protect $95k Floor** before buying dips',
        cashFloorGate: '$110k cash vs $95k floor',
        summaryPoints: ['🔥 Lock Wave 1 sells first https://evil.com/x'],
        holdOffNotes: ['Hold off on SMH until Dec 10'],
        citationRefs: '1, 2, 3',
      },
      moveRationales: {
        items: [
          {
            ticker: 'nvda',
            action: 'sell',
            conviction: 'trim',
            rationale: 'Trim strength above $148',
            citationRefs: '2',
          },
        ],
      },
      panelDebates: {
        topic: 'AI Capex Durability',
        consensusSummary: 'Majority favors trimming.',
        dissentHeadline: 'Druckenmiller dissents on early trim',
        strongestUnresolvedObjection: 'Earnings revisions remain upward.',
        seats: [
          {
            seatKey: 'marks',
            seatName: 'Howard Marks',
            stance: 'approve',
            thesis: 'Trim into optimism.',
            citationRefs: '2',
          },
        ],
      },
      redTeamChallenger: {
        overallSeverity: 'critical',
        preMortemSummary: 'Yield spike compresses long-duration AI multiples.',
        blindSpots: [
          {
            category: 'concentration',
            severity: 'high',
            claim: 'Semi factor exceeds 30%',
            mitigation: 'Trim Wave 1 first',
            citationRefs: '2',
          },
        ],
      },
      newsCatalysts: {
        items: [
          {
            ticker: 'NVDA',
            headline: 'Blackwell ramp disclosure in 10-Q',
            catalystKind: 'sec_filing',
            citationIndex: 2,
          },
        ],
      },
      citations: [
        {
          index: 1,
          source: 'Fidelity',
          label: 'Private account page (MUST DROP)',
          url: 'https://digital.fidelity.com/account/123',
        },
        {
          index: 2,
          ticker: 'NVDA',
          source: 'SEC EDGAR',
          kind: 'sec_filing',
          label: 'NVIDIA 10-Q',
          url: 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001045810&utm_source=x',
        },
        {
          index: 3,
          source: 'Insecure',
          label: 'Plain HTTP (MUST DROP)',
          url: 'http://example.com/news',
        },
      ],
    })

    // Only citation #2 survives and gets re-indexed to [1]
    expect(citations).toHaveLength(1)
    expect(citations[0].index).toBe(1)
    expect(citations[0].url).toBe(
      'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001045810',
    )

    expect(briefingBlocks.map((b) => b.blockType)).toEqual([
      'executiveMandate',
      'moveRationales',
      'panelDebates',
      'redTeamChallenger',
      'newsCatalysts',
    ])

    const mandate = briefingBlocks[0]
    expect(mandate.blockType === 'executiveMandate' && mandate.mandateHeadline).toBe(
      'Protect $95k Floor before buying dips',
    )
    expect(mandate.blockType === 'executiveMandate' && mandate.citationRefs).toBe('1')

    const news = briefingBlocks[4]
    expect(news.blockType === 'newsCatalysts' && news.items?.[0]?.citationIndex).toBe(1)
  })

  it('preserves human deskAnnotation blocks across re-ingest (pinned top, unpinned bottom)', () => {
    const existing: TradeBriefingBlock[] = [
      {
        id: 'ann-pinned',
        blockType: 'deskAnnotation',
        author: 'Tanner Chung',
        pinToTop: true,
        scope: 'risk_override',
        heading: 'Pinned human override',
        body: 'Do not sell below $148.',
      },
      {
        id: 'old-mandate',
        blockType: 'executiveMandate',
        posture: 'balanced',
        mandateHeadline: 'Old machine mandate',
      },
      {
        id: 'ann-bottom',
        blockType: 'deskAnnotation',
        author: 'Tanner Chung',
        pinToTop: false,
        scope: 'post_mortem',
        heading: 'Post-close reflection',
        body: 'Execution was clean.',
      },
    ]

    const incoming: TradeBriefingBlock[] = [
      {
        blockType: 'executiveMandate',
        posture: 'defensive',
        mandateHeadline: 'New machine mandate',
      },
      {
        blockType: 'redTeamChallenger',
        preMortemSummary: 'Updated pre-mortem.',
      },
    ]

    const merged = mergeIngestBriefingBlocks(existing, incoming)
    expect(merged.map((b) => b.blockType)).toEqual([
      'deskAnnotation',
      'executiveMandate',
      'redTeamChallenger',
      'deskAnnotation',
    ])
    expect(merged[0].id).toBe('ann-pinned')
    expect(merged[3].id).toBe('ann-bottom')
  })

  it('remains backward-compatible with legacy ingest payloads without briefing field', () => {
    const cleaned = sanitizeTradeSheetInput({
      sheetDate: '2026-11-25',
      title: 'Legacy Ingest Sheet',
      ticketsJson: [
        {
          id: 't1',
          wave: 'WAVE1',
          custodian: 'Fidelity',
          account: 'Taxable',
          action: 'SELL',
          symbol: 'NVDA',
          qty: '20 sh',
          limitPrice: '$148.00',
          estValue: '$2,960',
          note: 'Trim strength',
        },
      ],
      strategyJson: {
        headline: 'Balanced Expansion',
        summaryBullets: ['Keep cash floor intact.'],
        holdOffNotes: ['Wait for PCE print.'],
        facts: [],
        expectedResults: [],
      },
    })

    expect(cleaned.sourceMode).toBe('curated')
    expect(cleaned.hasStructuredBriefing).toBe(false)
    expect(cleaned.compiledBlocks).toHaveLength(1)
    expect(cleaned.compiledBlocks[0].blockType).toBe('executiveMandate')
    expect(extractSheetTickers(cleaned.ticketsJson, cleaned.compiledBlocks)).toEqual(['NVDA'])
  })
})

describe('POST /api/trade-sheets/ingest route handler', () => {
  const ORIGINAL_SECRET = process.env.TRADE_INGEST_SECRET

  beforeEach(() => {
    process.env.TRADE_INGEST_SECRET = 'test-ingest-secret-minimum-16-chars'
    mockPayload.find.mockReset()
    mockPayload.update.mockReset()
    mockPayload.create.mockReset()
  })

  afterEach(() => {
    if (ORIGINAL_SECRET === undefined) {
      delete process.env.TRADE_INGEST_SECRET
    } else {
      process.env.TRADE_INGEST_SECRET = ORIGINAL_SECRET
    }
  })

  it('unions auto-linked published trade-notes, preserves human deskAnnotation blocks, and retains valid checkedRowIds on update', async () => {
    // 1st find: existing sheet
    mockPayload.find
      .mockResolvedValueOnce({
        docs: [
          {
            id: 'sheet-uuid-1',
            sheetDate: '2026-11-25',
            checkedRowIds: ['w1-nvda', 'stale-row-removed'],
            relatedTradeNotes: ['note-manual-1'],
            briefingBlocks: [
              {
                id: 'human-ann-1',
                blockType: 'deskAnnotation',
                author: 'Tanner Chung',
                pinToTop: true,
                scope: 'risk_override',
                heading: 'Human cap on NVDA',
                body: 'Keep 15% cap.',
              },
              {
                id: 'old-mandate',
                blockType: 'executiveMandate',
                posture: 'balanced',
                mandateHeadline: 'Old headline',
              },
            ],
            citations: [],
            quotesRefreshedAt: null,
          },
        ],
      })
      // 2nd find: published trade-notes matching NVDA
      .mockResolvedValueOnce({
        docs: [{ id: 'note-nvda-published' }],
      })

    mockPayload.update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: 'sheet-uuid-1',
      sheetDate: '2026-11-25',
      ...data,
    }))

    const req = new Request('https://trade.tannerchung.com/api/trade-sheets/ingest', {
      method: 'POST',
      headers: {
        authorization: 'Bearer test-ingest-secret-minimum-16-chars',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sheetDate: '2026-11-25',
        title: 'Updated Daily Sheet',
        sourceMode: 'auto_vm',
        ticketsJson: [
          {
            id: 'w1-nvda',
            wave: 'WAVE1',
            custodian: 'Fidelity',
            account: 'Taxable',
            action: 'SELL',
            symbol: 'NVDA',
            qty: '20 sh',
            limitPrice: '$148.50',
            estValue: '$2,970',
            note: 'Trim',
          },
        ],
        briefing: {
          executiveMandate: {
            posture: 'defensive',
            mandateHeadline: 'Protect $95k floor',
          },
          citations: [
            {
              index: 1,
              ticker: 'NVDA',
              source: 'SEC EDGAR',
              kind: 'sec_filing',
              label: 'NVDA 10-Q',
              url: 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001045810',
            },
          ],
        },
      }),
    })

    const res = await ingestPost(req)
    expect(res.status).toBe(200)
    const json = (await res.json()) as Record<string, unknown>
    expect(json.ok).toBe(true)
    expect(json.action).toBe('updated')
    expect(json.linkedTradeNoteCount).toBe(2)

    expect(mockPayload.update).toHaveBeenCalledTimes(1)
    const updateData = mockPayload.update.mock.calls[0][0].data as Record<string, unknown>
    expect(updateData.checkedRowIds).toEqual(['w1-nvda'])
    expect(updateData.relatedTradeNotes).toEqual(
      expect.arrayContaining(['note-manual-1', 'note-nvda-published']),
    )
    const blocks = updateData.briefingBlocks as Array<{ blockType: string; id?: string }>
    expect(blocks.map((b) => b.blockType)).toEqual(['deskAnnotation', 'executiveMandate'])
    expect(blocks[0].id).toBe('human-ann-1')
  })
})
