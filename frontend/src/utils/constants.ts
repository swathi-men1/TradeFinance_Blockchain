/* Author: Abdul Samad | */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const DOCUMENT_TYPES = {
    LOC: 'LOC',
    INVOICE: 'INVOICE',
    BILL_OF_LADING: 'BILL_OF_LADING',
    PO: 'PO',
    COO: 'COO',
    INSURANCE_CERT: 'INSURANCE_CERT',
} as const;

export const ROLES = {
    BANK: 'bank',
    CORPORATE: 'corporate',
    AUDITOR: 'auditor',
    ADMIN: 'admin',
} as const;

export const LEDGER_ACTIONS = {
    ISSUED: 'ISSUED',
    AMENDED: 'AMENDED',
    SHIPPED: 'SHIPPED',
    RECEIVED: 'RECEIVED',
    PAID: 'PAID',
    CANCELLED: 'CANCELLED',
    VERIFIED: 'VERIFIED',
} as const;
