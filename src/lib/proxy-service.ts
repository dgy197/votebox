/**
 * Proxy Service
 * Meghatalmazásos szavazás kezelése
 * 
 * Magyar jogi követelmények:
 * - Társasháznál 1 személy max 2 másik tulajdonost képviselhet
 * - Meghatalmazás lehet általános (minden gyűlésre) vagy specifikus (egy gyűlésre)
 * - Kötelező tartalom: meghatalmazó neve, meghatalmazott neve, érvényesség
 */

import { supabase } from './supabase'
import type { Proxy, Member } from '../types/v3'

// Hungarian legal maximum: one person can represent max 2 others in condominiums
export const MAX_PROXIES_PER_GRANTEE = 2

export interface CreateProxyInput {
  org_id: string
  grantor_id: string
  grantee_id: string
  meeting_id?: string | null  // null = general proxy for all meetings
  valid_from?: string
  valid_until?: string | null
  document_url?: string | null
}

export interface ProxyWithMembers extends Proxy {
  grantor?: Member
  grantee?: Member
}

export interface ProxyValidationResult {
  valid: boolean
  reason?: string
}

export interface ProxyStats {
  totalGranted: number      // Hány meghatalmazást adott
  totalReceived: number     // Hány meghatalmazást kapott
  totalWeight: number       // Összesített szavazati súly (saját + proxy-k)
}

/**
 * Create a new proxy (meghatalmazás létrehozása)
 */
