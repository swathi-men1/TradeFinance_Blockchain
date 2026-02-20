import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
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

    // Get document ID from URL
    const url = new URL(req.url);
    const documentId = url.searchParams.get('document_id');
    
    if (!documentId) {
      return new Response(
        JSON.stringify({ error: 'document_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

    // Check document access based on role
    const { data: documentData, error: documentError } = await supabase
      .from('documents')
      .select('id, owner_id')
      .eq('id', documentId)
      .single();

    if (documentError || !documentData) {
      console.error('Document fetch error:', documentError);
      return new Response(
        JSON.stringify({ error: 'Document not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Enforce access control
    if (roleData.role === 'corporate' && documentData.owner_id !== userId) {
      return new Response(
        JSON.stringify({ error: 'Access denied' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch ledger entries for document - RLS will filter
    const { data: ledgerEntries, error: ledgerError } = await supabase
      .from('ledger_entries')
      .select('id, action, actor_id, metadata, created_at')
      .eq('document_id', documentId)
      .order('created_at', { ascending: true });

    if (ledgerError) {
      console.error('Ledger fetch error:', ledgerError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch ledger entries' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get actor profiles for display names
    const actorIds = [...new Set(ledgerEntries?.map(e => e.actor_id) || [])];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, org_name')
      .in('id', actorIds);

    // Map profiles to entries
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
    const entriesWithActors = ledgerEntries?.map(entry => ({
      ...entry,
      actor: profileMap.get(entry.actor_id) || { name: 'Unknown', org_name: '' }
    }));

    console.log(`Returning ${entriesWithActors?.length || 0} ledger entries for document ${documentId}`);

    return new Response(
      JSON.stringify({ entries: entriesWithActors || [] }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
