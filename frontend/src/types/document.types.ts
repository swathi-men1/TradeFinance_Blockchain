/* Author: Abdul Samad | */
export type DocumentType = 'LOC' | 'INVOICE' | 'BILL_OF_LADING' | 'PO' | 'COO' | 'INSURANCE_CERT';

export interface Document {
    id: number;
    owner_id: number;
    doc_type: DocumentType;
    doc_number: string;
    file_url: string;
    hash: string;
    issued_at: string;
    created_at: string;
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
}

export interface DocumentUpload {
    file: File;
    doc_type: DocumentType;
    doc_number: string;
    issued_at: string;
    trade_id?: number;
}

export interface HashVerificationResult {
    is_valid: boolean;
    stored_hash: string;
    current_hash: string;
}
