import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Card, CardHeader, CardDivider } from './Card'

describe('Card', () => {
  it('should render children correctly', () => {
    render(<Card>Card content</Card>)
    expect(screen.getByText('Card content')).toBeInTheDocument()
  })

  it('should apply default padding (md)', () => {
    render(<Card>Content</Card>)
    const card = screen.getByText('Content').closest('div')
    expect(card?.className).toContain('p-5')
  })

  it('should apply different padding sizes', () => {
    const { rerender } = render(<Card padding="none">Content</Card>)
    let card = screen.getByText('Content').closest('div')
    expect(card?.className).not.toContain('p-4')
    expect(card?.className).not.toContain('p-5')

    rerender(<Card padding="sm">Content</Card>)
    card = screen.getByText('Content').closest('div')
    expect(card?.className).toContain('p-4')

    rerender(<Card padding="lg">Content</Card>)
    card = screen.getByText('Content').closest('div')
    expect(card?.className).toContain('p-6')

    rerender(<Card padding="xl">Content</Card>)
    card = screen.getByText('Content').closest('div')
    expect(card?.className).toContain('p-8')
  })

  it('should apply hover effect when hover prop is true', () => {
    render(<Card hover>Hoverable</Card>)
    const card = screen.getByText('Hoverable').closest('div')
    expect(card?.className).toContain('card-lift')
    expect(card?.className).toContain('cursor-pointer')
  })

  it('should apply glass effect when glass prop is true', () => {
    render(<Card glass>Glass card</Card>)
    const card = screen.getByText('Glass card').closest('div')
    expect(card?.className).toContain('glass')
  })

  it('should apply different accent styles', () => {
    const { rerender } = render(<Card accent="gold">Gold accent</Card>)
    let card = screen.getByText('Gold accent').closest('div')
    expect(card?.className).toContain('ring-gold-400')

    rerender(<Card accent="top">Top accent</Card>)
    card = screen.getByText('Top accent').closest('div')
    expect(card?.className).toContain('border-t-gold-400')
  })

  it('should apply custom className', () => {
    render(<Card className="custom-card">Custom</Card>)
    const card = screen.getByText('Custom').closest('div')
    expect(card).toHaveClass('custom-card')
  })

  it('should accept style prop', () => {
    render(<Card style={{ backgroundColor: 'red' }}>Styled</Card>)
    const card = screen.getByText('Styled').closest('div')
    expect(card).toHaveAttribute('style', expect.stringContaining('background-color'))
  })
})

describe('CardHeader', () => {
  it('should render title', () => {
    render(<CardHeader title="Test Title" />)
    expect(screen.getByText('Test Title')).toBeInTheDocument()
  })

  it('should render subtitle when provided', () => {
    render(<CardHeader title="Title" subtitle="Subtitle text" />)
    expect(screen.getByText('Subtitle text')).toBeInTheDocument()
  })

  it('should render action when provided', () => {
    render(
      <CardHeader 
        title="Title" 
        action={<button data-testid="action-btn">Action</button>} 
      />
    )
    expect(screen.getByTestId('action-btn')).toBeInTheDocument()
  })

  it('should render icon when provided', () => {
    render(
      <CardHeader 
        title="Title" 
        icon={<span data-testid="header-icon">🏠</span>} 
      />
    )
    expect(screen.getByTestId('header-icon')).toBeInTheDocument()
  })
})

describe('CardDivider', () => {
  it('should render divider element', () => {
    const { container } = render(<CardDivider />)
    const divider = container.querySelector('.h-px')
    expect(divider).toBeInTheDocument()
  })
})
