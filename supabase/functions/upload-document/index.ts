import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getSystemUserId(client: ReturnType<typeof createClient>): Promise<string> {
  const { data } = await client.from('profiles').select('id').eq('name', 'System').eq('org_name', 'Internal').limit(1).single();
  return data?.id || 'unknown';
}

async function hashFile(fileBuffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', fileBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Check user role - only corporate can upload
    const { data: roleData, error: roleError } = await serviceClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: 'Failed to verify user role' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (roleData.role !== 'corporate') {
      return new Response(
        JSON.stringify({ error: 'Only corporate users can upload documents' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const docType = formData.get('doc_type') as string;
    const docNumber = formData.get('doc_number') as string;
    const issuedAt = formData.get('issued_at') as string;
    const transactionId = formData.get('transaction_id') as string | null;

    // Validate required fields
    if (!file || !docType || !docNumber || !issuedAt) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: file, doc_type, doc_number, issued_at' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate doc_type
    const validDocTypes = ['LOC', 'INVOICE', 'BILL_OF_LADING', 'PO', 'COO', 'INSURANCE_CERT'];
    if (!validDocTypes.includes(docType)) {
      return new Response(
        JSON.stringify({ error: `Invalid doc_type. Must be one of: ${validDocTypes.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate transaction_id if provided
    if (transactionId) {
      const { data: txData, error: txError } = await serviceClient
        .from('trade_transactions')
        .select('id')
        .eq('id', transactionId)
        .single();

      if (txError || !txData) {
        return new Response(
          JSON.stringify({ error: 'Transaction not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Validate file type
    const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(file.type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid file type. Only PDF and images are allowed.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const fileBuffer = await file.arrayBuffer();
    const fileHash = await hashFile(fileBuffer);

    const fileExtension = file.name.split('.').pop() || 'bin';
    const uniqueId = crypto.randomUUID();
    const storagePath = `${user.id}/${uniqueId}.${fileExtension}`;

    const { error: uploadError } = await serviceClient.storage
      .from('trade-documents')
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Failed to upload file to storage' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: urlData } = serviceClient.storage
      .from('trade-documents')
      .getPublicUrl(storagePath);

    const insertData: Record<string, unknown> = {
      owner_id: user.id,
      doc_type: docType,
      doc_number: docNumber,
      file_url: urlData.publicUrl,
      hash: fileHash,
      issued_at: issuedAt
    };

    if (transactionId) {
      insertData.transaction_id = transactionId;
    }

    const { data: docData, error: docError } = await serviceClient
      .from('documents')
      .insert(insertData)
      .select()
      .single();

    if (docError) {
      console.error('Document insert error:', docError);
      await serviceClient.storage.from('trade-documents').remove([storagePath]);
      return new Response(
        JSON.stringify({ error: 'Failed to save document metadata' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create ISSUED ledger entry using system actor
    const { error: ledgerError } = await serviceClient
      .from('ledger_entries')
      .insert({
        document_id: docData.id,
        action: 'ISSUED',
        actor_id: await getSystemUserId(serviceClient),
        metadata: {
          doc_type: docType,
          doc_number: docNumber,
          issued_at: issuedAt,
          uploaded_by: user.id,
          transaction_id: transactionId || null
        }
      });

    if (ledgerError) {
      console.error('Ledger entry error:', ledgerError);
    }

    console.log('Document uploaded successfully:', docData.id);

    return new Response(
      JSON.stringify({ success: true, document: docData }),
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
