/* Author: Abdul Samad | */
import { apiClient } from './api';

export interface Trade {
    id: number;
    buyer_id: number;
    seller_id: number;
    amount: number;
    currency: string;
    status: string;
    created_at: string;
}

export const tradeService = {
    getTrades: async (): Promise<Trade[]> => {
        const response = await apiClient.get('/trade/');
        return response.data;
    },

    getTradeById: async (id: number): Promise<Trade> => {
        const response = await apiClient.get(`/trade/${id}`);
        return response.data;
    }
};
