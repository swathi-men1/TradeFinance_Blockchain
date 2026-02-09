import { apiClient } from './api';
import { Document, DocumentUpdate } from '../types/document.types';

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

    updateDocument: async (id: number, updateData: DocumentUpdate): Promise<Document> => {
        const response = await apiClient.put(`/documents/${id}`, updateData);
        return response.data;
    },

    verifyDocument: async (id: number): Promise<any> => {
        const response = await apiClient.get(`/documents/${id}/verify`);
        return response.data;
    },

    deleteDocument: async (id: number): Promise<void> => {
        await apiClient.delete(`/documents/${id}`);
    },
};
