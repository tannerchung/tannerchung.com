import crypto from 'node:crypto'
import { sanitizeCitationUrl } from '@/blocks/trade-desk'
import type { IcSeatConfig } from '@/globals/TradeDeskSettings'

// ---------------------------------------------------------------------------
// Core Production Types (backward-compatible with existing DB rows & APIs)
// ---------------------------------------------------------------------------

export type TradeSheetKpi = {
  label: string
  value: string
  sub?: string
}

export type StrategyFactRow = {
  pillar: string
  metric: string
  detail: string
}

export type ExpectedResultRow = {
  metric: string
  before: string
  after: string
  impact: string
}

export type TradeSheetStrategy = {
  headline: string
  summaryBullets: string[]
  holdOffNotes?: string[]
  facts: StrategyFactRow[]
  expectedResults: ExpectedResultRow[]
}

export type TradeTicketRow = {
  id: string
  wave: 'WAVE1' | 'WAVE2' | string
  custodian: string
  account: string
  action: 'SELL' | 'BUY' | 'STO CALL' | 'STO PUT' | 'ROLL' | 'WATCH' | string
  symbol: string
  qty: string
  limitPrice: string
  estValue: string
  note: string
  liveQuote?: number | null
  quoteUpdatedAt?: string | null
}

// ---------------------------------------------------------------------------
// Payload Native Briefing Blocks & Citations Types
// ---------------------------------------------------------------------------

export interface TradeCitationItem {
  id?: string | null
  index: number
  ticker?: string | null
  source: string
  kind?: 'sec_filing' | 'news' | 'macro' | 'research' | null
  label: string
  url: string
  publishedAt?: string | null
}

export interface ExecutiveMandateBlockData {
  id?: string | null
  blockName?: string | null
  blockType: 'executiveMandate'
  posture: 'risk_on' | 'balanced' | 'defensive' | 'stand_aside'
  mandateHeadline: string
  cashFloorGate?: string | null
  regimeCall?: string | null
  summaryPoints?: Array<{ id?: string | null; text: string }> | null
  holdOffNotes?: Array<{ id?: string | null; note: string }> | null
  citationRefs?: string | null
}

export interface MoveRationalesBlockData {
  id?: string | null
  blockName?: string | null
  blockType: 'moveRationales'
  sectionTitle?: string | null
  items?: Array<{
    id?: string | null
    ticker: string
    action: string
    conviction?: 'high' | 'medium' | 'low' | 'trim' | 'hold' | null
    horizon?: string | null
    rationale: string
    keyRisks?: string | null
    citationRefs?: string | null
  }> | null
}

export interface PanelDebatesBlockData {
  id?: string | null
  blockName?: string | null
  blockType: 'panelDebates'
  topic: string
  consensusSummary?: string | null
  dissentHeadline?: string | null
  strongestUnresolvedObjection?: string | null
  seats?: Array<{
    id?: string | null
    seatKey: string
    seatName: string
    stance: 'approve' | 'caution' | 'dissent' | 'abstain'
    thesis: string
    objection?: string | null
    citationRefs?: string | null
  }> | null
}

export interface RedTeamChallengerBlockData {
  id?: string | null
  blockName?: string | null
  blockType: 'redTeamChallenger'
  challengerTitle?: string | null
  overallSeverity?: 'low' | 'elevated' | 'critical' | null
  preMortemSummary: string
  blindSpots?: Array<{
    id?: string | null
    category?:
      | 'macro'
      | 'concentration'
      | 'liquidity'
      | 'tax_wash_sale'
      | 'options_pin'
      | 'valuation'
      | null
    severity?: 'low' | 'medium' | 'high' | null
    claim: string
    mitigation?: string | null
    citationRefs?: string | null
  }> | null
}

export interface NewsCatalystsBlockData {
  id?: string | null
  blockName?: string | null
  blockType: 'newsCatalysts'
  windowLabel?: string | null
  items?: Array<{
    id?: string | null
    ticker?: string | null
    headline: string
    catalystKind?: 'sec_filing' | 'earnings' | 'macro' | 'analyst' | 'geopolitical' | null
    impactSummary?: string | null
    publishedAt?: string | null
    citationIndex?: number | null
  }> | null
}

export interface DeskAnnotationBlockData {
  id?: string | null
  blockName?: string | null
  blockType: 'deskAnnotation'
  author?: string | null
  pinToTop?: boolean | null
  scope?: 'session' | 'ticker' | 'risk_override' | 'post_mortem' | null
  ticker?: string | null
  heading: string
  body: string
  createdAtNote?: string | null
}

export type TradeBriefingBlock =
  | ExecutiveMandateBlockData
  | MoveRationalesBlockData
  | PanelDebatesBlockData
  | RedTeamChallengerBlockData
  | NewsCatalystsBlockData
  | DeskAnnotationBlockData

export interface DeskSettingsSummary {
  deskLabel?: string | null
  cashFloorTarget?: string | null
  maxOptionSpreadPct?: number | null
  taxShieldReadout?: string | null
  washSaleBlackoutThrough?: string | null
  washSaleTickers?: string | null
  standingGuardrails?: Array<{ code: string; rule: string }>
  ipsTargets?: {
    targetBetaMax?: number | null
    minCashFloorUsd?: number | null
    coreAllocationTargetPct?: number | null
    satelliteMaxSingleWeightPct?: number | null
  } | null
  icSeats?: IcSeatConfig[]
}

