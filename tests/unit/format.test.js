import { describe, expect, it } from 'vitest'
import {
  daysBetween,
  formatMinutes,
  formatMoney,
  formatShortDate,
  greetingFor,
  hostFromUrl,
  monthGrid,
  sessionMinutes,
} from '../../src/utils/format'

describe('formatMoney', () => {
  it('formats USD by default', () => {
    expect(formatMoney(1234.5)).toBe('$1,234.50')
  })

  it('uses the provided currency', () => {
    expect(formatMoney(10, 'EUR')).toContain('€')
    expect(formatMoney(10, 'INR')).toContain('₹')
  })

  it('gracefully handles invalid currency codes', () => {
    expect(formatMoney(10, 'NOPE')).toBe('NOPE 10.00')
  })
})

describe('cycles and durations', () => {
  it('counts calendar days between ISO dates', () => {
    expect(daysBetween('2026-10-01', '2026-10-29')).toBe(28)
    expect(daysBetween('2026-10-29', '2026-10-01')).toBe(-28)
    expect(daysBetween(null, '2026-10-01')).toBe(0)
  })

  it('formats focus minutes', () => {
    expect(formatMinutes(0)).toBe('0m')
    expect(formatMinutes(45)).toBe('45m')
    expect(formatMinutes(120)).toBe('2h')
    expect(formatMinutes(155)).toBe('2h 35m')
  })

  it('reads session durations from either shape', () => {
    expect(sessionMinutes({ minutes: 25 })).toBe(25)
    expect(sessionMinutes({ duration: '1h 5m' })).toBe(65)
    expect(sessionMinutes(null)).toBe(0)
  })
})

describe('calendar helpers', () => {
  it('builds a grid padded to full weeks', () => {
    const cells = monthGrid('2026-10-15')
    expect(cells.length % 7).toBe(0)
    expect(cells.filter(Boolean)).toHaveLength(31)
  })

  it('summarises short dates and hosts', () => {
    expect(formatShortDate('2026-10-29')).toBe('Oct 29')
    expect(formatShortDate('')).toBe('No date')
    expect(hostFromUrl('https://www.example.com/path')).toBe('example.com')
    expect(hostFromUrl('not a url')).toBe('not a url')
  })

  it('greets according to a time zone', () => {
    const noonUtc = new Date('2026-10-29T12:00:00Z')
    expect(greetingFor(noonUtc, 'UTC')).toBe('Good afternoon')
    expect(greetingFor(noonUtc, 'Pacific/Kiritimati')).toBe('Good night')
  })
})
