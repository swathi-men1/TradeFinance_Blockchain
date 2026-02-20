
-- 3. Transaction status enum
CREATE TYPE public.transaction_status AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'DISPUTED', 'CANCELLED');

-- 4. Risk category enum
CREATE TYPE public.risk_category AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- 6. Trade transactions table
CREATE TABLE public.trade_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL,
  seller_id uuid NOT NULL,
  status public.transaction_status NOT NULL DEFAULT 'OPEN',
  description text,
  amount numeric(15,2),
  currency text NOT NULL DEFAULT 'USD',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.trade_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Corporate view own transactions"
ON public.trade_transactions FOR SELECT
USING (
  (public.get_user_role(auth.uid()) = 'corporate' AND (buyer_id = auth.uid() OR seller_id = auth.uid()))
  OR public.get_user_role(auth.uid()) IN ('bank', 'auditor', 'admin')
);

CREATE POLICY "Corporate can create transactions"
ON public.trade_transactions FOR INSERT
WITH CHECK (
  public.get_user_role(auth.uid()) = 'corporate' AND (buyer_id = auth.uid() OR seller_id = auth.uid())
);

CREATE POLICY "Bank and admin can update transactions"
ON public.trade_transactions FOR UPDATE
USING (public.get_user_role(auth.uid()) IN ('bank', 'admin'));

-- 7. Link documents to transactions (nullable for backward compat)
ALTER TABLE public.documents ADD COLUMN transaction_id uuid REFERENCES public.trade_transactions(id);

-- 8. Risk scores table
CREATE TABLE public.risk_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  score integer NOT NULL DEFAULT 0,
  category public.risk_category NOT NULL DEFAULT 'LOW',
  rationale text NOT NULL DEFAULT '',
  last_updated timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.risk_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Corporate view own risk"
ON public.risk_scores FOR SELECT
USING (
  (public.get_user_role(auth.uid()) = 'corporate' AND user_id = auth.uid())
  OR public.get_user_role(auth.uid()) IN ('bank', 'auditor', 'admin')
);

-- 9. Audit logs table
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin view audit logs"
ON public.audit_logs FOR SELECT
USING (public.get_user_role(auth.uid()) = 'admin');

-- 10. Update timestamp trigger for trade_transactions
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_trade_transactions_updated_at
BEFORE UPDATE ON public.trade_transactions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
