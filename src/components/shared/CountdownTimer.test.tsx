import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { CountdownTimer, useCountdown } from './CountdownTimer'
import { renderHook } from '@testing-library/react'

describe('CountdownTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should display remaining time correctly', () => {
    const now = new Date()
    const activatedAt = now.toISOString()
    
    render(
      <CountdownTimer
        activatedAt={activatedAt}
        durationSeconds={60}
      />
    )

    // Should show 60 or close to it (within 1 second)
    expect(screen.getByText(/60|59|1:00|0:59/)).toBeInTheDocument()
  })

  it('should format minutes and seconds correctly', () => {
    const now = new Date()
    const activatedAt = new Date(now.getTime() - 30000).toISOString() // 30 seconds ago
    
    render(
      <CountdownTimer
        activatedAt={activatedAt}
        durationSeconds={120} // 2 minutes total, 1:30 remaining
      />
    )

    expect(screen.getByText(/1:30|1:29/)).toBeInTheDocument()
  })

  it('should show warning style when below threshold', () => {
    const now = new Date()
    const activatedAt = new Date(now.getTime() - 55000).toISOString() // 55 seconds ago
    
    render(
      <CountdownTimer
        activatedAt={activatedAt}
        durationSeconds={60} // 5 seconds remaining
        warningThreshold={10}
      />
    )

    // Should have animate-pulse class for warning
    const timerElement = screen.getByText(/5|4/).closest('div')
    expect(timerElement).toHaveClass('animate-pulse')
  })

  it('should show "Lejárt" when expired', () => {
    const now = new Date()
    const activatedAt = new Date(now.getTime() - 70000).toISOString() // 70 seconds ago
    
    render(
      <CountdownTimer
        activatedAt={activatedAt}
        durationSeconds={60} // Already expired
      />
    )

    expect(screen.getByText('Lejárt')).toBeInTheDocument()
  })

  it('should call onExpire callback when countdown ends', () => {
    const onExpire = vi.fn()
    const now = new Date()
    const activatedAt = new Date(now.getTime() - 59000).toISOString() // 59 seconds ago
    
    render(
      <CountdownTimer
        activatedAt={activatedAt}
        durationSeconds={60} // 1 second remaining
        onExpire={onExpire}
      />
    )

    // Fast forward 2 seconds
    act(() => {
      vi.advanceTimersByTime(2000)
    })

    // Should be called at least once (may be called more due to React StrictMode)
    expect(onExpire).toHaveBeenCalled()
  })

  it('should handle different size variants', () => {
    const now = new Date()
    const activatedAt = now.toISOString()
    
    const { rerender, container } = render(
      <CountdownTimer
        activatedAt={activatedAt}
        durationSeconds={60}
        size="sm"
      />
    )

    // Check for text-sm class in the container
    let timerDiv = container.querySelector('.text-sm')
    expect(timerDiv).toBeInTheDocument()

    rerender(
      <CountdownTimer
        activatedAt={activatedAt}
        durationSeconds={60}
        size="lg"
      />
    )

    // Check for text-xl class
    timerDiv = container.querySelector('.text-xl')
    expect(timerDiv).toBeInTheDocument()
  })
})

describe('useCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return null when no time limit', () => {
    const { result } = renderHook(() => useCountdown(null, null))
    
    expect(result.current.remainingSeconds).toBeNull()
    expect(result.current.hasTimeLimit).toBe(false)
  })

  it('should calculate remaining seconds', () => {
    const now = new Date()
    const activatedAt = new Date(now.getTime() - 30000).toISOString()
    
    const { result } = renderHook(() => useCountdown(activatedAt, 60))
    
    // Should be around 30 seconds remaining
    expect(result.current.remainingSeconds).toBeGreaterThanOrEqual(28)
    expect(result.current.remainingSeconds).toBeLessThanOrEqual(30)
    expect(result.current.hasTimeLimit).toBe(true)
  })

  it('should set isExpired when countdown ends', () => {
    const now = new Date()
    const activatedAt = new Date(now.getTime() - 59000).toISOString()
    
    const { result } = renderHook(() => useCountdown(activatedAt, 60))
    
    // Initially not expired
    expect(result.current.isExpired).toBe(false)
    
    // Fast forward
    act(() => {
      vi.advanceTimersByTime(2000)
    })
    
    expect(result.current.isExpired).toBe(true)
  })
})
