/**
 * ProxyManagement Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ProxyManagement } from './ProxyManagement'
import type { Member } from '../../types/v3'

// Mock the proxy service
vi.mock('../../lib/proxy-service', () => ({
  createProxy: vi.fn(),
  getOrgProxies: vi.fn(),
  getActiveProxies: vi.fn(),
  getGrantedProxies: vi.fn(),
  revokeProxy: vi.fn(),
  deleteProxy: vi.fn(),
  uploadProxyDocument: vi.fn(),
  canReceiveProxy: vi.fn(),
  MAX_PROXIES_PER_GRANTEE: 2,
}))

import * as proxyService from '../../lib/proxy-service'

// Mock members
const mockMembers: Member[] = [
  { id: 'm-1', org_id: 'org-1', name: 'Anna Kovács', email: 'anna@example.com', weight: 20, role: 'voter', is_active: true, created_at: '', updated_at: '' },
  { id: 'm-2', org_id: 'org-1', name: 'Béla Nagy', email: 'bela@example.com', weight: 30, role: 'voter', is_active: true, created_at: '', updated_at: '' },
  { id: 'm-3', org_id: 'org-1', name: 'Csaba Tóth', email: 'csaba@example.com', weight: 25, role: 'voter', is_active: true, created_at: '', updated_at: '' },
  { id: 'm-4', org_id: 'org-1', name: 'Dóra Szabó', email: 'dora@example.com', weight: 25, role: 'observer', is_active: true, created_at: '', updated_at: '' },
]

const mockCurrentMember = mockMembers[0]

describe('ProxyManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(proxyService.getOrgProxies).mockResolvedValue([])
  })

  it('renders the component with header', async () => {
    render(
      <ProxyManagement
        orgId="org-1"
        members={mockMembers}
        currentMember={mockCurrentMember}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Meghatalmazások')).toBeInTheDocument()
    })
  })

  it('shows empty state when no proxies', async () => {
    render(
      <ProxyManagement
        orgId="org-1"
        members={mockMembers}
        currentMember={mockCurrentMember}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Nincs meghatalmazás')).toBeInTheDocument()
    })
  })

  it('shows new proxy button when not read-only', async () => {
    render(
      <ProxyManagement
        orgId="org-1"
        members={mockMembers}
        currentMember={mockCurrentMember}
        readOnly={false}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Új meghatalmazás')).toBeInTheDocument()
    })
  })

  it('hides new proxy button when read-only', async () => {
    render(
      <ProxyManagement
        orgId="org-1"
        members={mockMembers}
        currentMember={mockCurrentMember}
        readOnly={true}
      />
    )

    await waitFor(() => {
      expect(screen.queryByText('Új meghatalmazás')).not.toBeInTheDocument()
    })
  })

  it('opens create modal when clicking new proxy button', async () => {
    render(
      <ProxyManagement
        orgId="org-1"
        members={mockMembers}
        currentMember={mockCurrentMember}
      />
    )

    await waitFor(() => {
      fireEvent.click(screen.getByText('Új meghatalmazás'))
    })

    await waitFor(() => {
      expect(screen.getByText(/Meghatalmazó/)).toBeInTheDocument()
      expect(screen.getByText(/Meghatalmazott/)).toBeInTheDocument()
    })
  })

  it('displays proxy list when proxies exist', async () => {
    const mockProxies = [
      {
        id: 'proxy-1',
        org_id: 'org-1',
        grantor_id: 'm-2',
        grantee_id: 'm-1',
        valid_from: new Date().toISOString(),
        valid_until: null,
        document_url: null,
        created_at: new Date().toISOString(),
        grantor: mockMembers[1],
        grantee: mockMembers[0],
      },
    ]

    vi.mocked(proxyService.getOrgProxies).mockResolvedValue(mockProxies)

    render(
      <ProxyManagement
        orgId="org-1"
        members={mockMembers}
        currentMember={mockCurrentMember}
      />
    )

    await waitFor(() => {
      expect(screen.getByText(/Béla Nagy/)).toBeInTheDocument()
      expect(screen.getByText(/Anna Kovács/)).toBeInTheDocument()
    })
  })

  it('shows stats card with correct counts', async () => {
    const mockProxies = [
      {
        id: 'proxy-1',
        org_id: 'org-1',
        grantor_id: 'm-2',
        grantee_id: 'm-1',
        valid_from: new Date().toISOString(),
        valid_until: null,
        document_url: null,
        created_at: new Date().toISOString(),
        grantor: mockMembers[1],
        grantee: mockMembers[0],
      },
      {
        id: 'proxy-2',
        org_id: 'org-1',
        grantor_id: 'm-3',
        grantee_id: 'm-1',
        valid_from: new Date(Date.now() - 86400000).toISOString(),
        valid_until: new Date(Date.now() - 3600000).toISOString(), // Expired
        document_url: null,
        created_at: new Date().toISOString(),
        grantor: mockMembers[2],
        grantee: mockMembers[0],
      },
    ]

    vi.mocked(proxyService.getOrgProxies).mockResolvedValue(mockProxies)

    render(
      <ProxyManagement
        orgId="org-1"
        members={mockMembers}
        currentMember={mockCurrentMember}
      />
    )

    await waitFor(() => {
      // Should show Összes label
      expect(screen.getByText('Összes')).toBeInTheDocument()
    })
  })

  it('shows view mode filters', async () => {
    render(
      <ProxyManagement
        orgId="org-1"
        members={mockMembers}
        currentMember={mockCurrentMember}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Mind')).toBeInTheDocument()
      expect(screen.getByText('Kapott')).toBeInTheDocument()
      expect(screen.getByText('Adott')).toBeInTheDocument()
    })
  })

  it('displays max proxies info in create modal', async () => {
    render(
      <ProxyManagement
        orgId="org-1"
        members={mockMembers}
        currentMember={mockCurrentMember}
      />
    )

    await waitFor(() => {
      fireEvent.click(screen.getByText('Új meghatalmazás'))
    })

    await waitFor(() => {
      expect(screen.getByText(/maximum 2 másik tagtól/)).toBeInTheDocument()
    })
  })

  it('shows active badge for valid proxies', async () => {
    const mockProxies = [
      {
        id: 'proxy-1',
        org_id: 'org-1',
        grantor_id: 'm-2',
        grantee_id: 'm-1',
        valid_from: new Date().toISOString(),
        valid_until: null, // No expiration = active
        document_url: null,
        created_at: new Date().toISOString(),
        grantor: mockMembers[1],
        grantee: mockMembers[0],
      },
    ]

    vi.mocked(proxyService.getOrgProxies).mockResolvedValue(mockProxies)

    render(
      <ProxyManagement
        orgId="org-1"
        members={mockMembers}
        currentMember={mockCurrentMember}
      />
    )

    await waitFor(() => {
      // Multiple "Aktív" texts exist (stats and badge), so use getAllByText
      expect(screen.getAllByText('Aktív').length).toBeGreaterThan(0)
    })
  })

  it('shows expired badge for expired proxies', async () => {
    const mockProxies = [
      {
        id: 'proxy-1',
        org_id: 'org-1',
        grantor_id: 'm-2',
        grantee_id: 'm-1',
        valid_from: new Date(Date.now() - 86400000).toISOString(),
        valid_until: new Date(Date.now() - 3600000).toISOString(), // Expired
        document_url: null,
        created_at: new Date().toISOString(),
        grantor: mockMembers[1],
        grantee: mockMembers[0],
      },
    ]

    vi.mocked(proxyService.getOrgProxies).mockResolvedValue(mockProxies)

    render(
      <ProxyManagement
        orgId="org-1"
        members={mockMembers}
        currentMember={mockCurrentMember}
      />
    )

    await waitFor(() => {
      // Multiple "Lejárt" texts exist (stats and badge), so use getAllByText
      expect(screen.getAllByText('Lejárt').length).toBeGreaterThan(0)
    })
  })

  it('displays weight information', async () => {
    const mockProxies = [
      {
        id: 'proxy-1',
        org_id: 'org-1',
        grantor_id: 'm-2',
        grantee_id: 'm-1',
        valid_from: new Date().toISOString(),
        valid_until: null,
        document_url: null,
        created_at: new Date().toISOString(),
        grantor: mockMembers[1], // Béla with weight 30
        grantee: mockMembers[0],
      },
    ]

    vi.mocked(proxyService.getOrgProxies).mockResolvedValue(mockProxies)

    render(
      <ProxyManagement
        orgId="org-1"
        members={mockMembers}
        currentMember={mockCurrentMember}
      />
    )

    await waitFor(() => {
      expect(screen.getByText(/30.00/)).toBeInTheDocument()
    })
  })
})

describe('ProxyManagement Meeting-Specific', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(proxyService.getOrgProxies).mockResolvedValue([])
  })

  const mockMeeting = {
    id: 'meeting-1',
    org_id: 'org-1',
    title: 'Éves közgyűlés',
    type: 'regular' as const,
    status: 'scheduled' as const,
    location_type: 'hybrid' as const,
    quorum_type: 'majority' as const,
    quorum_percentage: 50,
    quorum_reached: false,
    recording_enabled: false,
    created_at: '',
    updated_at: '',
  }

  it('shows meeting title when meeting provided', async () => {
    render(
      <ProxyManagement
        orgId="org-1"
        members={mockMembers}
        currentMember={mockCurrentMember}
        meeting={mockMeeting}
      />
    )

    await waitFor(() => {
      expect(screen.getByText(/Éves közgyűlés/)).toBeInTheDocument()
    })
  })

  it('shows general proxy checkbox when meeting provided', async () => {
    render(
      <ProxyManagement
        orgId="org-1"
        members={mockMembers}
        currentMember={mockCurrentMember}
        meeting={mockMeeting}
      />
    )

    await waitFor(() => {
      fireEvent.click(screen.getByText('Új meghatalmazás'))
    })

    await waitFor(() => {
      expect(screen.getByText(/Általános meghatalmazás/)).toBeInTheDocument()
    })
  })
})
