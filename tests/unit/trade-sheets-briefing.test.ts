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

  it('sanitizes, scrubs, bounds raw briefingBlocks and strips deskAnnotation on ingest', () => {
    const cleaned = sanitizeTradeSheetInput({
      sheetDate: '2026-11-25',
      title: 'Raw Blocks Ingest',
      ticketsJson: [],
      briefingBlocks: [
        {
          blockType: 'deskAnnotation',
          author: 'Spoofed Bot',
          heading: 'Injected Override',
          body: 'Should be stripped on ingest',
        },
        {
          blockType: 'executiveMandate',
          posture: 'invalid_enum_value',
          mandateHeadline: '🚀 Trim acct 1234567890 via https://digital.fidelity.com/acct',
          summaryPoints: Array.from({ length: 30 }, (_, i) => ({
            text: `Point ${i + 1} for acct 987654321`,
          })),
          holdOffNotes: [{ note: '🔥 Wait for FOMC' }],
        },
        {
          blockType: 'moveRationales',
          items: [
            {
              ticker: 'nvda',
              action: 'sell',
              conviction: 'not_valid',
              rationale: 'Trim acct 4455667788 https://mail.google.com/mail/u/0/',
            },
          ],
        },
      ],
    })

    // deskAnnotation must be stripped on ingest
    expect(cleaned.compiledBlocks.map((b) => b.blockType)).toEqual([
      'executiveMandate',
      'moveRationales',
    ])

    const mandate = cleaned.compiledBlocks[0]
    expect(mandate.blockType).toBe('executiveMandate')
    if (mandate.blockType === 'executiveMandate') {
      expect(mandate.posture).toBe('balanced')
      expect(mandate.mandateHeadline).not.toContain('🚀')
      expect(mandate.mandateHeadline).not.toContain('1234567890')
      expect(mandate.mandateHeadline).not.toContain('fidelity.com')
      expect(mandate.mandateHeadline).toContain('[REDACTED-ACCT]')
      // Bounded to MAX_MANDATE_LIST_ITEMS (20)
      expect(mandate.summaryPoints).toHaveLength(20)
      expect(mandate.summaryPoints?.[0]?.text).not.toContain('987654321')
    }

    // Also verifies executiveMandate mirrors into legacy strategyJson when omitted
    expect(cleaned.strategyJson.headline).toContain('Trim acct [REDACTED-ACCT]')
    expect(cleaned.strategyJson.summaryBullets).toHaveLength(20)
    expect(cleaned.strategyJson.holdOffNotes).toEqual(['Wait for FOMC'])
  })

  it('mirrors briefing.executiveMandate into strategyJson when strategyJson is omitted', () => {
    const cleaned = sanitizeTradeSheetInput({
      sheetDate: '2026-11-25',
      title: 'Structured Only Sheet',
      ticketsJson: [],
      briefing: {
        executiveMandate: {
          posture: 'defensive',
          mandateHeadline: 'Defend $95k Treasury cash floor',
          summaryPoints: ['Trim high-beta semis', 'Hold T-bill ladder'],
          holdOffNotes: ['No new SMH until wash-sale window clears'],
        },
      },
    })

    expect(cleaned.strategyJson.headline).toBe('Defend $95k Treasury cash floor')
    expect(cleaned.strategyJson.summaryBullets).toEqual([
      'Trim high-beta semis',
      'Hold T-bill ladder',
    ])
    expect(cleaned.strategyJson.holdOffNotes).toEqual([
      'No new SMH until wash-sale window clears',
    ])
  })

  it('validates relatedTradeNotes IDs and rejects malformed non-UUID/non-numeric strings', () => {
    expect(() =>
      sanitizeTradeSheetInput({
        sheetDate: '2026-11-25',
        title: 'Bad Related Notes',
        ticketsJson: [],
        relatedTradeNotes: ['not-a-valid-uuid!'],
      }),
    ).toThrow(/Invalid relatedTradeNotes ID/i)

    const valid = sanitizeTradeSheetInput({
      sheetDate: '2026-11-25',
      title: 'Valid Related Notes',
      ticketsJson: [],
      relatedTradeNotes: ['550e8400-e29b-41d4-a716-446655440000', '42'],
    })
    expect(valid.relatedTradeNotes).toEqual(['550e8400-e29b-41d4-a716-446655440000', '42'])
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

  it('returns 400 when relatedTradeNotes contains a malformed ID', async () => {
    const req = new Request('https://trade.tannerchung.com/api/trade-sheets/ingest', {
      method: 'POST',
      headers: {
        authorization: 'Bearer test-ingest-secret-minimum-16-chars',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sheetDate: '2026-11-25',
        title: 'Bad Note ID',
        ticketsJson: [],
        relatedTradeNotes: ['invalid-pg-uuid-value'],
      }),
    })

    const res = await ingestPost(req)
    expect(res.status).toBe(400)
    expect(mockPayload.find).not.toHaveBeenCalled()
  })

  it('compiles stockbot portal_briefing_builder producer schema into all 5 native Payload blocks', () => {
    const cleaned = sanitizeTradeSheetInput({
      sheetDate: '2026-11-25',
      title: 'Stockbot Enriched Sheet',
      ticketsJson: [],
      briefing: {
        executiveMandate: {
          headline: 'SELECTIVE_ACCUMULATION — 2026-11-25',
          whatWeAreDoing: 'Executing 17 blotter legs under SELECTIVE_ACCUMULATION.',
          whyNow: 'Secular compute and power buildout remains intact.',
          wave1Summary: 'Wave 1 stages 13 equity sell legs.',
          wave2Summary: 'Wave 2 deploys 4 buy legs once Wave 1 settles.',
          keyGuardrails: ['Keep Klarman cash floor above 9.0%.'],
          citationIndices: [1, 2],
        },
        moveRationales: [
          {
            symbol: 'PLTR',
            wave: 'WAVE1',
            action: 'SELL',
            conviction: 'LOW',
            valuationZone: 'ZONE_3_HARVEST_ABOVE_BULL',
            why: 'Asymmetric skew above 40x sales.',
            invalidationTrigger: 'Portfolio beta headroom is capped.',
            citationIndices: [2],
          },
        ],
        panelDebates: [
          {
            symbol: 'PGR',
            wave: 'WAVE2',
            consensus: 'HOUSE_VIEW_ALIGNED',
            cioResolution: 'Stage WAVE2 BUY in tax-advantaged wrapper.',
            strongestObjection: 'Requires Wave 1 proceeds first.',
            seats: [
              {
                role: 'Presenting Analyst',
                stance: 'BUY CASE',
                quote: 'Telematics underwriting moat.',
              },
            ],
            citationIndices: [2],
          },
        ],
        redTeamChallenger: {
          klarmanPosture: 'CRITICAL_UNDER_BUFFER: Investable cash below 9.0% floor.',
          mungerVerdict: 'DIWORSIFICATION_TAIL_DRAG',
          executiveTakeaway: 'Reconciled Q4 Safe Harbor and forward ROIIC.',
          blindSpots: ['SGOV Cash Lockup Friction: turn off auto-reinvest.'],
          counterHypotheses: ['Track monthly TSMC revenue inflections.'],
          citationIndices: [2],
        },
        newsCatalysts: [
          {
            title: 'ENSG SEC Form 8-K: Results of Operations',
            source: 'SEC EDGAR',
            category: 'sec_filing',
            publishedAt: '2026-10-27',
            tickers: ['ENSG'],
            summary: 'Form 8-K covering quarterly results.',
            whyItMatters: 'Primary regulatory disclosure for ENSG.',
            citationIndices: [2],
            url: 'https://www.sec.gov/edgar/browse/?CIK=0001125376',
          },
        ],
        citations: [
          {
            index: 1,
            sourceType: 'house_views',
            label: 'Internal House Views (no public URL)',
            publisher: 'Stockbot House Views',
          },
          {
            index: 2,
            sourceType: 'sec_edgar',
            label: 'ENSG SEC EDGAR Filings',
            publisher: 'SEC EDGAR',
            tickers: ['ENSG'],
            url: 'https://www.sec.gov/edgar/browse/?CIK=0001125376',
          },
        ],
      },
    })

    expect(cleaned.compiledCitations).toHaveLength(1)
    expect(cleaned.compiledCitations[0].index).toBe(1)
    expect(cleaned.compiledBlocks.map((b) => b.blockType)).toEqual([
      'executiveMandate',
      'moveRationales',
      'panelDebates',
      'redTeamChallenger',
      'newsCatalysts',
    ])
  })
})
