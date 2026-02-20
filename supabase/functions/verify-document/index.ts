import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function hashFile(fileBuffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', fileBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

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

    // Only auditor and admin can verify documents
    if (!['auditor', 'admin'].includes(roleData.role)) {
      return new Response(
        JSON.stringify({ error: 'Only auditor and admin users can verify documents' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body = await req.json();
    const { document_id } = body;

    if (!document_id) {
      return new Response(
        JSON.stringify({ error: 'document_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get document details
    const { data: documentData, error: documentError } = await supabase
      .from('documents')
      .select('id, file_url, hash')
      .eq('id', document_id)
      .single();

    if (documentError || !documentData) {
      console.error('Document fetch error:', documentError);
      return new Response(
        JSON.stringify({ error: 'Document not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create service client for storage access
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Extract storage path from file_url
    const fileUrl = documentData.file_url;
    const bucketName = 'trade-documents';
    const pathMatch = fileUrl.match(/trade-documents\/(.+)$/);
    
    if (!pathMatch) {
      return new Response(
        JSON.stringify({ error: 'Invalid file URL format' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const filePath = pathMatch[1];

    // Download the file
    const { data: fileData, error: downloadError } = await serviceClient.storage
      .from(bucketName)
      .download(filePath);

    if (downloadError || !fileData) {
      console.error('File download error:', downloadError);
      return new Response(
        JSON.stringify({ error: 'Failed to download document for verification' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Recompute SHA-256 hash
    const fileBuffer = await fileData.arrayBuffer();
    const recomputedHash = await hashFile(fileBuffer);

    // Compare hashes
    const storedHash = documentData.hash;
    const verificationResult = recomputedHash === storedHash;

    console.log(`Verification for document ${document_id}: ${verificationResult ? 'PASSED' : 'FAILED'}`);
    console.log(`Stored hash: ${storedHash}`);
    console.log(`Recomputed hash: ${recomputedHash}`);

    // Record verification as ledger entry
    const { data: entryData, error: entryError } = await supabase
      .from('ledger_entries')
      .insert({
        document_id,
        action: 'VERIFIED',
        actor_id: userId,
        metadata: {
          verification_result: verificationResult,
          stored_hash: storedHash,
          recomputed_hash: recomputedHash,
          verified_at: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (entryError) {
      console.error('Ledger insert error:', entryError);
      return new Response(
        JSON.stringify({ error: 'Failed to record verification in ledger' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Trigger risk recalculation for document owner
    const { data: docOwnerData } = await serviceClient
      .from('documents')
      .select('owner_id')
      .eq('id', document_id)
      .single();

    if (docOwnerData) {
      try {
        await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/calculate-risk`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ user_id: docOwnerData.owner_id, trigger: 'verification' })
        });
      } catch (e) {
        console.error('Risk recalc error:', e);
      }
    }

    // Log admin audit if admin
    const { data: actorRoleData } = await serviceClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (actorRoleData?.role === 'admin') {
      await serviceClient.from('audit_logs').insert({
        admin_id: userId,
        action: 'VERIFY_DOCUMENT',
        target_type: 'document',
        target_id: document_id,
        metadata: { verification_result: verificationResult }
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        verification_result: verificationResult,
        stored_hash: storedHash,
        recomputed_hash: recomputedHash,
        ledger_entry: entryData
      }),
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
