export type DocumentType = 'LOC' | 'INVOICE' | 'BILL_OF_LADING' | 'PO' | 'COO' | 'INSURANCE_CERT';

export interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    org_name?: string;
}

export interface Document {
    id: number;
    owner_id: number;
    owner?: User; // Optional: populated by backend sometimes
    doc_type: DocumentType;
    doc_number: string;
    file_url: string;
    hash: string;
    issued_at: string;
    created_at: string;
}

export interface DocumentCreate {
    doc_type: DocumentType;
    doc_number: string;
    issued_at: string;
}

export interface DocumentUpdate {
    doc_type?: DocumentType;
    doc_number?: string;
    issued_at?: string;
}
