import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from './Badge'

describe('Badge', () => {
  it('should render children correctly', () => {
    render(<Badge>Active</Badge>)
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('should apply default variant (default)', () => {
    render(<Badge>Default</Badge>)
    const badge = screen.getByText('Default')
    expect(badge.className).toContain('bg-obsidian-100')
  })

  it('should apply different variants', () => {
    const { rerender } = render(<Badge variant="success">Success</Badge>)
    let badge = screen.getByText('Success')
    expect(badge.className).toContain('bg-emerald-50')

    rerender(<Badge variant="warning">Warning</Badge>)
    badge = screen.getByText('Warning')
    expect(badge.className).toContain('bg-amber-50')

    rerender(<Badge variant="danger">Danger</Badge>)
    badge = screen.getByText('Danger')
    expect(badge.className).toContain('bg-red-50')

    rerender(<Badge variant="info">Info</Badge>)
    badge = screen.getByText('Info')
    expect(badge.className).toContain('bg-blue-50')

    rerender(<Badge variant="gold">Gold</Badge>)
    badge = screen.getByText('Gold')
    expect(badge.className).toContain('bg-gold-100')
  })

  it('should apply different sizes', () => {
    const { rerender } = render(<Badge size="sm">Small</Badge>)
    let badge = screen.getByText('Small')
    expect(badge.className).toContain('text-xs')

    rerender(<Badge size="md">Medium</Badge>)
    badge = screen.getByText('Medium')
    expect(badge.className).toContain('text-sm')
  })

  it('should render dot when dot prop is true', () => {
    const { container } = render(<Badge dot>With Dot</Badge>)
    const dot = container.querySelector('.w-2.h-2.rounded-full')
    expect(dot).toBeInTheDocument()
  })

  it('should not render dot when dot prop is false', () => {
    const { container } = render(<Badge>Without Dot</Badge>)
    const dot = container.querySelector('.w-2.h-2.rounded-full')
    expect(dot).not.toBeInTheDocument()
  })

  it('should apply correct dot color for each variant', () => {
    const { rerender, container } = render(<Badge dot variant="success">Success</Badge>)
    let dot = container.querySelector('.w-2.h-2.rounded-full')
    expect(dot?.className).toContain('bg-emerald-500')

    rerender(<Badge dot variant="warning">Warning</Badge>)
    dot = container.querySelector('.w-2.h-2.rounded-full')
    expect(dot?.className).toContain('bg-amber-500')

    rerender(<Badge dot variant="danger">Danger</Badge>)
    dot = container.querySelector('.w-2.h-2.rounded-full')
    expect(dot?.className).toContain('bg-red-500')
  })

  it('should apply animate-pulse to success and gold dot variants', () => {
    const { rerender, container } = render(<Badge dot variant="success">Success</Badge>)
    let dot = container.querySelector('.w-2.h-2.rounded-full')
    expect(dot?.className).toContain('animate-pulse')

    rerender(<Badge dot variant="gold">Gold</Badge>)
    dot = container.querySelector('.w-2.h-2.rounded-full')
    expect(dot?.className).toContain('animate-pulse')

    rerender(<Badge dot variant="danger">Danger</Badge>)
    dot = container.querySelector('.w-2.h-2.rounded-full')
    expect(dot?.className).not.toContain('animate-pulse')
  })

  it('should apply custom className', () => {
    render(<Badge className="custom-badge">Custom</Badge>)
    const badge = screen.getByText('Custom')
    expect(badge).toHaveClass('custom-badge')
  })

  it('should render inline-flex for proper alignment', () => {
    render(<Badge>Inline</Badge>)
    const badge = screen.getByText('Inline')
    expect(badge.className).toContain('inline-flex')
  })
})
