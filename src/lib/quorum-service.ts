/**
 * Quorum Service
 * Quorum számítás meghatalmazások figyelembe vételével
 * 
 * A meghatalmazott tag súlya = saját súly + proxy súlyok összege
 * Magyar jog: egy tag maximum MAX_PROXIES_PER_GRANTEE proxy-t kaphat
 */

import { supabase } from './supabase'
import { getActiveProxies, type ProxyWithMembers } from './proxy-service'
import type { Member, Attendance, QuorumResult } from '../types/v3'

export interface QuorumWithProxies extends QuorumResult {
  // Additional info
  present_members: number
  total_members: number
  proxy_weight: number
  effective_present_weight: number  // Present weight including proxies
}

/**
 * Calculate effective weight for a member including their proxies
 */
export async function calculateEffectiveWeight(
  memberId: string,
  memberWeight: number,
  meetingId: string
): Promise<number> {
  const proxies = await getActiveProxies(memberId, meetingId)
  
  const proxyWeight = proxies.reduce((sum, proxy) => {
    return sum + (proxy.grantor?.weight || 0)
  }, 0)

  return memberWeight + proxyWeight
}

/**
 * Calculate quorum with proxy support
 * Includes weight from proxies when the grantee is present
 */
export async function calculateQuorumWithProxies(
  meetingId: string,
  orgId: string,
  members: Member[],
  attendance: Attendance[],
  quorumPercentage: number
): Promise<QuorumWithProxies> {
  // Get all active proxies for this meeting
  const { data: proxies } = await supabase
    .from('proxies')
    .select(`
      *,
      grantor:members!proxies_grantor_id_fkey(id, weight),
      grantee:members!proxies_grantee_id_fkey(id, weight)
    `)
    .eq('org_id', orgId)
    .or(`meeting_id.eq.${meetingId},meeting_id.is.null`)
    .lte('valid_from', new Date().toISOString())
    .or(`valid_until.is.null,valid_until.gte.${new Date().toISOString()}`)

  // Create sets for quick lookup
  const presentMemberIds = new Set(
    attendance
      .filter(a => !a.checked_out_at) // Only count those who haven't checked out
      .map(a => a.member_id)
  )

  // Calculate total weight (all active voters)
  const activeVoters = members.filter(m => m.is_active && m.role !== 'observer')
  const totalWeight = activeVoters.reduce((sum, m) => sum + m.weight, 0)
  const totalMembers = activeVoters.length

  // Calculate present weight (members who are actually present)
  const presentMembers = activeVoters.filter(m => presentMemberIds.has(m.id))
  const directPresentWeight = presentMembers.reduce((sum, m) => sum + m.weight, 0)

  // Calculate proxy weight that counts toward quorum
  // A proxy counts if: the GRANTEE is present AND the GRANTOR is NOT present
  let proxyWeight = 0
  
  if (proxies) {
    for (const proxy of proxies) {
      const granteePresent = presentMemberIds.has(proxy.grantee_id)
      const grantorPresent = presentMemberIds.has(proxy.grantor_id)
      
      // Only count proxy weight if grantee is present and grantor is NOT
      // (If grantor is present, they vote for themselves)
      if (granteePresent && !grantorPresent) {
        const grantorWeight = (proxy.grantor as { weight: number })?.weight || 0
        proxyWeight += grantorWeight
      }
    }
  }

  // Effective present weight = direct + proxy
  const effectivePresentWeight = directPresentWeight + proxyWeight

  // Calculate percentage
  const percentage = totalWeight > 0 
    ? (effectivePresentWeight / totalWeight) * 100 
    : 0

  // Check if quorum reached
  const reached = percentage >= quorumPercentage

  return {
    total_weight: totalWeight,
    present_weight: directPresentWeight,
    quorum_percentage: percentage,
    quorum_reached: reached,
    present_members: presentMembers.length,
    total_members: totalMembers,
    proxy_weight: proxyWeight,
    effective_present_weight: effectivePresentWeight,
  }
}

/**
 * Get detailed proxy representation for a meeting
 * Shows who represents whom
 */
export async function getProxyRepresentation(
  meetingId: string,
  orgId: string
): Promise<Map<string, { grantor: Member; grantee: Member; weight: number }[]>> {
  const representation = new Map<string, { grantor: Member; grantee: Member; weight: number }[]>()

  const { data: proxies } = await supabase
    .from('proxies')
    .select(`
      *,
      grantor:members!proxies_grantor_id_fkey(*),
      grantee:members!proxies_grantee_id_fkey(*)
    `)
    .eq('org_id', orgId)
    .or(`meeting_id.eq.${meetingId},meeting_id.is.null`)
    .lte('valid_from', new Date().toISOString())
    .or(`valid_until.is.null,valid_until.gte.${new Date().toISOString()}`)

  if (proxies) {
    for (const proxy of proxies as ProxyWithMembers[]) {
      if (proxy.grantee && proxy.grantor) {
        const granteeId = proxy.grantee_id
        const existing = representation.get(granteeId) || []
        existing.push({
          grantor: proxy.grantor,
          grantee: proxy.grantee,
          weight: proxy.grantor.weight,
        })
        representation.set(granteeId, existing)
      }
    }
  }

  return representation
}

/**
 * Get members that a specific member represents (via proxy)
 */
export async function getRepresentedMembers(
  memberId: string,
  meetingId: string
): Promise<Member[]> {
  const proxies = await getActiveProxies(memberId, meetingId)
  return proxies
    .filter(p => p.grantor)
    .map(p => p.grantor as Member)
}

/**
 * Check if a member is represented by someone else (has granted proxy)
 */
export async function isRepresented(
  memberId: string,
  meetingId: string
): Promise<{ represented: boolean; by?: Member }> {
  const { data } = await supabase
    .from('proxies')
    .select(`
      *,
      grantee:members!proxies_grantee_id_fkey(*)
    `)
    .eq('grantor_id', memberId)
    .or(`meeting_id.eq.${meetingId},meeting_id.is.null`)
    .lte('valid_from', new Date().toISOString())
    .or(`valid_until.is.null,valid_until.gte.${new Date().toISOString()}`)
    .limit(1)

  if (data && data.length > 0) {
    return {
      represented: true,
      by: data[0].grantee as Member,
    }
  }

  return { represented: false }
}

export default {
  calculateEffectiveWeight,
  calculateQuorumWithProxies,
  getProxyRepresentation,
  getRepresentedMembers,
  isRepresented,
}
