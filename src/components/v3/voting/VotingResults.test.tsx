import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { VotingResults } from './VotingResults'
import type { AgendaItem, VoteResult } from '../../../types/v3'

// Mock recharts to avoid rendering issues in tests
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}))

// Mock data
const mockAgendaItem: AgendaItem = {
  id: 'agenda-1',
  meeting_id: 'meeting-1',
  order_num: 1,
  title: 'Test Vote Result',
  description: 'This is a test',
  vote_type: 'yes_no_abstain',
  is_secret: false,
  required_majority: 'simple',
  status: 'completed',
  created_at: new Date().toISOString(),
}

const mockResultPassed: VoteResult = {
  yes: 60.5,
  no: 25.0,
  abstain: 14.5,
  total_votes: 10,
  total_weight: 100,
  passed: true,
}

const mockResultFailed: VoteResult = {
  yes: 25.0,
  no: 60.5,
  abstain: 14.5,
  total_votes: 10,
  total_weight: 100,
  passed: false,
}

describe('VotingResults', () => {
  it('renders the component with agenda item title', () => {
    render(
      <VotingResults
        agendaItem={mockAgendaItem}
        result={mockResultPassed}
      />
    )

    expect(screen.getByText('Test Vote Result')).toBeInTheDocument()
  })

  it('displays required majority info', () => {
    render(
      <VotingResults
        agendaItem={mockAgendaItem}
        result={mockResultPassed}
      />
    )

    expect(screen.getByText(/Szükséges: Egyszerű többség/)).toBeInTheDocument()
  })

  it('shows "Elfogadva" badge when vote passed', () => {
    render(
      <VotingResults
        agendaItem={mockAgendaItem}
        result={mockResultPassed}
      />
    )

    expect(screen.getByText('Elfogadva')).toBeInTheDocument()
  })

  it('shows "Elutasítva" badge when vote failed', () => {
    render(
      <VotingResults
        agendaItem={mockAgendaItem}
        result={mockResultFailed}
      />
    )

    expect(screen.getByText('Elutasítva')).toBeInTheDocument()
  })

  it('displays vote weights correctly', () => {
    render(
      <VotingResults
        agendaItem={mockAgendaItem}
        result={mockResultPassed}
      />
    )

    expect(screen.getByText('60.50')).toBeInTheDocument() // Yes votes
    expect(screen.getByText('25.00')).toBeInTheDocument() // No votes
    expect(screen.getByText('14.50')).toBeInTheDocument() // Abstain votes
  })

  it('displays vote percentages correctly', () => {
    render(
      <VotingResults
        agendaItem={mockAgendaItem}
        result={mockResultPassed}
      />
    )

    // Percentages appear multiple times (in detailed results and summary)
    expect(screen.getAllByText('60.5%').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('25.0%').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('14.5%').length).toBeGreaterThanOrEqual(1)
  })

  it('displays total votes count', () => {
    render(
      <VotingResults
        agendaItem={mockAgendaItem}
        result={mockResultPassed}
      />
    )

    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('Szavazat')).toBeInTheDocument()
  })

  it('displays total weight', () => {
    render(
      <VotingResults
        agendaItem={mockAgendaItem}
        result={mockResultPassed}
      />
    )

    expect(screen.getByText('100.00')).toBeInTheDocument()
    expect(screen.getByText('Összsúly')).toBeInTheDocument()
  })

  it('renders pie chart by default', () => {
    render(
      <VotingResults
        agendaItem={mockAgendaItem}
        result={mockResultPassed}
      />
    )

    expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
  })

  it('switches to bar chart when button is clicked', () => {
    render(
      <VotingResults
        agendaItem={mockAgendaItem}
        result={mockResultPassed}
      />
    )

    const barChartButton = screen.getByRole('button', { name: /Oszlopdiagram/i })
    fireEvent.click(barChartButton)

    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
  })

  it('switches back to pie chart', () => {
    render(
      <VotingResults
        agendaItem={mockAgendaItem}
        result={mockResultPassed}
      />
    )

    // Switch to bar
    const barChartButton = screen.getByRole('button', { name: /Oszlopdiagram/i })
    fireEvent.click(barChartButton)

    // Switch back to pie
    const pieChartButton = screen.getByRole('button', { name: /Kördiagram/i })
    fireEvent.click(pieChartButton)

    expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
  })

  it('shows loading state', () => {
    render(
      <VotingResults
        agendaItem={mockAgendaItem}
        result={null}
        loading={true}
      />
    )

    // Loading state has animated elements
    const container = document.querySelector('.animate-pulse')
    expect(container).toBeInTheDocument()
  })

  it('shows empty state when no results', () => {
    render(
      <VotingResults
        agendaItem={mockAgendaItem}
        result={null}
      />
    )

    expect(screen.getByText('Nincs eredmény')).toBeInTheDocument()
  })

  it('shows realtime indicator when showRealtime is true', () => {
    render(
      <VotingResults
        agendaItem={mockAgendaItem}
        result={mockResultPassed}
        showRealtime={true}
      />
    )

    expect(screen.getByText('Élő frissítés aktív')).toBeInTheDocument()
  })

  it('does not show abstain section when abstain is 0', () => {
    const resultNoAbstain: VoteResult = {
      ...mockResultPassed,
      abstain: 0,
    }

    render(
      <VotingResults
        agendaItem={mockAgendaItem}
        result={resultNoAbstain}
      />
    )

    expect(screen.queryByText('Tartózkodott')).not.toBeInTheDocument()
  })

  it('handles two_thirds majority label', () => {
    const twoThirdsAgenda = { ...mockAgendaItem, required_majority: 'two_thirds' as const }
    
    render(
      <VotingResults
        agendaItem={twoThirdsAgenda}
        result={mockResultPassed}
      />
    )

    expect(screen.getByText(/Kétharmados többség/)).toBeInTheDocument()
  })

  it('handles unanimous majority label', () => {
    const unanimousAgenda = { ...mockAgendaItem, required_majority: 'unanimous' as const }
    
    render(
      <VotingResults
        agendaItem={unanimousAgenda}
        result={mockResultPassed}
      />
    )

    expect(screen.getByText(/Egyhangú döntés/)).toBeInTheDocument()
  })

  it('calculates yes ratio correctly', () => {
    render(
      <VotingResults
        agendaItem={mockAgendaItem}
        result={mockResultPassed}
      />
    )

    // 60.5 / 100 = 60.5%
    expect(screen.getByText('Igen arány')).toBeInTheDocument()
    // The yes ratio is shown as the third stat
    const statCards = screen.getAllByText('60.5%')
    expect(statCards.length).toBeGreaterThanOrEqual(1)
  })

  it('handles zero total weight gracefully', () => {
    const zeroWeightResult: VoteResult = {
      yes: 0,
      no: 0,
      abstain: 0,
      total_votes: 0,
      total_weight: 0,
      passed: false,
    }

    render(
      <VotingResults
        agendaItem={mockAgendaItem}
        result={zeroWeightResult}
      />
    )

    // Should not crash and should show 0.00 (appears multiple times)
    expect(screen.getAllByText('0.00').length).toBeGreaterThanOrEqual(1)
  })
})
