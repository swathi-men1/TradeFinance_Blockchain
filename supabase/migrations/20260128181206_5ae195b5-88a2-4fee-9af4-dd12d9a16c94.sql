-- Create ledger action enum
CREATE TYPE public.ledger_action AS ENUM (
  'ISSUED',
  'AMENDED',
  'SHIPPED',
  'RECEIVED',
  'PAID',
  'CANCELLED',
  'VERIFIED'
);

-- Create ledger_entries table (append-only, immutable)
CREATE TABLE public.ledger_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  action ledger_action NOT NULL,
  actor_id UUID NOT NULL REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for faster queries
CREATE INDEX idx_ledger_entries_document_id ON public.ledger_entries(document_id);
CREATE INDEX idx_ledger_entries_actor_id ON public.ledger_entries(actor_id);
CREATE INDEX idx_ledger_entries_created_at ON public.ledger_entries(created_at);

-- Enable Row Level Security
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view ledger entries based on document access rules
-- Corporate can see entries for their own documents
-- Bank/Auditor/Admin can see all entries
CREATE POLICY "Role-based ledger viewing"
ON public.ledger_entries
FOR SELECT
TO authenticated
USING (
  (public.get_user_role(auth.uid()) = 'corporate' AND 
   document_id IN (SELECT id FROM public.documents WHERE owner_id = auth.uid()))
  OR public.get_user_role(auth.uid()) IN ('bank', 'auditor', 'admin')
);

-- Policy: Only bank and admin can insert lifecycle events
-- Corporate gets ISSUED via edge function with service role
CREATE POLICY "Bank and admin can add ledger events"
ON public.ledger_entries
FOR INSERT
TO authenticated
WITH CHECK (
  public.get_user_role(auth.uid()) IN ('bank', 'admin')
  OR (public.get_user_role(auth.uid()) = 'auditor' AND action = 'VERIFIED')
);

-- NO UPDATE OR DELETE POLICIES - Ledger is immutable