import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getSystemUserId(client: ReturnType<typeof createClient>): Promise<string> {
  const { data } = await client.from('profiles').select('id').eq('name', 'System').eq('org_name', 'Internal').limit(1).single();
  return data?.id || 'unknown';
}

// Weight distribution
const WEIGHTS = {
  DOCUMENT_INTEGRITY: 0.40,
  LEDGER_ACTIVITY: 0.25,
  TRANSACTION_BEHAVIOR: 0.25,
  EXTERNAL_DATA: 0.10,
};

function categorize(score: number): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (score <= 30) return 'LOW';
  if (score <= 70) return 'MEDIUM';
  return 'HIGH';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body = await req.json();
    const { user_id, trigger = 'manual' } = body;

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user is corporate
    const { data: roleData } = await serviceClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user_id)
      .single();

    if (!roleData || roleData.role !== 'corporate') {
      return new Response(
        JSON.stringify({ message: 'Risk scores only calculated for corporate users', score: null }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Document Integrity Score (0-100, higher = more risk)
    const { data: userDocs } = await serviceClient
      .from('documents')
      .select('id')
      .eq('owner_id', user_id);

    const docIds = (userDocs || []).map(d => d.id);
    let docIntegrityScore = 0;
    let verificationFailures = 0;
    let verificationSuccesses = 0;

    if (docIds.length > 0) {
      const { data: verifications } = await serviceClient
        .from('ledger_entries')
        .select('metadata')
        .in('document_id', docIds)
        .eq('action', 'VERIFIED');

      for (const v of verifications || []) {
        const meta = v.metadata as Record<string, unknown>;
        if (meta?.verification_result === true) {
          verificationSuccesses++;
        } else {
          verificationFailures++;
        }
      }

      const totalVerifications = verificationFailures + verificationSuccesses;
      if (totalVerifications > 0) {
        docIntegrityScore = Math.round((verificationFailures / totalVerifications) * 100);
      }
    }

    // 2. Ledger Activity Score (0-100)
    let ledgerScore = 0;
    if (docIds.length > 0) {
      const { data: ledgerEntries } = await serviceClient
        .from('ledger_entries')
        .select('action')
        .in('document_id', docIds);

      const entries = ledgerEntries || [];
      const cancellations = entries.filter(e => e.action === 'CANCELLED').length;
      const amendments = entries.filter(e => e.action === 'AMENDED').length;
      const total = entries.length;

      if (total > 0) {
        const suspiciousRatio = (cancellations * 2 + amendments) / total;
        ledgerScore = Math.min(100, Math.round(suspiciousRatio * 100));
      }
    }

    // 3. Transaction Behavior Score (0-100)
    let txScore = 0;
    let disputes = 0;
    let txCancellations = 0;
    let completions = 0;

    const { data: buyerTxs } = await serviceClient
      .from('trade_transactions')
      .select('status')
      .eq('buyer_id', user_id);

    const { data: sellerTxs } = await serviceClient
      .from('trade_transactions')
      .select('status')
      .eq('seller_id', user_id);

    const allTxs = [...(buyerTxs || []), ...(sellerTxs || [])];

    for (const tx of allTxs) {
      if (tx.status === 'DISPUTED') disputes++;
      if (tx.status === 'CANCELLED') txCancellations++;
      if (tx.status === 'COMPLETED') completions++;
    }

    if (allTxs.length > 0) {
      const negativeRatio = (disputes * 3 + txCancellations * 2) / (allTxs.length * 3);
      const positiveBonus = completions / allTxs.length;
      txScore = Math.min(100, Math.max(0, Math.round((negativeRatio - positiveBonus * 0.3) * 100)));
    }

    // 4. External Data Score (placeholder - defaults to 0)
    const externalScore = 0;

    // Calculate weighted final score
    const rawScore =
      docIntegrityScore * WEIGHTS.DOCUMENT_INTEGRITY +
      ledgerScore * WEIGHTS.LEDGER_ACTIVITY +
      txScore * WEIGHTS.TRANSACTION_BEHAVIOR +
      externalScore * WEIGHTS.EXTERNAL_DATA;

    const finalScore = Math.min(100, Math.max(0, Math.round(rawScore)));
    const category = categorize(finalScore);

    // Build rationale
    const rationaleLines: string[] = [];
    rationaleLines.push(`Document Integrity: ${verificationFailures} failures, ${verificationSuccesses} successes (score: ${docIntegrityScore})`);
    rationaleLines.push(`Ledger Activity: suspicious pattern score ${ledgerScore}`);
    rationaleLines.push(`Transactions: ${disputes} disputes, ${txCancellations} cancellations, ${completions} completions (score: ${txScore})`);
    rationaleLines.push(`Trigger: ${trigger}`);
    const rationale = rationaleLines.join('; ');

    // Upsert risk score
    const { data: riskData, error: upsertError } = await serviceClient
      .from('risk_scores')
      .upsert(
        {
          user_id,
          score: finalScore,
          category,
          rationale,
          last_updated: new Date().toISOString()
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single();

    if (upsertError) {
      console.error('Risk upsert error:', upsertError);
      return new Response(
        JSON.stringify({ error: 'Failed to save risk score' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Record risk recalculation in ledger (pick first document if available)
    if (docIds.length > 0) {
      await serviceClient.from('ledger_entries').insert({
        document_id: docIds[0],
        action: 'RISK_RECALCULATED',
        actor_id: await getSystemUserId(serviceClient),
        metadata: {
          user_id,
          score: finalScore,
          category,
          trigger,
          calculated_at: new Date().toISOString()
        }
      });
    }

    console.log(`Risk calculated for ${user_id}: score=${finalScore}, category=${category}`);

    return new Response(
      JSON.stringify({ success: true, risk: riskData }),
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
