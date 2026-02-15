import { apiClient } from './api';
import { LedgerEntry, LedgerEntryCreate } from '../types/ledger.types';

export const ledgerService = {
    getDocumentLedger: async (documentId: number): Promise<LedgerEntry[]> => {
        const response = await apiClient.get(`/ledger/documents/${documentId}`);
        return response.data.map((entry: any) => ({
            ...entry,
            metadata: entry.entry_metadata
        }));
    },

    createLedgerEntry: async (entryData: LedgerEntryCreate): Promise<LedgerEntry> => {
        const response = await apiClient.post('/ledger/entries', {
            ...entryData,
            entry_metadata: entryData.metadata
        });
        return {
            ...response.data,
            metadata: response.data.entry_metadata
        };
    },

    getRecentActivity: async (limit: number = 10): Promise<LedgerEntry[]> => {
        const response = await apiClient.get('/ledger/activity', { params: { limit } });
        return response.data.map((entry: any) => ({
            ...entry,
            metadata: entry.entry_metadata
        }));
    },

    // New comprehensive methods for complete ledger viewing
    getAllEntries: async (): Promise<LedgerEntry[]> => {
        const response = await apiClient.get('/admin/ledger/all');
        return response.data.map((entry: any) => ({
            ...entry,
            metadata: entry.entry_metadata,
            actor_name: entry.actor?.name || 'Unknown',
            actor_role: entry.actor?.role || 'Unknown'
        }));
    },

    getDocumentTimeline: async (documentId: number): Promise<LedgerEntry[]> => {
        const response = await apiClient.get(`/admin/ledger/document/${documentId}`);
        return response.data.map((entry: any) => ({
            ...entry,
            metadata: entry.entry_metadata,
            actor_name: entry.actor?.name || 'Unknown',
            actor_role: entry.actor?.role || 'Unknown'
        }));
    },

    getUserActivity: async (userId: number): Promise<LedgerEntry[]> => {
        const response = await apiClient.get(`/admin/ledger/user/${userId}`);
        return response.data.map((entry: any) => ({
            ...entry,
            metadata: entry.entry_metadata,
            actor_name: entry.actor?.name || 'Unknown',
            actor_role: entry.actor?.role || 'Unknown'
        }));
    }
};
