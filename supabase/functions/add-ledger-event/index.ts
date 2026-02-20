import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VALID_ACTIONS = ['AMENDED', 'SHIPPED', 'RECEIVED', 'PAID', 'CANCELLED'];

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user's auth
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify JWT and get user
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error('Auth error:', claimsError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;

    // Get user role
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (roleError || !roleData) {
      console.error('Role fetch error:', roleError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify user role' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Only bank and admin can add lifecycle events
    if (!['bank', 'admin'].includes(roleData.role)) {
      return new Response(
        JSON.stringify({ error: 'Only bank and admin users can add ledger events' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body = await req.json();
    const { document_id, action, metadata = {} } = body;

    // Validate required fields
    if (!document_id || !action) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: document_id, action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate action type
    if (!VALID_ACTIONS.includes(action)) {
      return new Response(
        JSON.stringify({ error: `Invalid action. Must be one of: ${VALID_ACTIONS.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify document exists
    const { data: documentData, error: documentError } = await supabase
      .from('documents')
      .select('id')
      .eq('id', document_id)
      .single();

    if (documentError || !documentData) {
      return new Response(
        JSON.stringify({ error: 'Document not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert ledger entry
    const { data: entryData, error: entryError } = await supabase
      .from('ledger_entries')
      .insert({
        document_id,
        action,
        actor_id: userId,
        metadata
      })
      .select()
      .single();

    if (entryError) {
      console.error('Ledger insert error:', entryError);
      return new Response(
        JSON.stringify({ error: 'Failed to create ledger entry' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Ledger event ${action} added for document ${document_id} by user ${userId}`);

    // Trigger risk recalculation for document owner
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: docOwner } = await serviceClient
      .from('documents')
      .select('owner_id')
      .eq('id', document_id)
      .single();

    if (docOwner) {
      try {
        await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/calculate-risk`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ user_id: docOwner.owner_id, trigger: 'ledger_event' })
        });
      } catch (e) {
        console.error('Risk recalc error:', e);
      }
    }

    // Log admin audit if admin user
    const { data: actorRole } = await serviceClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (actorRole?.role === 'admin') {
      await serviceClient.from('audit_logs').insert({
        admin_id: userId,
        action: 'ADD_LEDGER_EVENT',
        target_type: 'document',
        target_id: document_id,
        metadata: { ledger_action: action, metadata }
      });
    }

    return new Response(
      JSON.stringify({ success: true, entry: entryData }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
