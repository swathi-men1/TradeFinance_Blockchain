/* Author: Abdul Samad | */
import { apiClient } from './api';
import type { Document, DocumentUpload, HashVerificationResult } from '../types/document.types';

export const documentService = {
    getDocuments: async (): Promise<Document[]> => {
        const response = await apiClient.get('/documents/');
        return response.data;
    },

    getDocumentById: async (id: number): Promise<Document> => {
        const response = await apiClient.get(`/documents/${id}`);
        return response.data;
    },

    uploadDocument: async (upload: DocumentUpload): Promise<Document> => {
        const formData = new FormData();
        formData.append('file', upload.file);
        formData.append('doc_type', upload.doc_type);
        formData.append('doc_number', upload.doc_number);
        formData.append('issued_at', upload.issued_at);

        const response = await apiClient.post('/documents/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    verifyIntegrity: async (id: number): Promise<any> => {
        const response = await apiClient.post(`/documents/${id}/verify-integrity`);
        return response.data;
    },

    updateStatus: async (id: number, status: string): Promise<Document> => {
        const response = await apiClient.patch(`/documents/${id}/status`, { status });
        return response.data;
    },

    deleteDocument: async (id: number): Promise<void> => {
        await apiClient.delete(`/documents/${id}`);
    },
};
