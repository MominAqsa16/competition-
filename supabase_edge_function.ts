/**
 * SUPABASE EDGE FUNCTION: send-whatsapp-confirmation
 * Runtime: Deno / Supabase Edge Functions
 * 
 * Invoked ONLY when an organizer verifies a student's payment.
 * Security: Uses WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID stored
 * exclusively in Supabase Secrets (Environment variables). Never exposed to frontend!
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyPayload {
  registration_id: string;
  student_name: string;
  whatsapp_number: string;
  category_name: string;
  drawing_group?: string | null;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const waToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN') ?? '';
    const waPhoneId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID') ?? '';

    // Verify Server Secrets
    if (!waToken || !waPhoneId) {
      console.warn('WhatsApp API credentials not fully configured in Supabase Secrets.');
      return new Response(
        JSON.stringify({
          error: 'WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID missing in backend secrets.',
          status: 'secrets_missing'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body: VerifyPayload = await req.json();

    if (!body.registration_id || !body.whatsapp_number) {
      return new Response(
        JSON.stringify({ error: 'Missing registration_id or whatsapp_number in payload' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // 1. Fetch Event Settings from database
    const { data: settings } = await supabase
      .from('event_settings')
      .select('event_description, whatsapp_community_link, wa_template_name')
      .eq('id', 'current_event')
      .single();

    const communityLink = settings?.whatsapp_community_link || 'https://chat.whatsapp.com/Gxyz123TalentComp2026';
    const eventDesc = settings?.event_description || 'Student Talent Competition 2026 takes place on Sunday, Nov 15th at City Central Auditorium.';
    const templateName = settings?.wa_template_name || 'student_competition_confirmed';

    // Format Competition Name including Group
    const compName = body.drawing_group 
      ? `${body.category_name} (${body.drawing_group})` 
      : body.category_name;

    // Clean Phone Number (must be E.164 format without '+' or spaces, e.g. 919876543210)
    const cleanPhone = body.whatsapp_number.replace(/[^0-9]/g, '');

    // 2. Prepare Official Meta WhatsApp Business Cloud API Payload
    // Using official template structure (preferred by WhatsApp Business Platform)
    const waApiUrl = `https://graph.facebook.com/v21.0/${waPhoneId}/messages`;

    const waPayload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: cleanPhone,
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'en' },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: body.student_name },           // {{1}} Student Name
              { type: 'text', text: body.registration_id },       // {{2}} Registration ID
              { type: 'text', text: compName },                   // {{3}} Competition Name
              { type: 'text', text: eventDesc },                  // {{4}} Event Description
              { type: 'text', text: communityLink }               // {{5}} Community Invite Link
            ]
          }
        ]
      }
    };

    console.log(`Sending WhatsApp confirmation to ${cleanPhone} for Reg: ${body.registration_id}...`);

    // 3. Make HTTP request to Meta Graph API
    const response = await fetch(waApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${waToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(waPayload)
    });

    const resJson = await response.json();

    if (!response.ok) {
      console.error('WhatsApp Cloud API Error:', resJson);
      return new Response(
        JSON.stringify({ error: 'Failed to send WhatsApp message via Meta API', details: resJson }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
      );
    }

    // 4. Update Database record to mark whatsapp_sent = true
    await supabase
      .from('student_registrations')
      .update({ whatsapp_sent: true })
      .eq('registration_id', body.registration_id);

    return new Response(
      JSON.stringify({
        success: true,
        message_id: resJson?.messages?.[0]?.id,
        recipient: cleanPhone,
        status: 'delivered'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (err) {
    console.error('Edge Function Exception:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Internal Server Error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
