import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useThemeStore } from './themeStore'

describe('themeStore', () => {
  beforeEach(() => {
    // Reset store
    useThemeStore.setState({ theme: 'light' })
    // Clear localStorage
    localStorage.clear()
    // Reset document class
    document.documentElement.classList.remove('dark')
  })

  describe('initial state', () => {
    it('should have light as default theme', () => {
      const state = useThemeStore.getState()
      expect(state.theme).toBe('light')
    })
  })

  describe('setTheme', () => {
    it('should set theme to dark', () => {
      useThemeStore.getState().setTheme('dark')
      const state = useThemeStore.getState()
      
      expect(state.theme).toBe('dark')
      expect(localStorage.getItem('theme')).toBe('dark')
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    it('should set theme to light', () => {
      // First set to dark
      useThemeStore.getState().setTheme('dark')
      // Then set to light
      useThemeStore.getState().setTheme('light')
      const state = useThemeStore.getState()
      
      expect(state.theme).toBe('light')
      expect(localStorage.getItem('theme')).toBe('light')
      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })

    it('should handle system theme preference', () => {
      // Mock matchMedia to return dark preference
      vi.spyOn(window, 'matchMedia').mockReturnValue({
        matches: true,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })

      useThemeStore.getState().setTheme('system')
      const state = useThemeStore.getState()
      
      expect(state.theme).toBe('system')
      expect(localStorage.getItem('theme')).toBe('system')
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    it('should persist theme to localStorage', () => {
      useThemeStore.getState().setTheme('dark')
      expect(localStorage.getItem('theme')).toBe('dark')

      useThemeStore.getState().setTheme('light')
      expect(localStorage.getItem('theme')).toBe('light')
    })
  })

  describe('theme toggle', () => {
    it('should toggle between light and dark', () => {
      expect(useThemeStore.getState().theme).toBe('light')
      
      useThemeStore.getState().setTheme('dark')
      expect(useThemeStore.getState().theme).toBe('dark')
      
      useThemeStore.getState().setTheme('light')
      expect(useThemeStore.getState().theme).toBe('light')
    })
  })
})
