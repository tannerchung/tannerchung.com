'use client'

import React from 'react'
import type { IcSeatConfig } from '@/globals/TradeDeskSettings'
import type { TradeBriefingBlock, TradeCitationItem } from '@/lib/trade-sheets'
import { DeskAnnotationBlockView } from './DeskAnnotationBlockView'
import { ExecutiveMandateBlockView } from './ExecutiveMandateBlockView'
import { MoveRationalesBlockView } from './MoveRationalesBlockView'
import { NewsCatalystsBlockView } from './NewsCatalystsBlockView'
import { PanelDebatesBlockView } from './PanelDebatesBlockView'
import { RedTeamChallengerBlockView } from './RedTeamChallengerBlockView'

export function RenderTradeBriefingBlocks({
  blocks,
  citations = [],
  icSeats = [],
  onSelectCitation,
  activeTicker,
  onSelectTicker,
}: {
  blocks: TradeBriefingBlock[]
  citations?: TradeCitationItem[]
  icSeats?: IcSeatConfig[]
  onSelectCitation?: (index: number) => void
  activeTicker?: string | null
  onSelectTicker?: (ticker: string) => void
}) {
  if (!Array.isArray(blocks) || blocks.length === 0) return null

  return (
    <div className="space-y-7">
      {blocks.map((block, idx) => {
        const key = block.id ?? `${block.blockType}-${idx}`
        switch (block.blockType) {
          case 'deskAnnotation':
            return <DeskAnnotationBlockView key={key} block={block} />
          case 'executiveMandate':
            return (
              <ExecutiveMandateBlockView
                key={key}
                block={block}
                citations={citations}
                onSelectCitation={onSelectCitation}
              />
            )
          case 'moveRationales':
            return (
              <MoveRationalesBlockView
                key={key}
                block={block}
                citations={citations}
                onSelectCitation={onSelectCitation}
                activeTicker={activeTicker}
                onSelectTicker={onSelectTicker}
              />
            )
          case 'panelDebates':
            return (
              <PanelDebatesBlockView
                key={key}
                block={block}
                citations={citations}
                icSeats={icSeats}
                onSelectCitation={onSelectCitation}
              />
            )
          case 'redTeamChallenger':
            return (
              <RedTeamChallengerBlockView
                key={key}
                block={block}
                citations={citations}
                onSelectCitation={onSelectCitation}
              />
            )
          case 'newsCatalysts':
            return (
              <NewsCatalystsBlockView
                key={key}
                block={block}
                citations={citations}
                onSelectCitation={onSelectCitation}
              />
            )
          default:
            return null
        }
      })}
    </div>
  )
}
