import { apiClient } from './api';
import { Document } from '../types/document.types';

export const documentService = {
    getDocuments: async (): Promise<Document[]> => {
        const response = await apiClient.get('/documents');
        return response.data;
    },

    getDocumentById: async (id: number): Promise<Document> => {
        const response = await apiClient.get(`/documents/${id}`);
        return response.data;
    },

    uploadDocument: async (formData: FormData): Promise<Document> => {
        const response = await apiClient.post('/documents/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    verifyDocument: async (id: number): Promise<any> => {
        const response = await apiClient.get(`/documents/${id}/verify`);
        return response.data;
    },
};
