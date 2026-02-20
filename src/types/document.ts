export type DocType = 'LOC' | 'INVOICE' | 'BILL_OF_LADING' | 'PO' | 'COO' | 'INSURANCE_CERT';

export interface Document {
  id: string;
  owner_id: string;
  doc_type: DocType;
  doc_number: string;
  file_url: string;
  hash: string;
  issued_at: string;
  created_at: string;
}

export const DOC_TYPE_LABELS: Record<DocType, string> = {
  LOC: 'Letter of Credit',
  INVOICE: 'Invoice',
  BILL_OF_LADING: 'Bill of Lading',
  PO: 'Purchase Order',
  COO: 'Certificate of Origin',
  INSURANCE_CERT: 'Insurance Certificate'
};
