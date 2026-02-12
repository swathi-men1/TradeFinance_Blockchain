import { apiClient } from './api';
import { Trade, TradeCreate, TradeStatus, TradeStatusUpdate, TradeLinkDocument } from '../types/trade.types';
import { Document } from '../types/document.types';

export const tradeService = {
    getTrades: async (): Promise<Trade[]> => {
        const response = await apiClient.get<Trade[]>('/trades');
        return response.data;
    },

    getTradeById: async (id: number): Promise<Trade> => {
        const response = await apiClient.get<Trade>(`/trades/${id}`);
        return response.data;
    },

    createTrade: async (data: TradeCreate): Promise<Trade> => {
        const response = await apiClient.post<Trade>('/trades', data);
        return response.data;
    },

    updateTrade: async (id: number, updates: Partial<Trade>): Promise<Trade> => {
        const response = await apiClient.put<Trade>(`/trades/${id}`, updates);
        return response.data;
    },

    updateTradeStatus: async (id: number, status: TradeStatus): Promise<Trade> => {
        const payload: TradeStatusUpdate = { status };
        const response = await apiClient.put<Trade>(`/trades/${id}/status`, payload);
        return response.data;
    },

    deleteTrade: async (id: number): Promise<void> => {
        await apiClient.delete(`/trades/${id}`);
    },

    linkDocumentToTrade: async (tradeId: number, documentId: number): Promise<Trade> => {
        const payload: TradeLinkDocument = { document_id: documentId };
        const response = await apiClient.post<Trade>(`/trades/${tradeId}/documents`, payload);
        return response.data;
    },

    unlinkDocumentFromTrade: async (tradeId: number, documentId: number): Promise<void> => {
        await apiClient.delete(`/trades/${tradeId}/documents/${documentId}`);
    },

    getTradeDocuments: async (tradeId: number): Promise<Document[]> => {
        const response = await apiClient.get<Document[]>(`/trades/${tradeId}/documents`);
        return response.data;
    }
};
