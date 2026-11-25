'use client'

import React from 'react'
import type { LinkedTradeNote } from '@/lib/trade-sheets'

interface LexicalNode {
  type?: string
  text?: string
  format?: number | string
  tag?: string
  listType?: string
  children?: LexicalNode[]
  fields?: Record<string, unknown>
}

interface ValuationBandFields {
  blockType: 'valuationBand'
  ticker?: string
  asOfDate?: string
  buyBelowUsd?: number | null
  fairValueUsd?: number | null
  trimAboveUsd?: number | null
  currentSpotUsd?: number | null
  methodology?: string
  notes?: string
}

interface KillSwitchRuleFields {
  blockType: 'killSwitchRule'
  ticker?: string
  triggerKind?: string
  condition?: string
  action?: string
  severity?: 'watch' | 'mandatory_exit' | string
}

function fmtUsd(value?: number | null): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—'
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function ValuationBandPresenter({ fields }: { fields: ValuationBandFields }) {
  const buy = typeof fields.buyBelowUsd === 'number' ? fields.buyBelowUsd : null
  const fair = typeof fields.fairValueUsd === 'number' ? fields.fairValueUsd : null
  const trim = typeof fields.trimAboveUsd === 'number' ? fields.trimAboveUsd : null
  const spot = typeof fields.currentSpotUsd === 'number' ? fields.currentSpotUsd : null

  const nums = [buy, fair, trim, spot].filter((n): n is number => n !== null)
  const minVal = nums.length > 0 ? Math.min(...nums) * 0.92 : 0
  const maxVal = nums.length > 0 ? Math.max(...nums) * 1.08 : 100
  const span = Math.max(1, maxVal - minVal)
  const pct = (val: number | null) =>
    val === null ? null : Math.max(2, Math.min(98, ((val - minVal) / span) * 100))

  const buyPct = pct(buy)
  const fairPct = pct(fair)
  const trimPct = pct(trim)
  const spotPct = pct(spot)

  return (
    <div
      data-lexical-block="valuationBand"
      className="my-3 border border-[var(--color-rule)] bg-[var(--color-paper-3)] p-3.5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <span className="font-mono-code text-[10px] uppercase tracking-[0.12em] text-[var(--color-subtle)]">
            Valuation Band
          </span>
          {fields.ticker && (
            <span className="font-mono-code text-[11px] font-semibold text-[var(--color-ink)]">
              {fields.ticker}
            </span>
          )}
        </div>
        <div className="font-mono-code tabular-nums text-[10px] text-[var(--color-subtle)]">
          {[fields.methodology, fields.asOfDate].filter(Boolean).join(' · ')}
        </div>
      </div>

      {/* Horizontal visual band bar */}
      <div className="relative h-5 flex items-center mb-2.5" aria-hidden="true">
        <div className="w-full h-1.5 bg-[var(--color-rule)] relative overflow-visible">
          {buyPct !== null && (
            <div
              className="absolute top-0 bottom-0 left-0"
              style={{
                width: `${buyPct}%`,
                backgroundColor: 'color-mix(in oklch, var(--color-pos) 32%, transparent)',
              }}
            />
          )}
          {trimPct !== null && (
            <div
              className="absolute top-0 bottom-0 right-0"
              style={{
                left: `${trimPct}%`,
                backgroundColor: 'color-mix(in oklch, var(--color-neg) 28%, transparent)',
              }}
            />
          )}
          {fairPct !== null && (
            <div
              className="absolute -top-1 w-0.5 h-3.5 bg-[var(--color-muted)]"
              style={{ left: `${fairPct}%` }}
            />
          )}
          {spotPct !== null && (
            <div
              className="absolute -top-1.5 -ml-1.5 w-3 h-3 rounded-full border-2 border-[var(--color-paper-2)]"
              style={{ left: `${spotPct}%`, backgroundColor: 'var(--color-accent)' }}
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono-code tabular-nums text-[11px]">
        <div>
          <div className="text-[9.5px] uppercase tracking-[0.1em] text-[var(--color-pos)]">
            Buy Below
          </div>
          <div className="text-[var(--color-ink)] font-semibold">{fmtUsd(buy)}</div>
        </div>
        <div>
          <div className="text-[9.5px] uppercase tracking-[0.1em] text-[var(--color-subtle)]">
            Fair Value
          </div>
          <div className="text-[var(--color-ink)] font-semibold">{fmtUsd(fair)}</div>
        </div>
        <div>
          <div className="text-[9.5px] uppercase tracking-[0.1em] text-[var(--color-neg)]">
            Trim Above
          </div>
          <div className="text-[var(--color-ink)] font-semibold">{fmtUsd(trim)}</div>
        </div>
        <div>
          <div className="text-[9.5px] uppercase tracking-[0.1em] text-[var(--color-accent)]">
            Spot
          </div>
          <div className="text-[var(--color-ink)] font-semibold">{fmtUsd(spot)}</div>
        </div>
      </div>

      {fields.notes && (
        <p className="mt-2 text-[12px] leading-[1.5] text-[var(--color-muted)]">
          {fields.notes}
        </p>
      )}
    </div>
  )
}

function KillSwitchRulePresenter({ fields }: { fields: KillSwitchRuleFields }) {
  const isMandatory = fields.severity === 'mandatory_exit'
  return (
    <div
      data-lexical-block="killSwitchRule"
      className="my-3 border border-[var(--color-rule)] border-l-2 bg-[var(--color-paper-2)] px-3.5 py-3"
      style={{
        borderLeftColor: isMandatory ? 'var(--color-neg)' : 'var(--color-warn)',
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="font-mono-code text-[10px] font-semibold uppercase tracking-[0.1em]"
            style={{ color: isMandatory ? 'var(--color-neg)' : 'var(--color-warn)' }}
          >
            Kill-Switch Rule
          </span>
          {fields.ticker && (
            <span className="font-mono-code text-[11px] font-semibold text-[var(--color-ink)]">
              {fields.ticker}
            </span>
          )}
          {fields.triggerKind && (
            <span className="font-mono-code text-[10px] uppercase tracking-[0.08em] text-[var(--color-subtle)]">
              · {fields.triggerKind}
            </span>
          )}
        </div>
        <span
          className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono-code font-semibold uppercase tracking-[0.08em] border"
          style={{
            color: isMandatory ? 'var(--color-neg)' : 'var(--color-warn)',
            borderColor: isMandatory
              ? 'color-mix(in oklch, var(--color-neg) 38%, transparent)'
              : 'color-mix(in oklch, var(--color-warn) 38%, transparent)',
            backgroundColor: isMandatory
              ? 'color-mix(in oklch, var(--color-neg) 8%, transparent)'
              : 'color-mix(in oklch, var(--color-warn) 8%, transparent)',
          }}
        >
          {isMandatory ? 'Mandatory Exit' : 'Watch'}
        </span>
      </div>

      {fields.condition && (
        <p className="text-[12.5px] leading-[1.55] text-[var(--color-ink)]">
          <span className="font-mono-code text-[10px] uppercase tracking-[0.08em] text-[var(--color-subtle)] mr-1.5">
            Trigger
          </span>
          {fields.condition}
        </p>
      )}
      {fields.action && (
        <p className="mt-1 text-[12.5px] leading-[1.55] text-[var(--color-muted)]">
          <span className="font-mono-code text-[10px] uppercase tracking-[0.08em] text-[var(--color-subtle)] mr-1.5">
            Action
          </span>
          {fields.action}
        </p>
      )}
    </div>
  )
}

function renderLexicalNode(node: LexicalNode, key: React.Key): React.ReactNode {
  if (!node || typeof node !== 'object') return null

  if (node.type === 'text') {
    const content = node.text ?? ''
    const fmt = typeof node.format === 'number' ? node.format : 0
    let el: React.ReactNode = content
    if (fmt & 16) {
      el = (
        <code className="font-mono-code text-[12px] px-1 py-0.5 bg-[var(--color-paper-3)] border border-[var(--color-rule)]">
          {el}
        </code>
      )
    }
    if (fmt & 2) el = <em>{el}</em>
    if (fmt & 1) el = <strong className="font-semibold text-[var(--color-ink)]">{el}</strong>
    return <React.Fragment key={key}>{el}</React.Fragment>
  }

  if (node.type === 'linebreak') {
    return <br key={key} />
  }

  if (node.type === 'block' && node.fields && typeof node.fields === 'object') {
    const blockType = node.fields.blockType
    if (blockType === 'valuationBand') {
      return (
        <ValuationBandPresenter
          key={key}
          fields={node.fields as unknown as ValuationBandFields}
        />
      )
    }
    if (blockType === 'killSwitchRule') {
      return (
        <KillSwitchRulePresenter
          key={key}
          fields={node.fields as unknown as KillSwitchRuleFields}
        />
      )
    }
    return null
  }

  const children = Array.isArray(node.children)
    ? node.children.map((child, i) => renderLexicalNode(child, `${String(key)}-${i}`))
    : null

  if (node.type === 'paragraph') {
    return (
      <p key={key} className="text-[13px] leading-[1.6] text-[var(--color-muted)] my-2">
        {children}
      </p>
    )
  }

  if (node.type === 'heading') {
    return (
      <h4
        key={key}
        className="font-display text-[17px] leading-[1.25] text-[var(--color-ink)] mt-3 mb-1.5"
        style={{ fontStyle: 'normal' }}
      >
        {children}
      </h4>
    )
  }

  if (node.type === 'list') {
    if (node.listType === 'number') {
      return (
        <ol key={key} className="list-decimal pl-5 my-2 space-y-1 text-[13px] text-[var(--color-muted)]">
          {children}
        </ol>
      )
    }
    return (
      <ul key={key} className="list-disc pl-5 my-2 space-y-1 text-[13px] text-[var(--color-muted)]">
        {children}
      </ul>
    )
  }

  if (node.type === 'listitem') {
    return <li key={key}>{children}</li>
  }

  if (node.type === 'quote') {
    return (
      <blockquote
        key={key}
        className="border-l-2 border-[var(--color-rule-2)] pl-3 my-2 text-[13px] italic text-[var(--color-muted)]"
      >
        {children}
      </blockquote>
    )
  }

  return <React.Fragment key={key}>{children}</React.Fragment>
}

const ZONE_LABELS: Record<string, { label: string; style: React.CSSProperties }> = {
  buy_zone: {
    label: 'BUY ZONE',
    style: {
      color: 'var(--color-pos)',
      borderColor: 'color-mix(in oklch, var(--color-pos) 38%, transparent)',
      backgroundColor: 'color-mix(in oklch, var(--color-pos) 8%, transparent)',
    },
  },
  hold_zone: {
    label: 'HOLD ZONE',
    style: {
      color: 'var(--color-muted)',
      borderColor: 'var(--color-rule-2)',
      backgroundColor: 'var(--color-paper-3)',
    },
  },
  trim_zone: {
    label: 'TRIM ZONE',
    style: {
      color: 'var(--color-neg)',
      borderColor: 'color-mix(in oklch, var(--color-neg) 38%, transparent)',
      backgroundColor: 'color-mix(in oklch, var(--color-neg) 8%, transparent)',
    },
  },
}

export function TradeNoteThesisCard({
  note,
  compact = false,
}: {
  note: LinkedTradeNote
  compact?: boolean
}) {
  const root =
    note.thesis &&
    typeof note.thesis === 'object' &&
    'root' in (note.thesis as Record<string, unknown>)
      ? ((note.thesis as { root?: LexicalNode }).root ?? null)
      : null

  const zone = note.valuationZone ? ZONE_LABELS[note.valuationZone] : null

  return (
    <article
      className={
        compact
          ? 'border border-[var(--color-rule)] bg-[var(--color-paper-2)] p-3.5'
          : 'border border-[var(--color-rule)] bg-[var(--color-paper-2)] p-5'
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex flex-wrap items-center gap-2">
          {note.ticker && (
            <span className="font-mono-code text-[12px] font-semibold text-[var(--color-ink)]">
              {note.ticker}
            </span>
          )}
          {note.conviction && (
            <span className="font-mono-code text-[10px] uppercase tracking-[0.08em] text-[var(--color-muted)] px-1.5 py-0.5 border border-[var(--color-rule)] bg-[var(--color-paper-3)]">
              {note.conviction}
            </span>
          )}
          {zone && (
            <span
              className="font-mono-code text-[10px] font-semibold uppercase tracking-[0.08em] px-1.5 py-0.5 border"
              style={zone.style}
            >
              {zone.label}
            </span>
          )}
        </div>
        {note.strategy && (
          <span className="font-mono-code text-[10px] uppercase tracking-[0.08em] text-[var(--color-subtle)]">
            {note.strategy}
          </span>
        )}
      </div>

      <h3
        className={
          compact
            ? 'font-display text-[18px] leading-[1.2] text-[var(--color-ink)] mb-2'
            : 'font-display text-[21px] leading-[1.2] text-[var(--color-ink)] mb-2.5'
        }
        style={{ fontStyle: 'normal' }}
      >
        {note.title}
      </h3>

      {root && Array.isArray(root.children) && root.children.length > 0 ? (
        <div>{root.children.map((node, idx) => renderLexicalNode(node, idx))}</div>
      ) : (
        <p className="text-[12.5px] text-[var(--color-subtle)]">
          No structured thesis prose stored for this research note yet.
        </p>
      )}
    </article>
  )
}

export const LinkedTradeNoteCard = TradeNoteThesisCard