export interface LinkedTradeNote {
  id: string
  title: string
  ticker?: string | null
  conviction?: 'high' | 'medium' | 'watch' | 'avoid' | null
  valuationZone?: 'buy_zone' | 'hold_zone' | 'trim_zone' | null
  strategy?: string | null
  thesis?: unknown
  metricsJson?: Record<string, unknown> | null
  sheetUrl?: string | null
  updatedAt?: string | null
}

export interface TradeSheetRecord {
  id: string
  sheetDate: string
  title: string
  subtitle?: string | null
  alertBanner?: string | null
  sourceMode: 'curated' | 'auto_vm' | 'manual'
  executionProgress?: string | null
  quotesRefreshedAt?: string | null
  kpis: TradeSheetKpi[]
  tickets: TradeTicketRow[]
  strategy: TradeSheetStrategy | null
  briefingBlocks: TradeBriefingBlock[]
  citations: TradeCitationItem[]
  relatedTradeNotes: LinkedTradeNote[]
  checkedRowIds: string[]
  updatedAt?: string | null
}

export interface TradeSheetBriefingInput {
  executiveMandate?: {
    posture?: string
    mandateHeadline?: string
    headline?: string
    cashFloorGate?: string | null
    regimeCall?: string | null
    summaryPoints?: Array<string | { text: string }>
    holdOffNotes?: Array<string | { note: string }>
    citationRefs?: string | number[] | null
  } | null
  moveRationales?:
    | {
        sectionTitle?: string | null
        items?: Array<{
          ticker: string
          action: string
          conviction?: string | null
          horizon?: string | null
          rationale?: string
          thesis?: string
          keyRisks?: string | null
          citationRefs?: string | number[] | null
        }>
      }
    | Array<{
        ticker: string
        action: string
        conviction?: string | null
        horizon?: string | null
        rationale?: string
        thesis?: string
        keyRisks?: string | null
        citationRefs?: string | number[] | null
      }>
    | null
  panelDebates?:
    | {
        topic?: string
        consensusSummary?: string | null
        dissentHeadline?: string | null
        strongestUnresolvedObjection?: string | null
        seats?: Array<{
          seatKey?: string
          seatName?: string
          seat?: string
          stance?: string
          thesis?: string
          summary?: string
          objection?: string | null
          citationRefs?: string | number[] | null
        }>
      }
    | Array<{
        topic?: string
        consensusSummary?: string | null
        dissentHeadline?: string | null
        strongestUnresolvedObjection?: string | null
        seats?: Array<{
          seatKey?: string
          seatName?: string
          seat?: string
          stance?: string
          thesis?: string
          summary?: string
          objection?: string | null
          citationRefs?: string | number[] | null
        }>
      }>
    | null
  redTeamChallenger?: {
    challengerTitle?: string | null
    overallSeverity?: string | null
    preMortemSummary?: string
    blindSpots?: Array<{
      category?: string | null
      severity?: string | null
      claim: string
      mitigation?: string | null
      citationRefs?: string | number[] | null
    }>
  } | null
  newsCatalysts?:
    | {
        windowLabel?: string | null
        items?: Array<{
          ticker?: string | null
          headline: string
          catalystKind?: string | null
          impactSummary?: string | null
          publishedAt?: string | null
          citationIndex?: number | null
        }>
      }
    | Array<{
        ticker?: string | null
        headline: string
        catalystKind?: string | null
        impactSummary?: string | null
        publishedAt?: string | null
        citationIndex?: number | null
      }>
    | null
  citations?: Array<{
    index?: number
    ticker?: string | null
    source: string
    kind?: string | null
    label: string
    url: string
    publishedAt?: string | null
  }> | null
}

export interface SanitizedTradeSheetInput {
  sheetDate: string
  title: string
  subtitle: string
  alertBanner: string
  sourceMode: 'curated' | 'auto_vm' | 'manual'
  kpisJson: TradeSheetKpi[]
  strategyJson: TradeSheetStrategy
  ticketsJson: TradeTicketRow[]
  compiledBlocks: TradeBriefingBlock[]
  compiledCitations: TradeCitationItem[]
  hasStructuredBriefing: boolean
  relatedTradeNotes?: string[]
  resetChecks?: boolean
}

// ---------------------------------------------------------------------------
// Text Scrubbing, Emoji Stripping & Auth Verification
// ---------------------------------------------------------------------------

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const RAW_ACCT_NUM_RE = /\b\d{8,}\b/g

export function scrubSensitiveText(input: unknown): string {
  if (typeof input !== 'string') return ''
  return input.replace(RAW_ACCT_NUM_RE, '[REDACTED-ACCT]').trim()
}

