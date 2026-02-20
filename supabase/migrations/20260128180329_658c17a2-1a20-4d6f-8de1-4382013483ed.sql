-- Create document type enum
CREATE TYPE public.doc_type AS ENUM (
  'LOC',
  'INVOICE',
  'BILL_OF_LADING',
  'PO',
  'COO',
  'INSURANCE_CERT'
);

-- Create documents table
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doc_type doc_type NOT NULL,
  doc_number TEXT NOT NULL,
  file_url TEXT NOT NULL,
  hash TEXT NOT NULL,
  issued_at DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index on owner_id for faster queries
CREATE INDEX idx_documents_owner_id ON public.documents(owner_id);

-- Enable Row Level Security
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Policy: Corporate users can only view their own documents
CREATE POLICY "Corporate users can view own documents"
ON public.documents
FOR SELECT
TO authenticated
USING (
  (public.get_user_role(auth.uid()) = 'corporate' AND owner_id = auth.uid())
  OR public.get_user_role(auth.uid()) IN ('bank', 'auditor', 'admin')
);

-- Policy: Only corporate users can insert documents (their own)
CREATE POLICY "Corporate users can upload documents"
ON public.documents
FOR INSERT
TO authenticated
WITH CHECK (
  public.get_user_role(auth.uid()) = 'corporate' AND owner_id = auth.uid()
);

-- No UPDATE or DELETE policies - documents are immutable

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('trade-documents', 'trade-documents', false);

-- Storage policies: Only authenticated users can upload to their folder
CREATE POLICY "Users can upload to their folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'trade-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND public.get_user_role(auth.uid()) = 'corporate'
);

-- Storage policies: Users can view based on role
CREATE POLICY "Role-based document viewing"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'trade-documents'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.get_user_role(auth.uid()) IN ('bank', 'auditor', 'admin')
  )
);