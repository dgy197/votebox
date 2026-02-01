import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Modal } from './Modal'

describe('Modal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    title: 'Test Modal',
    children: <div>Modal content</div>,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Clean up body overflow style
    document.body.style.overflow = ''
  })

  it('should render when isOpen is true', () => {
    render(<Modal {...defaultProps} />)
    expect(screen.getByText('Test Modal')).toBeInTheDocument()
    expect(screen.getByText('Modal content')).toBeInTheDocument()
  })

  it('should not render when isOpen is false', () => {
    render(<Modal {...defaultProps} isOpen={false} />)
    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument()
  })

  it('should call onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(<Modal {...defaultProps} onClose={onClose} />)
    
    // Find the close button (has X icon)
    const closeButton = screen.getAllByRole('button')[0]
    fireEvent.click(closeButton)
    
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('should call onClose when backdrop is clicked', () => {
    const onClose = vi.fn()
    render(<Modal {...defaultProps} onClose={onClose} />)
    
    // Click on the backdrop (the element with bg-obsidian-950/60)
    const backdrop = document.querySelector('.bg-obsidian-950\\/60')
    if (backdrop) {
      fireEvent.click(backdrop)
    }
    
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('should call onClose when Escape key is pressed', () => {
    const onClose = vi.fn()
    render(<Modal {...defaultProps} onClose={onClose} />)
    
    fireEvent.keyDown(document, { key: 'Escape' })
    
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('should render footer when provided', () => {
    render(
      <Modal {...defaultProps} footer={<button>Save</button>} />
    )
    expect(screen.getByText('Save')).toBeInTheDocument()
  })

  it('should apply different sizes', () => {
    const { rerender } = render(<Modal {...defaultProps} size="sm" />)
    let modalContent = document.querySelector('.max-w-sm')
    expect(modalContent).toBeInTheDocument()

    rerender(<Modal {...defaultProps} size="lg" />)
    modalContent = document.querySelector('.max-w-lg')
    expect(modalContent).toBeInTheDocument()

    rerender(<Modal {...defaultProps} size="full" />)
    modalContent = document.querySelector('.max-w-full')
    expect(modalContent).toBeInTheDocument()
  })

  it('should prevent body scroll when open', () => {
    render(<Modal {...defaultProps} />)
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('should restore body scroll when closed', () => {
    const { rerender } = render(<Modal {...defaultProps} />)
    expect(document.body.style.overflow).toBe('hidden')
    
    rerender(<Modal {...defaultProps} isOpen={false} />)
    expect(document.body.style.overflow).toBe('')
  })

  it('should display title correctly', () => {
    render(<Modal {...defaultProps} title="Custom Title" />)
    expect(screen.getByText('Custom Title')).toBeInTheDocument()
  })
})
