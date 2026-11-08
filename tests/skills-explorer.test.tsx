import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SkillsExplorer } from '../src/components/SkillsExplorer'
import { approvedSkillRatings, knowledgeOnlySkills } from './skills-expectations'

beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
})
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks() })

function cardFor(container: HTMLElement, name: string) {
  const card = [...container.querySelectorAll<HTMLButtonElement>('button[data-skill-id]')].find(card => within(card).queryAllByText(name, { exact: true }).length > 0)
  if (!card) throw new Error(`Missing native skill button: ${name}`)
  return card
}

describe('Skills Explorer selection and evidence', () => {
  it('exposes all 41 native buttons, one reusable labelled panel, and each approved accessible meter', () => {
    const { container } = render(<SkillsExplorer />)
    expect(container.querySelectorAll('button[data-skill-id]')).toHaveLength(41)
    expect(screen.getByRole('region', { name: 'Explore the toolkit' }).id).toBe('skill-detail')
    for (const [name, value] of Object.entries(approvedSkillRatings)) {
      const card = cardFor(container, name)
      card.focus()
      fireEvent.click(card)
      expect(document.activeElement).toBe(card)
      expect(card.getAttribute('aria-controls')).toBe('skill-detail')
      expect(card.getAttribute('aria-pressed')).toBe('true')
      expect(container.querySelectorAll('button[data-skill-id][aria-pressed="true"]')).toHaveLength(1)
      expect(container.querySelectorAll('#skill-detail')).toHaveLength(1)
      const detail = container.querySelector<HTMLElement>('#skill-detail')!
      expect(detail.getAttribute('aria-labelledby')).toBe('skill-detail-heading')
      expect(detail.querySelector('#skill-detail-heading')?.textContent).toContain(name)
      const meter = within(detail as HTMLElement).getByRole('meter')
      expect(meter.getAttribute('aria-valuemin')).toBe('0')
      expect(meter.getAttribute('aria-valuemax')).toBe('5')
      expect(Number(meter.getAttribute('aria-valuenow'))).toBe(value)
      expect(meter.getAttribute('aria-label') || meter.getAttribute('aria-labelledby')).toBeTruthy()
    }
    expect(screen.getByRole('status').getAttribute('aria-live')).toBe('polite')
  })

  it('separates professional and project evidence and explains knowledge-only and limited project claims', () => {
    const { container } = render(<SkillsExplorer />)
    const detail = () => container.querySelector<HTMLElement>('#skill-detail')!
    fireEvent.click(cardFor(container, 'Java'))
    expect(within(detail()).getByText(/Professional experience/i)).toBeTruthy()
    expect(within(detail()).getByText('Projects', { exact: true })).toBeTruthy()
    expect(detail().textContent).toMatch(/MetLife/)
    expect(detail().textContent).toMatch(/HCL/)
    expect(detail().textContent).toMatch(/Distributed ERP/)
    for (const name of knowledgeOnlySkills) {
      fireEvent.click(cardFor(container, name))
      expect(detail().textContent).toContain('The resume lists this skill but does not document a specific implementation.')
      expect(detail().textContent).not.toMatch(/MetLife|HCL Tech|Campus Marketplace|Distributed ERP|Prompt Enhancer/)
    }
    for (const name of ['React', 'Cypress']) {
      fireEvent.click(cardFor(container, name))
      expect(detail().textContent).toMatch(/stack/i)
      expect(detail().textContent).toMatch(/backend|ownership|responsib/i)
    }
    fireEvent.click(cardFor(container, 'AI Agents'))
    expect(detail().textContent).toMatch(/In development/i)
    expect(detail().textContent).toMatch(/planner|enhancer|reviewer|evaluator/i)
  })
})