export async function createProxy(input: CreateProxyInput): Promise<Proxy | null> {
  try {
    // Validation: grantor cannot grant to themselves
    if (input.grantor_id === input.grantee_id) {
      throw new Error('Nem adhat meghatalmazást saját magának')
    }

    // Check if grantor already has an active proxy for this meeting/general
    const existingGrantor = await getGrantedProxies(input.grantor_id, input.meeting_id)
    if (existingGrantor.length > 0) {
      throw new Error('Már adott meghatalmazást erre a gyűlésre')
    }

    // Check if grantee already has max proxies
    const granteeProxies = await getActiveProxies(input.grantee_id, input.meeting_id)
    if (granteeProxies.length >= MAX_PROXIES_PER_GRANTEE) {
      throw new Error(`Egy tag maximum ${MAX_PROXIES_PER_GRANTEE} meghatalmazást kaphat`)
    }

    // Check for circular proxy: is the grantee giving a proxy to the grantor?
    const circularCheck = await supabase
      .from('proxies')
      .select('id')
      .eq('grantor_id', input.grantee_id)
      .eq('grantee_id', input.grantor_id)
      .or(`valid_until.is.null,valid_until.gte.${new Date().toISOString()}`)
      .limit(1)

    if (circularCheck.data && circularCheck.data.length > 0) {
      throw new Error('Körkörös meghatalmazás nem engedélyezett')
    }

    const { data, error } = await supabase
      .from('proxies')
      .insert({
        org_id: input.org_id,
        grantor_id: input.grantor_id,
        grantee_id: input.grantee_id,
        meeting_id: input.meeting_id ?? null,
        valid_from: input.valid_from ?? new Date().toISOString(),
        valid_until: input.valid_until ?? null,
        document_url: input.document_url ?? null,
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (err) {
    console.error('Error creating proxy:', err)
    throw err
  }
}

/**
 * Get active proxies where member is the grantee (kiktől kapott meghatalmazást)
 * For a specific meeting, also returns general proxies that are valid
 */
export async function getActiveProxies(
  memberId: string, 
  meetingId?: string | null
): Promise<ProxyWithMembers[]> {
  try {
    const now = new Date().toISOString()
    
    let query = supabase
      .from('proxies')
      .select(`
        *,
        grantor:members!proxies_grantor_id_fkey(*),
        grantee:members!proxies_grantee_id_fkey(*)
      `)
      .eq('grantee_id', memberId)
      .lte('valid_from', now)
      .or(`valid_until.is.null,valid_until.gte.${now}`)

    // For specific meeting: include both meeting-specific AND general proxies
    if (meetingId) {
      query = query.or(`meeting_id.eq.${meetingId},meeting_id.is.null`)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as ProxyWithMembers[]
  } catch (err) {
    console.error('Error fetching active proxies:', err)
    return []
  }
}

/**
 * Get proxies granted by a member (kiknek adott meghatalmazást)
 */
export async function getGrantedProxies(
  memberId: string,
  meetingId?: string | null
): Promise<ProxyWithMembers[]> {
  try {
    const now = new Date().toISOString()
    
    let query = supabase
      .from('proxies')
      .select(`
        *,
        grantor:members!proxies_grantor_id_fkey(*),
        grantee:members!proxies_grantee_id_fkey(*)
      `)
      .eq('grantor_id', memberId)
      .lte('valid_from', now)
      .or(`valid_until.is.null,valid_until.gte.${now}`)

    if (meetingId) {
      query = query.or(`meeting_id.eq.${meetingId},meeting_id.is.null`)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as ProxyWithMembers[]
  } catch (err) {
    console.error('Error fetching granted proxies:', err)
    return []
  }
}

/**
 * Get all proxies for an organization
 */
export async function getOrgProxies(
  orgId: string,
  meetingId?: string | null,
  includeExpired = false
): Promise<ProxyWithMembers[]> {
  try {
    const now = new Date().toISOString()
    
    let query = supabase
      .from('proxies')
      .select(`
        *,
        grantor:members!proxies_grantor_id_fkey(*),
        grantee:members!proxies_grantee_id_fkey(*)
      `)
      .eq('org_id', orgId)

    if (!includeExpired) {
      query = query
        .lte('valid_from', now)
        .or(`valid_until.is.null,valid_until.gte.${now}`)
    }

    if (meetingId) {
      query = query.or(`meeting_id.eq.${meetingId},meeting_id.is.null`)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as ProxyWithMembers[]
  } catch (err) {
    console.error('Error fetching org proxies:', err)
    return []
  }
}

/**
 * Validate if a proxy is still valid
 */
export async function validateProxy(proxyId: string): Promise<ProxyValidationResult> {
  try {
    const { data, error } = await supabase
      .from('proxies')
      .select('*')
      .eq('id', proxyId)
      .single()

    if (error || !data) {
      return { valid: false, reason: 'Meghatalmazás nem található' }
    }

    const now = new Date()
    const validFrom = new Date(data.valid_from)
    const validUntil = data.valid_until ? new Date(data.valid_until) : null

    if (now < validFrom) {
      return { valid: false, reason: 'Meghatalmazás még nem érvényes' }
    }

    if (validUntil && now > validUntil) {
      return { valid: false, reason: 'Meghatalmazás lejárt' }
    }

    return { valid: true }
  } catch (err) {
    console.error('Error validating proxy:', err)
    return { valid: false, reason: 'Hiba a validálásnál' }
  }
}

/**
 * Revoke a proxy (meghatalmazás visszavonása)
 */
export async function revokeProxy(proxyId: string): Promise<boolean> {
  try {
    // Set valid_until to now to "expire" the proxy
    const { error } = await supabase
      .from('proxies')
      .update({ valid_until: new Date().toISOString() })
      .eq('id', proxyId)

    if (error) throw error
    return true
  } catch (err) {
    console.error('Error revoking proxy:', err)
    return false
  }
}

/**
 * Delete a proxy permanently
 */
export async function deleteProxy(proxyId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('proxies')
      .delete()
      .eq('id', proxyId)

    if (error) throw error
    return true
  } catch (err) {
    console.error('Error deleting proxy:', err)
    return false
  }
}

/**
 * Get proxy statistics for a member
 */
export async function getProxyStats(
  memberId: string,
  memberWeight: number,
  meetingId?: string | null
): Promise<ProxyStats> {
  const granted = await getGrantedProxies(memberId, meetingId)
  const received = await getActiveProxies(memberId, meetingId)
  
  // Calculate total weight from received proxies
  const proxyWeight = received.reduce((sum, proxy) => {
    return sum + (proxy.grantor?.weight || 0)
  }, 0)

  return {
    totalGranted: granted.length,
    totalReceived: received.length,
    totalWeight: memberWeight + proxyWeight,
  }
}

/**
 * Calculate effective voting weight for a member including proxies
 */
export async function getEffectiveVotingWeight(
  memberId: string,
  memberWeight: number,
  meetingId?: string | null
): Promise<number> {
  const stats = await getProxyStats(memberId, memberWeight, meetingId)
  return stats.totalWeight
}

/**
 * Check if a member can give proxy (hasn't already given one)
 */
export async function canGrantProxy(
  memberId: string,
  meetingId?: string | null
): Promise<boolean> {
  const existing = await getGrantedProxies(memberId, meetingId)
  return existing.length === 0
}

/**
 * Check if a member can receive more proxies
 */
export async function canReceiveProxy(
  memberId: string,
  meetingId?: string | null
): Promise<boolean> {
  const existing = await getActiveProxies(memberId, meetingId)
  return existing.length < MAX_PROXIES_PER_GRANTEE
}

/**
 * Upload proxy document
 */
export async function uploadProxyDocument(
  file: File,
  orgId: string,
  proxyId: string
): Promise<string | null> {
  try {
    const ext = file.name.split('.').pop()
    const fileName = `${orgId}/${proxyId}.${ext}`

    const { data, error } = await supabase.storage
      .from('proxy-documents')
      .upload(fileName, file, {
        upsert: true,
        contentType: file.type,
      })

    if (error) throw error

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('proxy-documents')
      .getPublicUrl(data.path)

    // Update proxy with document URL
    await supabase
      .from('proxies')
      .update({ document_url: urlData.publicUrl })
      .eq('id', proxyId)

    return urlData.publicUrl
  } catch (err) {
    console.error('Error uploading proxy document:', err)
    return null
  }
}

// Default export for convenience
export default {
  createProxy,
  getActiveProxies,
  getGrantedProxies,
  getOrgProxies,
  validateProxy,
  revokeProxy,
  deleteProxy,
  getProxyStats,
  getEffectiveVotingWeight,
  canGrantProxy,
  canReceiveProxy,
  uploadProxyDocument,
  MAX_PROXIES_PER_GRANTEE,
}
