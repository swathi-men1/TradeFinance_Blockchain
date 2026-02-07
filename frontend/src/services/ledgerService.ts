import { apiClient } from './api';
import { LedgerEntry, LedgerEntryCreate } from '../types/ledger.types';

export const ledgerService = {
    getDocumentLedger: async (documentId: number): Promise<LedgerEntry[]> => {
        const response = await apiClient.get(`/ledger/documents/${documentId}`);
        return response.data;
    },

    createLedgerEntry: async (entryData: LedgerEntryCreate): Promise<LedgerEntry> => {
        const response = await apiClient.post('/ledger/entries', entryData);
        return response.data;
    },
};
