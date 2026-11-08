import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SiteHeader } from '../src/components/SiteHeader'
import { PortfolioSections } from '../src/components/PortfolioSections'

beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

describe('portfolio navigation and content', () => {
  it('provides all section links, indicates the current section, and closes the mobile menu on navigation', () => {
    const navigate = vi.fn()
    render(<SiteHeader active="projects" navigate={navigate} />)
    const menu = screen.getByRole('button', { name: /Menu/ })
    expect(menu.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(menu)
    expect(screen.getByRole('button', { name: /Close/ }).getAttribute('aria-expanded')).toBe('true')
    const nav = screen.getByRole('navigation', { name: 'Primary' })
    expect(nav.querySelectorAll('a')).toHaveLength(7)
    expect(screen.getByRole('link', { name: 'Experience' }).getAttribute('href')).toBe('#experience')
    const projects = screen.getByRole('link', { name: 'Projects' })
    expect(projects.getAttribute('aria-current')).toBe('location')
    fireEvent.click(projects)
    expect(navigate).toHaveBeenCalledWith('projects')
    expect(screen.getByRole('button', { name: /Menu/ }).getAttribute('aria-expanded')).toBe('false')
  })

  it('has an accessible name, seven labelled focusable sections, and the supplied resume content', () => {
    const { container } = render(<PortfolioSections navigate={vi.fn()} active="home" />)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Chandra Vamshi Katineni')
    const regions = container.querySelectorAll('.portfolio-section')
    expect(regions).toHaveLength(7)
    for (const section of regions) {
      expect(section.getAttribute('tabindex')).toBe('-1')
      expect(document.getElementById(section.getAttribute('aria-labelledby') ?? '')).not.toBeNull()
    }
    expect(screen.getByText('MetLife')).toBeTruthy()
    expect(screen.getByText('HCL Tech')).toBeTruthy()
    expect(screen.getByText('December 2023 – July 2025')).toBeTruthy()
    expect(screen.getByText('August 2022 – November 2023')).toBeTruthy()
    expect(screen.getByText('Multi-Agent Prompt Enhancer')).toBeTruthy()
    expect(screen.getByText('Distributed ERP System')).toBeTruthy()
    expect(screen.getByText('Campus Marketplace Platform')).toBeTruthy()
    expect(screen.getByText('In development')).toBeTruthy()
    expect(screen.getAllByText(/Purdue University Fort Wayne/).length).toBeGreaterThan(0)
    expect(screen.getByText('Expected graduation: May 2027')).toBeTruthy()
    expect(container.textContent).toContain('4.0/4.0')
    expect(container.textContent).not.toMatch(/coming soon|5h limit|weekly limit|rate limits|Context window|01a1b337/)
    expect(container.querySelector('a[href^="tel:"]')).toBeNull()
    expect(container.querySelector('a[download], a[href$=".pdf"]')).toBeNull()
    expect(container.querySelector('a[href="mailto:katinenichandravamshi@gmail.com"]')).not.toBeNull()
    expect(container.querySelector('a[href="https://github.com/Chandravamshi1001"]')).not.toBeNull()
    expect(container.querySelector('a[href="https://www.linkedin.com/in/chandra-vamshi-314a24260"]')).not.toBeNull()
    const scrollRegions = container.querySelectorAll('.section-scroll')
    expect(scrollRegions).toHaveLength(6)
    for (const region of scrollRegions) {
      expect(region.getAttribute('role')).toBe('region')
      if (!region.classList.contains('skills-explorer')) expect(region.getAttribute('tabindex')).toBe('0')
      expect(document.getElementById(region.getAttribute('aria-labelledby') ?? '')).not.toBeNull()
    }
    expect(container.querySelectorAll('#skills .skill-group')).toHaveLength(6)
    expect(container.querySelectorAll('#skills button[data-skill-id]')).toHaveLength(41)
    expect(container.querySelectorAll('#education .coursework-list li')).toHaveLength(4)
  })
})
