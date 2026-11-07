import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SiteHeader } from '../src/components/SiteHeader'
import { PortfolioSections } from '../src/components/PortfolioSections'

afterEach(cleanup)

describe('portfolio navigation and content', () => {
  it('provides all section links, indicates the current section, and closes the mobile menu on navigation', () => {
    const navigate = vi.fn()
    render(<SiteHeader active="projects" navigate={navigate} />)
    const menu = screen.getByRole('button', { name: /Menu/ })
    expect(menu.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(menu)
    expect(screen.getByRole('button', { name: /Close/ }).getAttribute('aria-expanded')).toBe('true')
    const nav = screen.getByRole('navigation', { name: 'Primary' })
    expect(nav.querySelectorAll('a')).toHaveLength(6)
    const projects = screen.getByRole('link', { name: 'Projects' })
    expect(projects.getAttribute('aria-current')).toBe('location')
    fireEvent.click(projects)
    expect(navigate).toHaveBeenCalledWith('projects')
    expect(screen.getByRole('button', { name: /Menu/ }).getAttribute('aria-expanded')).toBe('false')
  })

  it('has an accessible name, six labelled focusable sections, and honest placeholder content', () => {
    render(<PortfolioSections navigate={vi.fn()} />)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Chandra Vamshi Katineni')
    const regions = screen.getAllByRole('region')
    expect(regions).toHaveLength(6)
    for (const section of regions) {
      expect(section.getAttribute('tabindex')).toBe('-1')
      expect(document.getElementById(section.getAttribute('aria-labelledby') ?? '')).not.toBeNull()
    }
    expect(screen.getByText('First project, coming soon')).toBeTruthy()
    expect(screen.getByText('Education details coming soon')).toBeTruthy()
    expect(screen.getByText('Contact information coming soon')).toBeTruthy()
  })
})
