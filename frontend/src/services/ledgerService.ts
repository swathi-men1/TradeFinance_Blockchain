/* Author: Abdul Samad | */
import { apiClient } from './api';
import type { LedgerEntry, LedgerEntryCreate } from '../types/ledger.types';

export const ledgerService = {
    getLedgerEntries: async (): Promise<LedgerEntry[]> => {
        const response = await apiClient.get<LedgerEntry[]>('/ledger/');
        return response.data;
    },

    getDocumentLedger: async (documentId: number): Promise<LedgerEntry[]> => {
        const response = await apiClient.get<LedgerEntry[]>(`/ledger/?document_id=${documentId}`);
        return response.data;
    },

    createLedgerEntry: async (entry: LedgerEntryCreate): Promise<LedgerEntry> => {
        const response = await apiClient.post<LedgerEntry>('/ledger/', entry);
        return response.data;
    },
};
