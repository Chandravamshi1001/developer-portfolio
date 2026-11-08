import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../src/App'
import type { MuseFormation } from '../src/features/muse/geometry'

const navigation = vi.hoisted(() => ({ active: 'home', navigate: vi.fn(), enabled: false }))
const fixture = vi.hoisted(() => ({ particles: [], bounds: { left: 1400, top: 500, width: 88, height: 102 } }))
vi.mock('../src/features/navigation/useSectionNavigation', () => ({ useSectionNavigation: (enabled: boolean) => {
  navigation.enabled = enabled
  return { shellRef: { current: null }, trackRef: { current: null }, horizontal: false, active: navigation.active, navigate: navigation.navigate }
} }))
vi.mock('../src/features/particles/ParticleField', () => ({ ParticleField: ({ onIntroActiveChange, onMuseFormed }: { onIntroActiveChange: (active: boolean) => void; onMuseFormed?: (formation: MuseFormation) => void }) => <>
  <button onClick={() => { onMuseFormed?.(fixture); onIntroActiveChange(false) }}>Complete test intro</button>
  <button onClick={() => onIntroActiveChange(true)}>Replay test intro</button>
</> }))
vi.mock('../src/components/PortfolioMuse', () => ({ PortfolioMuse: ({ request, formation }: { request?: { sequence: number; direction: number }; formation?: MuseFormation }) => <><output data-testid="muse-request">{JSON.stringify(request ?? null)}</output><output data-testid="muse-formation">{formation === fixture ? 'shared' : 'different'}</output></> }))

beforeEach(() => {
  navigation.active = 'home'; vi.clearAllMocks()
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })
function request(): { sequence: number; direction: number } { return JSON.parse(screen.getByTestId('muse-request').textContent!) }

describe('Muse App integration', () => {
  it('mounts Muse after intro and removes it throughout Replay', () => {
    render(<App />)
    expect(screen.queryByTestId('muse-request')).toBeNull()
    expect(navigation.enabled).toBe(false)
    fireEvent.click(screen.getByRole('button', { name: 'Complete test intro' }))
    expect(screen.getByTestId('muse-request')).toBeTruthy()
    expect(screen.getByTestId('muse-formation').textContent).toBe('shared')
    expect(navigation.enabled).toBe(true)
    fireEvent.click(screen.getByRole('link', { name: 'Projects' }))
    expect(request().direction).toBe(1)
    fireEvent.click(screen.getByRole('button', { name: 'Replay test intro' }))
    expect(screen.queryByTestId('muse-request')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Complete test intro' }))
    expect(screen.getByTestId('muse-request').textContent).toBe('null')
  })

  it('derives direction from active section order and gives repeated clicks a new sequence', () => {
    const { rerender } = render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Complete test intro' }))
    fireEvent.click(screen.getByRole('link', { name: 'Projects' }))
    expect(request().direction).toBe(1)
    expect(navigation.navigate).toHaveBeenLastCalledWith('projects')
    const first = request().sequence
    fireEvent.click(screen.getByRole('link', { name: 'Projects' }))
    expect(request().sequence).toBeGreaterThan(first)
    navigation.active = 'skills'
    rerender(<App />)
    fireEvent.click(screen.getByRole('link', { name: 'About' }))
    expect(request().direction).toBe(-1)
    navigation.active = 'about'
    rerender(<App />)
    fireEvent.click(screen.getByRole('link', { name: 'About' }))
    expect(request().direction).toBe(0)
  })
})
