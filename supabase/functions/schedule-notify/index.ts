// VoteBox 3.0 - Schedule Notification Edge Function
// Sends email notifications for schedule-related events

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationPayload {
  type: 'schedule_created' | 'schedule_reminder' | 'schedule_winner_selected' | 'schedule_vote_reminder'
  meetingId: string
  recipientEmails?: string[]
  data?: Record<string, unknown>
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const payload: NotificationPayload = await req.json()
    const { type, meetingId, recipientEmails, data } = payload

    // Fetch meeting details
    const { data: meeting, error: meetingError } = await supabaseClient
      .from('meetings')
      .select(`
        *,
        organizations (name),
        schedule_options (*)
      `)
      .eq('id', meetingId)
      .single()

    if (meetingError) throw meetingError

    // Fetch recipients if not specified
    let recipients = recipientEmails || []
    if (recipients.length === 0) {
      const { data: members } = await supabaseClient
        .from('members')
        .select('email, name')
        .eq('org_id', meeting.org_id)
        .neq('role', 'observer')
        .not('email', 'is', null)

      recipients = members?.map(m => m.email).filter(Boolean) || []
    }

    // Generate email content based on type
    let subject = ''
    let body = ''

    switch (type) {
      case 'schedule_created':
        subject = `[${meeting.organizations.name}] Időpont egyeztetés: ${meeting.title}`
        body = `
          <h2>Időpont egyeztetés indult!</h2>
          <p>Gyűlés: <strong>${meeting.title}</strong></p>
          <p>Szervezet: ${meeting.organizations.name}</p>
          <p>Kérjük, jelölje be az Önnek megfelelő időpontokat.</p>
          <p><a href="${data?.votingUrl || '#'}">Szavazás megnyitása</a></p>
        `
        break

      case 'schedule_reminder':
        subject = `[Emlékeztető] Időpont egyeztetés: ${meeting.title}`
        body = `
          <h2>Emlékeztető</h2>
          <p>Még nem szavazott az időpont egyeztetésben!</p>
          <p>Gyűlés: <strong>${meeting.title}</strong></p>
          <p><a href="${data?.votingUrl || '#'}">Szavazás megnyitása</a></p>
        `
        break

      case 'schedule_winner_selected':
        const winnerOption = meeting.schedule_options?.find((o: { is_winner: boolean }) => o.is_winner)
        const winnerDate = winnerOption 
          ? new Date(winnerOption.datetime).toLocaleString('hu-HU', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : 'TBD'

        subject = `[${meeting.organizations.name}] Gyűlés időpontja: ${meeting.title}`
        body = `
          <h2>Gyűlés időpontja kiválasztva!</h2>
          <p>Gyűlés: <strong>${meeting.title}</strong></p>
          <p>Időpont: <strong>${winnerDate}</strong></p>
          ${meeting.location ? `<p>Helyszín: ${meeting.location}</p>` : ''}
          ${meeting.meeting_url ? `<p>Online link: <a href="${meeting.meeting_url}">${meeting.meeting_url}</a></p>` : ''}
          <p>Kérjük, jegyezze fel a dátumot!</p>
        `
        break

      case 'schedule_vote_reminder':
        subject = `[Utolsó nap] Szavazás: ${meeting.title}`
        body = `
          <h2>Ma lejár a szavazási határidő!</h2>
          <p>Gyűlés: <strong>${meeting.title}</strong></p>
          <p>Kérjük, még ma adja le szavazatát.</p>
          <p><a href="${data?.votingUrl || '#'}">Szavazás megnyitása</a></p>
        `
        break
    }

    // TODO: Integrate with actual email provider (Resend, SendGrid, etc.)
    // For now, just log the email details
    console.log('Would send email:', {
      to: recipients,
      subject,
      html: body,
    })

    // Log to audit
    await supabaseClient
      .from('audit_log')
      .insert({
        org_id: meeting.org_id,
        action: `schedule_notification_${type}`,
        entity_type: 'meeting',
        entity_id: meetingId,
        details: {
          type,
          recipient_count: recipients.length,
          subject,
        },
      })

    return new Response(
      JSON.stringify({
        success: true,
        message: `Notification queued for ${recipients.length} recipients`,
        type,
        recipients: recipients.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in schedule-notify:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
