import { describe, expect, it } from 'vitest'
import {
  TRADE_BRIEFING_BLOCKS,
  TRADE_NOTE_LEXICAL_BLOCKS,
  sanitizeCitationUrl,
  validatePublicHttpsCitationUrl,
} from '@/blocks/trade-desk'
import { DEFAULT_IC_SEATS } from '@/globals/TradeDeskSettings'
import { TradeSheets } from '@/collections/TradeSheets'

describe('Payload Trade Desk Blocks & Citation Security', () => {
  it('registers all 6 briefing blocks and 2 lexical research blocks', () => {
    expect(TRADE_BRIEFING_BLOCKS.map((b) => b.slug)).toEqual([
      'executiveMandate',
      'moveRationales',
      'panelDebates',
      'redTeamChallenger',
      'newsCatalysts',
      'deskAnnotation',
    ])
    expect(TRADE_NOTE_LEXICAL_BLOCKS.map((b) => b.slug)).toEqual([
      'valuationBand',
      'killSwitchRule',
    ])
  })

  it('defines 9 sovereign IC seats with unique keys', () => {
    expect(DEFAULT_IC_SEATS).toHaveLength(9)
    const keys = new Set(DEFAULT_IC_SEATS.map((s) => s.seatKey))
    expect(keys.size).toBe(9)
    expect(keys.has('cio_chair')).toBe(true)
    expect(keys.has('cpa_tax')).toBe(true)
  })

  it('accepts public https:// URLs and preserves SEC EDGAR parameters while stripping tracking tags', () => {
    const edgar =
      'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001045810&type=10-Q&utm_source=newsletter&fbclid=abc123'
    expect(validatePublicHttpsCitationUrl(edgar)).toBe(true)
    expect(sanitizeCitationUrl(edgar)).toBe(
      'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001045810&type=10-Q',
    )

    const reuters =
      'https://www.reuters.com/markets/us/fed-minutes/?utm_medium=email&gclid=xyz&mc_cid=1&mc_eid=2'
    expect(sanitizeCitationUrl(reuters)).toBe('https://www.reuters.com/markets/us/fed-minutes/')
  })

  it('rejects non-https, embedded credentials, private IPs, localhost, webmail, and brokerage URLs', () => {
    const rejected = [
      '',
      'not-a-url',
      'http://www.sec.gov/10-q',
      'javascript:alert(1)',
      'data:text/html,<h1>x</h1>',
      'file:///etc/passwd',
      'https://user:pass@example.com/secret',
      'https://localhost/admin',
      'https://sub.localhost/api',
      'https://internal.local/doc',
      'https://127.0.0.1/status',
      'https://10.0.0.5/internal',
      'https://192.168.1.10/router',
      'https://169.254.169.254/latest/meta-data',
      'https://172.16.4.2/private',
      'https://[::1]/loopback',
      'https://[fe80::1]/link-local',
      'https://[fc00::1]/ula',
      'https://mail.google.com/mail/u/0/#inbox/123',
      'https://gmail.com/inbox',
      'https://outlook.live.com/mail',
      'https://mail.yahoo.com/d/folders/1',
      'https://digital.fidelity.com/ftgw/digital/portfolio',
      'https://client.schwab.com/app/accounts/positions',
      'https://olui2.fs.ml.com/account',
      'https://www.morganstanley.com/client',
      'https://portal.interactivebrokers.com/sso',
      'https://www.ibkr.com/account',
      'https://personal.vanguard.com/us/MyHome',
      'https://us.etrade.com/home',
      'https://www.tdameritrade.com/home',
      'https://robinhood.com/stocks/NVDA',
    ]

    for (const url of rejected) {
      expect(validatePublicHttpsCitationUrl(url), `should reject ${url}`).not.toBe(true)
      expect(sanitizeCitationUrl(url), `sanitize should return null for ${url}`).toBeNull()
    }
  })

  it('computes TradeSheets virtual executionProgress field accurately', () => {
    const field = TradeSheets.fields.find(
      (f) => 'name' in f && f.name === 'executionProgress',
    )
    expect(field).toBeDefined()
    expect(field && 'virtual' in field && field.virtual).toBe(true)
    const hook =
      field && 'hooks' in field && field.hooks?.afterRead?.[0]
        ? field.hooks.afterRead[0]
        : null
    expect(hook).toBeTypeOf('function')

    const progress = hook?.({
      siblingData: {
        ticketsJson: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
        checkedRowIds: ['a', 'stale-id'],
      },
    } as never)
    expect(progress).toBe('1 / 3 staged')
  })
})
