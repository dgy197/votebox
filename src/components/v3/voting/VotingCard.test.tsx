import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { VotingCard } from './VotingCard'
import type { AgendaItem, Member } from '../../../types/v3'

// Mock data
const mockAgendaItem: AgendaItem = {
  id: 'agenda-1',
  meeting_id: 'meeting-1',
  order_num: 1,
  title: 'Test Agenda Item',
  description: 'This is a test description',
  vote_type: 'yes_no_abstain',
  is_secret: false,
  required_majority: 'simple',
  status: 'voting',
  created_at: new Date().toISOString(),
}

const mockMember: Member = {
  id: 'member-1',
  org_id: 'org-1',
  name: 'Test User',
  email: 'test@example.com',
  weight: 10.5,
  weight_label: '10.5%',
  role: 'voter',
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

describe('VotingCard', () => {
  const mockOnVote = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockOnVote.mockResolvedValue(true)
  })

  it('renders the voting card with title and description', () => {
    render(
      <VotingCard
        agendaItem={mockAgendaItem}
        member={mockMember}
        hasVoted={false}
        onVote={mockOnVote}
      />
    )

    expect(screen.getByText('Test Agenda Item')).toBeInTheDocument()
    expect(screen.getByText('This is a test description')).toBeInTheDocument()
  })

  it('displays active voting badge', () => {
    render(
      <VotingCard
        agendaItem={mockAgendaItem}
        member={mockMember}
        hasVoted={false}
        onVote={mockOnVote}
      />
    )

    expect(screen.getByText('Szavazás aktív')).toBeInTheDocument()
  })

  it('renders all three vote options for yes_no_abstain type', () => {
    render(
      <VotingCard
        agendaItem={mockAgendaItem}
        member={mockMember}
        hasVoted={false}
        onVote={mockOnVote}
      />
    )

    expect(screen.getByRole('button', { name: /Szavazat: Igen/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Szavazat: Nem/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Szavazat: Tartózkodom/i })).toBeInTheDocument()
  })

  it('renders only two vote options for yes_no type', () => {
    const yesNoAgenda = { ...mockAgendaItem, vote_type: 'yes_no' as const }
    
    render(
      <VotingCard
        agendaItem={yesNoAgenda}
        member={mockMember}
        hasVoted={false}
        onVote={mockOnVote}
      />
    )

    expect(screen.getByRole('button', { name: /Szavazat: Igen/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Szavazat: Nem/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Szavazat: Tartózkodom/i })).not.toBeInTheDocument()
  })

  it('displays member name and weight', () => {
    render(
      <VotingCard
        agendaItem={mockAgendaItem}
        member={mockMember}
        hasVoted={false}
        onVote={mockOnVote}
      />
    )

    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getByText('10.50')).toBeInTheDocument()
    expect(screen.getByText('(10.5%)')).toBeInTheDocument()
  })

  it('selects a vote option when clicked', async () => {
    render(
      <VotingCard
        agendaItem={mockAgendaItem}
        member={mockMember}
        hasVoted={false}
        onVote={mockOnVote}
      />
    )

    const yesButton = screen.getByRole('button', { name: /Szavazat: Igen/i })
    fireEvent.click(yesButton)

    await waitFor(() => {
      expect(yesButton).toHaveAttribute('aria-pressed', 'true')
    })
  })

  it('submit button is disabled when no vote is selected', () => {
    render(
      <VotingCard
        agendaItem={mockAgendaItem}
        member={mockMember}
        hasVoted={false}
        onVote={mockOnVote}
      />
    )

    const submitButton = screen.getByRole('button', { name: /Szavazok/i })
    expect(submitButton).toBeDisabled()
  })

  it('enables submit button when a vote is selected', async () => {
    render(
      <VotingCard
        agendaItem={mockAgendaItem}
        member={mockMember}
        hasVoted={false}
        onVote={mockOnVote}
      />
    )

    const yesButton = screen.getByRole('button', { name: /Szavazat: Igen/i })
    fireEvent.click(yesButton)

    await waitFor(() => {
      const submitButton = screen.getByRole('button', { name: /Szavazok/i })
      expect(submitButton).not.toBeDisabled()
    })
  })

  it('calls onVote when submit button is clicked', async () => {
    render(
      <VotingCard
        agendaItem={mockAgendaItem}
        member={mockMember}
        hasVoted={false}
        onVote={mockOnVote}
      />
    )

    const yesButton = screen.getByRole('button', { name: /Szavazat: Igen/i })
    fireEvent.click(yesButton)

    const submitButton = screen.getByRole('button', { name: /Szavazok/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockOnVote).toHaveBeenCalledWith('yes')
    })
  })

  it('shows success state after voting', async () => {
    render(
      <VotingCard
        agendaItem={mockAgendaItem}
        member={mockMember}
        hasVoted={false}
        onVote={mockOnVote}
      />
    )

    const yesButton = screen.getByRole('button', { name: /Szavazat: Igen/i })
    fireEvent.click(yesButton)

    const submitButton = screen.getByRole('button', { name: /Szavazok/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Szavazatod rögzítve!')).toBeInTheDocument()
    })
  })

  it('shows success state when hasVoted is true', () => {
    render(
      <VotingCard
        agendaItem={mockAgendaItem}
        member={mockMember}
        hasVoted={true}
        onVote={mockOnVote}
      />
    )

    expect(screen.getByText('Szavazatod rögzítve!')).toBeInTheDocument()
  })

  it('shows inactive state when voting is not active', () => {
    const inactiveAgenda = { ...mockAgendaItem, status: 'pending' as const }
    
    render(
      <VotingCard
        agendaItem={inactiveAgenda}
        member={mockMember}
        hasVoted={false}
        onVote={mockOnVote}
      />
    )

    expect(screen.getByText('Szavazás nem aktív')).toBeInTheDocument()
  })

  it('shows secret ballot indicator when is_secret is true', () => {
    const secretAgenda = { ...mockAgendaItem, is_secret: true }
    
    render(
      <VotingCard
        agendaItem={secretAgenda}
        member={mockMember}
        hasVoted={false}
        onVote={mockOnVote}
      />
    )

    expect(screen.getByText('Titkos')).toBeInTheDocument()
  })

  it('disables voting when disabled prop is true', () => {
    render(
      <VotingCard
        agendaItem={mockAgendaItem}
        member={mockMember}
        hasVoted={false}
        onVote={mockOnVote}
        disabled={true}
      />
    )

    const yesButton = screen.getByRole('button', { name: /Szavazat: Igen/i })
    expect(yesButton).toBeDisabled()
  })

  it('shows error message when vote fails', async () => {
    mockOnVote.mockResolvedValue(false)
    
    render(
      <VotingCard
        agendaItem={mockAgendaItem}
        member={mockMember}
        hasVoted={false}
        onVote={mockOnVote}
      />
    )

    const yesButton = screen.getByRole('button', { name: /Szavazat: Igen/i })
    fireEvent.click(yesButton)

    const submitButton = screen.getByRole('button', { name: /Szavazok/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/Hiba történt/)).toBeInTheDocument()
    })
  })

  it('handles onVote throwing an error', async () => {
    mockOnVote.mockRejectedValue(new Error('Network error'))
    
    render(
      <VotingCard
        agendaItem={mockAgendaItem}
        member={mockMember}
        hasVoted={false}
        onVote={mockOnVote}
      />
    )

    const yesButton = screen.getByRole('button', { name: /Szavazat: Igen/i })
    fireEvent.click(yesButton)

    const submitButton = screen.getByRole('button', { name: /Szavazok/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })
  })
})