export function stripEmojis(value: string): string {
  if (!value) return ''
  return value
    .replace(/\p{Extended_Pictographic}/gu, '')
    .replace(/[\u{1F1E6}-\u{1F1FF}]/gu, '')
    .replace(/[\uFE0E\uFE0F\u200D\u20E3]/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

export function scrubBriefingProse(value: string): string {
  if (!value) return ''
  let text = scrubSensitiveText(value)
  text = stripEmojis(text)
  // Convert markdown links [label](https://...) -> label
  text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/gi, '$1')
  // Strip raw URLs from inline prose
  text = text.replace(/https?:\/\/[^\s)>,]+/gi, '')
  // Strip markdown headings & emphasis tokens
  text = text.replace(/^\s{0,3}#{1,6}\s+/gm, '')
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1')
  text = text.replace(/__([^_]+)__/g, '$1')
  text = text.replace(/`([^`]+)`/g, '$1')
  text = text.replace(/\(\s*\)/g, '')
  text = text
    .split(/\r?\n/)
    .map((line) => line.replace(/[ \t]{2,}/g, ' ').trim())
    .filter((line, idx, arr) => line.length > 0 || (idx > 0 && idx < arr.length - 1))
    .join('\n')
    .trim()
  return text
}

export function verifyIngestBearerToken(
  authHeader: string | null | undefined,
  expectedSecret: string | undefined,
): boolean {
  if (!authHeader || !expectedSecret || expectedSecret.length < 16) return false
  const prefix = 'Bearer '
  if (!authHeader.startsWith(prefix)) return false
  const provided = authHeader.slice(prefix.length).trim()
  if (!provided) return false

  const hProvided = crypto.createHash('sha256').update(provided, 'utf8').digest()
  const hExpected = crypto.createHash('sha256').update(expectedSecret.trim(), 'utf8').digest()
  return crypto.timingSafeEqual(hProvided, hExpected)
}

// ---------------------------------------------------------------------------
// Briefing Compiler & Citation Sanitizer
// ---------------------------------------------------------------------------

function normalizeCitationRefs(
  refs: string | number[] | null | undefined,
  indexRemap?: Map<number, number>,
): string | undefined {
  if (refs === null || refs === undefined) return undefined
  const rawTokens = Array.isArray(refs)
    ? refs.map((n) => String(n))
    : String(refs)
        .split(/[,\s;]+/)
        .filter(Boolean)

  const seen = new Set<number>()
  const resolved: number[] = []
  for (const tok of rawTokens) {
    const cleaned = tok.replace(/[^0-9]/g, '')
    if (!cleaned) continue
    const num = Number(cleaned)
    if (!Number.isInteger(num) || num <= 0) continue
    const mapped = indexRemap ? indexRemap.get(num) : num
    if (mapped && !seen.has(mapped)) {
      seen.add(mapped)
      resolved.push(mapped)
    }
  }
  return resolved.length > 0 ? resolved.join(', ') : undefined
}

function normalizePosture(
  raw?: string | null,
): 'risk_on' | 'balanced' | 'defensive' | 'stand_aside' {
  const val = String(raw || '').trim().toLowerCase()
  if (val === 'risk_on' || val === 'risk-on' || val === 'offensive') return 'risk_on'
  if (val === 'defensive' || val === 'cautious') return 'defensive'
  if (val === 'stand_aside' || val === 'stand-aside' || val === 'hold_cash') return 'stand_aside'
  return 'balanced'
}

function normalizeConviction(
  raw?: string | null,
): 'high' | 'medium' | 'low' | 'trim' | 'hold' {
  const val = String(raw || '').trim().toLowerCase()
  if (val === 'high' || val === 'medium' || val === 'low' || val === 'trim' || val === 'hold') {
    return val
  }
  return 'medium'
}

function normalizeStance(
  raw?: string | null,
): 'approve' | 'caution' | 'dissent' | 'abstain' {
  const val = String(raw || '').trim().toLowerCase()
  if (val === 'approve' || val === 'bullish' || val === 'support' || val === 'for') return 'approve'
  if (val === 'dissent' || val === 'oppose' || val === 'bearish' || val === 'against') return 'dissent'
  if (val === 'abstain' || val === 'neutral' || val === 'pass') return 'abstain'
  return 'caution'
}

function normalizeOverallSeverity(raw?: string | null): 'low' | 'elevated' | 'critical' {
  const val = String(raw || '').trim().toLowerCase()
  if (val === 'low' || val === 'elevated' || val === 'critical') return val
  if (val === 'high') return 'critical'
  return 'elevated'
}

function normalizeBlindSpotCategory(
  raw?: string | null,
): 'macro' | 'concentration' | 'liquidity' | 'tax_wash_sale' | 'options_pin' | 'valuation' {
  const val = String(raw || '').trim().toLowerCase()
  if (
    val === 'macro' ||
    val === 'concentration' ||
    val === 'liquidity' ||
    val === 'tax_wash_sale' ||
    val === 'options_pin' ||
    val === 'valuation'
  ) {
    return val
  }
  if (val.includes('tax') || val.includes('wash')) return 'tax_wash_sale'
  if (val.includes('option') || val.includes('pin')) return 'options_pin'
  if (val.includes('liquid')) return 'liquidity'
  if (val.includes('val')) return 'valuation'
  if (val.includes('macro')) return 'macro'
  return 'concentration'
}

function normalizeBlindSpotSeverity(raw?: string | null): 'low' | 'medium' | 'high' {
  const val = String(raw || '').trim().toLowerCase()
  if (val === 'low' || val === 'medium' || val === 'high') return val
  if (val === 'critical') return 'high'
  return 'medium'
}

function normalizeCatalystKind(
  raw?: string | null,
): 'sec_filing' | 'earnings' | 'macro' | 'analyst' | 'geopolitical' {
  const val = String(raw || '').trim().toLowerCase()
  if (
    val === 'sec_filing' ||
    val === 'earnings' ||
    val === 'macro' ||
    val === 'analyst' ||
    val === 'geopolitical'
  ) {
    return val
  }
  if (val.includes('sec') || val.includes('filing') || val.includes('10-k') || val.includes('8-k')) {
    return 'sec_filing'
  }
  if (val.includes('earn')) return 'earnings'
  if (val.includes('geo')) return 'geopolitical'
  if (val.includes('analyst')) return 'analyst'
  return 'macro'
}

function normalizeCitationKind(
  raw?: string | null,
): 'sec_filing' | 'news' | 'macro' | 'research' {
  const val = String(raw || '').trim().toLowerCase()
  if (val === 'sec_filing' || val === 'news' || val === 'macro' || val === 'research') {
    return val
  }
  if (val.includes('sec') || val.includes('edgar') || val.includes('filing')) return 'sec_filing'
  if (val.includes('macro') || val.includes('fed') || val.includes('bls')) return 'macro'
  if (val.includes('research') || val.includes('report')) return 'research'
  return 'news'
}

function slugifySeatKey(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'seat'
  )
}

export function sanitizeCitationsList(
  rawCitations?: Array<{
    index?: number
    ticker?: string | null
    source: string
    kind?: string | null
    label: string
    url: string
    publishedAt?: string | null
  }> | null,
): { citations: TradeCitationItem[]; indexRemap: Map<number, number> } {
  const indexRemap = new Map<number, number>()
  if (!Array.isArray(rawCitations) || rawCitations.length === 0) {
    return { citations: [], indexRemap }
  }

  const citations: TradeCitationItem[] = []
  const seenUrlToNewIndex = new Map<string, number>()

  for (let i = 0; i < rawCitations.length && citations.length < 60; i++) {
    const raw = rawCitations[i]
    if (!raw || typeof raw !== 'object') continue
    const cleanedUrl = sanitizeCitationUrl(raw.url)
    if (!cleanedUrl) continue

    const origIdx =
      typeof raw.index === 'number' && Number.isInteger(raw.index) && raw.index > 0
        ? raw.index
        : i + 1

    const existingIdx = seenUrlToNewIndex.get(cleanedUrl)
    if (existingIdx !== undefined) {
      indexRemap.set(origIdx, existingIdx)
      continue
    }

    const newIdx = citations.length + 1
    seenUrlToNewIndex.set(cleanedUrl, newIdx)
    indexRemap.set(origIdx, newIdx)

    citations.push({
      index: newIdx,
      ticker: raw.ticker ? String(raw.ticker).trim().toUpperCase() : null,
      source: scrubBriefingProse(String(raw.source || 'Wire')) || 'Wire',
      kind: normalizeCitationKind(raw.kind),
      label: scrubBriefingProse(String(raw.label || raw.source || 'Source')) || 'Source',
      url: cleanedUrl,
      publishedAt: raw.publishedAt ? String(raw.publishedAt).trim() : null,
    })
  }

  return { citations, indexRemap }
}

export function compileBriefingToPayloadBlocks(
  input?: TradeSheetBriefingInput | null,
  strategyFallback?: TradeSheetStrategy | null,
): { briefingBlocks: TradeBriefingBlock[]; citations: TradeCitationItem[] } {
  const { citations, indexRemap } = sanitizeCitationsList(input?.citations)
  const hasRemap = citations.length > 0 ? indexRemap : undefined
  const briefingBlocks: TradeBriefingBlock[] = []

  // 1. Executive Mandate
  const mandate = input?.executiveMandate
  if (mandate && (mandate.mandateHeadline || mandate.headline || mandate.summaryPoints?.length)) {
    const summaryPoints = Array.isArray(mandate.summaryPoints)
      ? mandate.summaryPoints
          .map((p) => scrubBriefingProse(typeof p === 'string' ? p : p?.text || ''))
          .filter(Boolean)
          .map((text) => ({ text }))
      : []
    const holdOffNotes = Array.isArray(mandate.holdOffNotes)
      ? mandate.holdOffNotes
          .map((n) => scrubBriefingProse(typeof n === 'string' ? n : n?.note || ''))
          .filter(Boolean)
          .map((note) => ({ note }))
      : []
    const headline =
      scrubBriefingProse(mandate.mandateHeadline || mandate.headline || '') ||
      'Session Execution Mandate'
    briefingBlocks.push({
      blockType: 'executiveMandate',
      posture: normalizePosture(mandate.posture),
      mandateHeadline: headline,
      cashFloorGate: mandate.cashFloorGate ? scrubBriefingProse(mandate.cashFloorGate) : null,
      regimeCall: mandate.regimeCall ? scrubBriefingProse(mandate.regimeCall) : null,
      summaryPoints,
      holdOffNotes,
      citationRefs: normalizeCitationRefs(mandate.citationRefs, hasRemap) ?? null,
    })
  } else if (
    !input?.executiveMandate &&
    strategyFallback &&
    (strategyFallback.headline ||
      strategyFallback.summaryBullets?.length ||
      strategyFallback.holdOffNotes?.length)
  ) {
    briefingBlocks.push({
      blockType: 'executiveMandate',
      posture: 'balanced',
      mandateHeadline:
        scrubBriefingProse(strategyFallback.headline || 'Session Execution Mandate') ||
        'Session Execution Mandate',
      regimeCall: null,
      summaryPoints: (strategyFallback.summaryBullets || [])
        .map((s) => scrubBriefingProse(s))
        .filter(Boolean)
        .map((text) => ({ text })),
      holdOffNotes: (strategyFallback.holdOffNotes || [])
        .map((n) => scrubBriefingProse(n))
        .filter(Boolean)
        .map((note) => ({ note })),
      citationRefs: null,
    })
  }

  // 2. Move Rationales
  const moveInput = input?.moveRationales
  const rawMoveItems = Array.isArray(moveInput)
    ? moveInput
    : moveInput && Array.isArray(moveInput.items)
      ? moveInput.items
      : null
  const moveSectionTitle =
    !Array.isArray(moveInput) && moveInput?.sectionTitle
      ? scrubBriefingProse(moveInput.sectionTitle)
      : 'Ticket-by-Ticket Action Rationale'

  if (rawMoveItems && rawMoveItems.length > 0) {
    const items = rawMoveItems
      .filter((item) => item && item.ticker && (item.rationale || item.thesis))
      .map((item) => ({
        ticker: String(item.ticker).trim().toUpperCase(),
        action: scrubBriefingProse(String(item.action || 'WATCH')).toUpperCase(),
        conviction: normalizeConviction(item.conviction),
        horizon: item.horizon ? scrubBriefingProse(item.horizon) : null,
        rationale: scrubBriefingProse(item.rationale || item.thesis || ''),
        keyRisks: item.keyRisks ? scrubBriefingProse(item.keyRisks) : null,
        citationRefs: normalizeCitationRefs(item.citationRefs, hasRemap) ?? null,
      }))
      .filter((item) => item.rationale.length > 0)

    if (items.length > 0) {
      briefingBlocks.push({
        blockType: 'moveRationales',
        sectionTitle: moveSectionTitle || 'Ticket-by-Ticket Action Rationale',
        items,
      })
    }
  }

  // 3. Panel Debates
  const rawDebates = input?.panelDebates
    ? Array.isArray(input.panelDebates)
      ? input.panelDebates
      : [input.panelDebates]
    : []

  for (const debate of rawDebates) {
    if (!debate) continue
    const seats = Array.isArray(debate.seats)
      ? debate.seats
          .filter((s) => s && (s.seatName || s.seat) && (s.thesis || s.summary))
          .slice(0, 12)
          .map((s) => {
            const name = scrubBriefingProse(s.seatName || s.seat || 'IC Seat')
            return {
              seatKey: s.seatKey ? slugifySeatKey(s.seatKey) : slugifySeatKey(name),
              seatName: name,
              stance: normalizeStance(s.stance),
              thesis: scrubBriefingProse(s.thesis || s.summary || ''),
              objection: s.objection ? scrubBriefingProse(s.objection) : null,
              citationRefs: normalizeCitationRefs(s.citationRefs, hasRemap) ?? null,
            }
          })
          .filter((s) => s.thesis.length > 0)
      : []

    const topic = scrubBriefingProse(debate.topic || 'Investment Committee Debate')
    if (topic && (seats.length > 0 || debate.consensusSummary || debate.dissentHeadline)) {
      briefingBlocks.push({
        blockType: 'panelDebates',
        topic,
        consensusSummary: debate.consensusSummary
          ? scrubBriefingProse(debate.consensusSummary)
          : null,
        dissentHeadline: debate.dissentHeadline
          ? scrubBriefingProse(debate.dissentHeadline)
          : null,
        strongestUnresolvedObjection: debate.strongestUnresolvedObjection
          ? scrubBriefingProse(debate.strongestUnresolvedObjection)
          : null,
        seats,
      })
    }
  }

  // 4. Red-Team Challenger
  const redTeam = input?.redTeamChallenger
  if (redTeam && (redTeam.preMortemSummary || redTeam.blindSpots?.length)) {
    const blindSpots = Array.isArray(redTeam.blindSpots)
      ? redTeam.blindSpots
          .filter((b) => b && b.claim)
          .map((b) => ({
            category: normalizeBlindSpotCategory(b.category),
            severity: normalizeBlindSpotSeverity(b.severity),
            claim: scrubBriefingProse(b.claim),
            mitigation: b.mitigation ? scrubBriefingProse(b.mitigation) : null,
            citationRefs: normalizeCitationRefs(b.citationRefs, hasRemap) ?? null,
          }))
          .filter((b) => b.claim.length > 0)
      : []

    briefingBlocks.push({
      blockType: 'redTeamChallenger',
      challengerTitle:
        scrubBriefingProse(
          redTeam.challengerTitle || 'Autonomous Red-Team & Second-Level Blind Spots',
        ) || 'Autonomous Red-Team & Second-Level Blind Spots',
      overallSeverity: normalizeOverallSeverity(redTeam.overallSeverity),
      preMortemSummary:
        scrubBriefingProse(redTeam.preMortemSummary || '') ||
        'Adversarial pre-mortem stress test across portfolio concentration and liquidity.',
      blindSpots,
    })
  }

  // 5. News & Catalysts
  const newsInput = input?.newsCatalysts
  const rawNewsItems = Array.isArray(newsInput)
    ? newsInput
    : newsInput && Array.isArray(newsInput.items)
      ? newsInput.items
      : null
  const windowLabel =
    !Array.isArray(newsInput) && newsInput?.windowLabel
      ? scrubBriefingProse(newsInput.windowLabel)
      : 'Last 72h Corroborated Wire & SEC Filings'

  if (rawNewsItems && rawNewsItems.length > 0) {
    const items = rawNewsItems
      .filter((item) => item && item.headline)
      .map((item) => {
        const mappedIndex =
          typeof item.citationIndex === 'number' && Number.isInteger(item.citationIndex)
            ? hasRemap
              ? (hasRemap.get(item.citationIndex) ?? null)
              : item.citationIndex
            : null
        return {
          ticker: item.ticker ? String(item.ticker).trim().toUpperCase() : null,
          headline: scrubBriefingProse(item.headline),
          catalystKind: normalizeCatalystKind(item.catalystKind),
          impactSummary: item.impactSummary ? scrubBriefingProse(item.impactSummary) : null,
          publishedAt: item.publishedAt ? String(item.publishedAt).trim() : null,
          citationIndex: mappedIndex,
        }
      })
      .filter((item) => item.headline.length > 0)

    if (items.length > 0) {
      briefingBlocks.push({
        blockType: 'newsCatalysts',
        windowLabel: windowLabel || 'Last 72h Corroborated Wire & SEC Filings',
        items,
      })
    }
  }

  return { briefingBlocks, citations }
}

export function mergeIngestBriefingBlocks(
  existingBlocks: TradeBriefingBlock[] | null | undefined,
  incomingBlocks: TradeBriefingBlock[] | null | undefined,
): TradeBriefingBlock[] {
  const existing = Array.isArray(existingBlocks) ? existingBlocks : []
  const incoming = Array.isArray(incomingBlocks) ? incomingBlocks : []

  const existingAnnotations = existing.filter(
    (b): b is DeskAnnotationBlockData => b?.blockType === 'deskAnnotation',
  )
  const pinnedAnnotations = existingAnnotations.filter((a) => a.pinToTop !== false)
  const unpinnedAnnotations = existingAnnotations.filter((a) => a.pinToTop === false)

  const machineIncoming = incoming.filter((b) => b && b.blockType !== 'deskAnnotation')
  return [...pinnedAnnotations, ...machineIncoming, ...unpinnedAnnotations]
}

// ---------------------------------------------------------------------------
// Input Sanitization (preserving exact legacy contract + new briefing fields)
// ---------------------------------------------------------------------------

export function sanitizeTradeSheetInput(raw: unknown): SanitizedTradeSheetInput {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Payload must be a JSON object')
  }
  const obj = raw as Record<string, unknown>
  const sheetDate = scrubSensitiveText(obj.sheetDate)
  if (!DATE_RE.test(sheetDate)) {
    throw new Error('sheetDate must match YYYY-MM-DD')
  }
  const title = scrubSensitiveText(obj.title) || `Daily Trade Sheet — ${sheetDate}`
  const subtitle = scrubSensitiveText(obj.subtitle)
  const alertBanner = scrubSensitiveText(obj.alertBanner)
  const sourceMode: 'curated' | 'auto_vm' | 'manual' =
    obj.sourceMode === 'auto_vm' || obj.sourceMode === 'manual' || obj.sourceMode === 'curated'
      ? obj.sourceMode
      : 'curated'

  const rawKpis = Array.isArray(obj.kpisJson) ? obj.kpisJson : []
  const kpisJson: TradeSheetKpi[] = rawKpis.slice(0, 8).map((k) => {
    const item = (k && typeof k === 'object' ? k : {}) as Record<string, unknown>
    return {
      label: scrubSensitiveText(item.label),
      value: scrubSensitiveText(item.value),
      sub: scrubSensitiveText(item.sub),
    }
  })

  const rawStrat = (obj.strategyJson && typeof obj.strategyJson === 'object'
    ? obj.strategyJson
    : {}) as Record<string, unknown>
  const strategyJson: TradeSheetStrategy = {
    headline: scrubSensitiveText(rawStrat.headline),
    summaryBullets: Array.isArray(rawStrat.summaryBullets)
      ? rawStrat.summaryBullets.map((b) => scrubSensitiveText(b)).filter(Boolean)
      : [],
    holdOffNotes: Array.isArray(rawStrat.holdOffNotes)
      ? rawStrat.holdOffNotes.map((b) => scrubSensitiveText(b)).filter(Boolean)
      : [],
    facts: Array.isArray(rawStrat.facts)
      ? rawStrat.facts.map((f) => {
          const item = (f && typeof f === 'object' ? f : {}) as Record<string, unknown>
          return {
            pillar: scrubSensitiveText(item.pillar),
            metric: scrubSensitiveText(item.metric),
            detail: scrubSensitiveText(item.detail),
          }
        })
      : [],
    expectedResults: Array.isArray(rawStrat.expectedResults)
      ? rawStrat.expectedResults.map((r) => {
          const item = (r && typeof r === 'object' ? r : {}) as Record<string, unknown>
          return {
            metric: scrubSensitiveText(item.metric),
            before: scrubSensitiveText(item.before),
            after: scrubSensitiveText(item.after),
            impact: scrubSensitiveText(item.impact),
          }
        })
      : [],
  }

  const rawTickets = Array.isArray(obj.ticketsJson) ? obj.ticketsJson : []
  const ticketsJson: TradeTicketRow[] = rawTickets.slice(0, 150).map((t, idx) => {
    const item = (t && typeof t === 'object' ? t : {}) as Record<string, unknown>
    return {
      id: scrubSensitiveText(item.id) || `row-${idx}`,
      wave: scrubSensitiveText(item.wave) || 'WAVE1',
      custodian: scrubSensitiveText(item.custodian),
      account: scrubSensitiveText(item.account),
      action: scrubSensitiveText(item.action).toUpperCase(),
      symbol: scrubSensitiveText(item.symbol),
      qty: scrubSensitiveText(item.qty),
      limitPrice: scrubSensitiveText(item.limitPrice),
      estValue: scrubSensitiveText(item.estValue),
      note: scrubSensitiveText(item.note),
      liveQuote: typeof item.liveQuote === 'number' ? item.liveQuote : null,
      quoteUpdatedAt: typeof item.quoteUpdatedAt === 'string' ? item.quoteUpdatedAt : null,
    }
  })

  const rawBriefing =
    obj.briefing && typeof obj.briefing === 'object'
      ? ({ ...(obj.briefing as TradeSheetBriefingInput) } as TradeSheetBriefingInput)
      : rawStrat.briefing && typeof rawStrat.briefing === 'object'
        ? ({ ...(rawStrat.briefing as TradeSheetBriefingInput) } as TradeSheetBriefingInput)
        : null
  const topCitations = Array.isArray(obj.citations)
    ? (obj.citations as TradeSheetBriefingInput['citations'])
    : null
  const mergedBriefingInput: TradeSheetBriefingInput | null =
    rawBriefing || topCitations
      ? {
          ...(rawBriefing ?? {}),
          citations: topCitations ?? rawBriefing?.citations ?? null,
        }
      : null

  const hasStructuredBriefing = Boolean(
    mergedBriefingInput || (Array.isArray(obj.briefingBlocks) && obj.briefingBlocks.length > 0),
  )

  const { briefingBlocks: compiledFromBriefing, citations: compiledCitations } =
    compileBriefingToPayloadBlocks(mergedBriefingInput, strategyJson)

  const compiledBlocks =
    Array.isArray(obj.briefingBlocks) && obj.briefingBlocks.length > 0
      ? (obj.briefingBlocks as TradeBriefingBlock[])
      : compiledFromBriefing

  const relatedTradeNotes = Array.isArray(obj.relatedTradeNotes)
    ? obj.relatedTradeNotes.filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
    : undefined

  return {
    sheetDate,
    title,
    subtitle,
    alertBanner,
    sourceMode,
    kpisJson,
    strategyJson,
    ticketsJson,
    compiledBlocks,
    compiledCitations,
    hasStructuredBriefing,
    relatedTradeNotes,
    resetChecks: Boolean(obj.resetChecks),
  }
}

// ---------------------------------------------------------------------------
// Ticker Extraction, Live Quote Re-anchoring & Record Parsing
// ---------------------------------------------------------------------------

export function extractEquityTicker(symbolOrContract: string): string | null {
  const m = symbolOrContract.trim().match(/^([A-Z]{1,6}(?:-[A-Z])?)\b/)
  return m ? m[1] : null
}

export function extractSheetTickers(
  tickets: TradeTicketRow[],
  briefingBlocks?: TradeBriefingBlock[],
): string[] {
  const tickers = new Set<string>()
  const add = (raw?: string | null) => {
    if (!raw) return
    const sym = extractEquityTicker(raw.trim().toUpperCase())
    if (sym && sym !== 'CASH' && sym !== 'USD') tickers.add(sym)
  }

  for (const t of tickets) add(t.symbol)
  for (const b of briefingBlocks ?? []) {
    if (b.blockType === 'moveRationales' && Array.isArray(b.items)) {
      for (const item of b.items) add(item.ticker)
    } else if (b.blockType === 'newsCatalysts' && Array.isArray(b.items)) {
      for (const item of b.items) add(item.ticker)
    } else if (b.blockType === 'deskAnnotation' && b.ticker) {
      add(b.ticker)
    }
  }
  return Array.from(tickers).sort()
}

function roundMarketableLimit(price: number): number {
  if (price >= 500) return Math.round(price * 4) / 4 // $0.25 increments
  if (price >= 20) return Math.round(price * 20) / 20 // $0.05 increments
  return Math.round(price * 100) / 100 // $0.01 increments
}

function formatUsd(val: number, decimals = 2): string {
  return (
    '$' +
    val.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  )
}

export function reanchorTicketWithSpot(
  ticket: TradeTicketRow,
  spot: number,
  updatedAtIso: string,
): TradeTicketRow {
  if (!Number.isFinite(spot) || spot <= 0) return ticket
  const act = ticket.action.toUpperCase()
  const qtyNum = parseFloat(ticket.qty.replace(/[^0-9.]/g, '')) || 0

  if (act === 'SELL' || act === 'BUY') {
    const mult = act === 'SELL' ? 0.996 : 1.004
    const newLim = roundMarketableLimit(spot * mult)
    const estDollars = qtyNum > 0 ? Math.round(qtyNum * newLim) : null
    const cleanNote = ticket.note.replace(/Live \$[0-9,.]+/i, `Live ${formatUsd(spot, 2)}`)
    const prefixedNote =
      cleanNote === ticket.note ? `Live ${formatUsd(spot, 2)} · ${ticket.note}` : cleanNote
    const finalNote = prefixedNote.replace(
      /\s*·\s*(?:Mon|Tue|Wed|Thu|Fri)\s+EOD\s+\$[0-9,.]+/gi,
      '',
    )

    return {
      ...ticket,
      limitPrice: formatUsd(newLim, 2),
      estValue: estDollars !== null ? formatUsd(estDollars, 0) : ticket.estValue,
      note: finalNote,
      liveQuote: spot,
      quoteUpdatedAt: updatedAtIso,
    }
  }

  // Option rows: preserve option strike/premium limit while updating underlying live spot note
  const cleanOptNote = ticket.note.replace(/Live \$[0-9,.]+/i, `Live ${formatUsd(spot, 2)}`)
  return {
    ...ticket,
    note: cleanOptNote,
    liveQuote: spot,
    quoteUpdatedAt: updatedAtIso,
  }
}

export function formatSheetDate(sheetDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(sheetDate)
  if (!match) return sheetDate
  const [, year, month, day] = match
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12, 0, 0))
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

export function computeTradeSheetSummary(
  tickets: TradeTicketRow[],
  checkedRowIds: string[],
) {
  const checkedSet = new Set(checkedRowIds)
  let totalTickets = 0
  let completedTickets = 0
  let wave1Total = 0
  let wave1Done = 0
  let wave2Total = 0
  let wave2Done = 0

  for (const t of tickets) {
    totalTickets += 1
    const done = checkedSet.has(t.id)
    if (done) completedTickets += 1
    if (t.wave.toUpperCase() === 'WAVE2') {
      wave2Total += 1
      if (done) wave2Done += 1
    } else {
      wave1Total += 1
      if (done) wave1Done += 1
    }
  }

  return {
    totalTickets,
    completedTickets,
    remainingTickets: Math.max(0, totalTickets - completedTickets),
    wave1Total,
    wave1Done,
    wave2Total,
    wave2Done,
  }
}

function parseLinkedTradeNotes(raw: unknown): LinkedTradeNote[] {
  if (!Array.isArray(raw)) return []
  const notes: LinkedTradeNote[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const doc = item as Record<string, unknown>
    if (typeof doc.id !== 'string' || typeof doc.title !== 'string') continue
    notes.push({
      id: doc.id,
      title: doc.title,
      ticker: typeof doc.ticker === 'string' ? doc.ticker : null,
      conviction:
        doc.conviction === 'high' ||
        doc.conviction === 'medium' ||
        doc.conviction === 'watch' ||
        doc.conviction === 'avoid'
          ? doc.conviction
          : null,
      valuationZone:
        doc.valuationZone === 'buy_zone' ||
        doc.valuationZone === 'hold_zone' ||
        doc.valuationZone === 'trim_zone'
          ? doc.valuationZone
          : null,
      strategy: typeof doc.strategy === 'string' ? doc.strategy : null,
      thesis: doc.thesis ?? null,
      metricsJson:
        doc.metricsJson && typeof doc.metricsJson === 'object'
          ? (doc.metricsJson as Record<string, unknown>)
          : null,
      sheetUrl: typeof doc.sheetUrl === 'string' ? doc.sheetUrl : null,
      updatedAt: typeof doc.updatedAt === 'string' ? doc.updatedAt : null,
    })
  }
  return notes
}

export function parseTradeSheetRecord(doc: Record<string, unknown>): TradeSheetRecord {
  const tickets = Array.isArray(doc.ticketsJson) ? (doc.ticketsJson as TradeTicketRow[]) : []
  const kpis = Array.isArray(doc.kpisJson) ? (doc.kpisJson as TradeSheetKpi[]) : []
  const checkedRowIds = Array.isArray(doc.checkedRowIds)
    ? doc.checkedRowIds.filter((v): v is string => typeof v === 'string')
    : []
  const strategy =
    doc.strategyJson && typeof doc.strategyJson === 'object' && !Array.isArray(doc.strategyJson)
      ? (doc.strategyJson as TradeSheetStrategy)
      : null
  const briefingBlocks = Array.isArray(doc.briefingBlocks)
    ? (doc.briefingBlocks as TradeBriefingBlock[])
    : []
  const citations = Array.isArray(doc.citations)
    ? (doc.citations as TradeCitationItem[]).filter(
        (c) => c && typeof c.url === 'string' && typeof c.label === 'string',
      )
    : []
  const sourceMode: 'curated' | 'auto_vm' | 'manual' =
    doc.sourceMode === 'curated' || doc.sourceMode === 'auto_vm' || doc.sourceMode === 'manual'
      ? doc.sourceMode
      : 'curated'

  return {
    id: String(doc.id ?? ''),
    sheetDate: String(doc.sheetDate ?? ''),
    title: String(doc.title ?? 'Trade Execution Sheet'),
    subtitle: typeof doc.subtitle === 'string' ? doc.subtitle : null,
    alertBanner: typeof doc.alertBanner === 'string' ? doc.alertBanner : null,
    sourceMode,
    executionProgress:
      typeof doc.executionProgress === 'string' ? doc.executionProgress : null,
    kpis,
    tickets,
    strategy,
    briefingBlocks,
    citations,
    relatedTradeNotes: parseLinkedTradeNotes(doc.relatedTradeNotes),
    checkedRowIds,
    quotesRefreshedAt: typeof doc.quotesRefreshedAt === 'string' ? doc.quotesRefreshedAt : null,
    updatedAt: typeof doc.updatedAt === 'string' ? doc.updatedAt : null,
  }
}
