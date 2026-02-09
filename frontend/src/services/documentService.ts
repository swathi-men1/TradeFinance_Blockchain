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

    downloadDocument: async (id: number): Promise<void> => {
        const response = await apiClient.get(`/documents/${id}/download`, {
            responseType: 'blob',
        });

        // Extract filename from header
        const contentDisposition = response.headers['content-disposition'];
        let filename = `document-${id}`;

        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
            if (filenameMatch && filenameMatch.length === 2) {
                filename = filenameMatch[1];
            }
        }

        // Use the blob directly from response, or create new one with specific type if needed
        // response.data is a Blob because of responseType: 'blob'
        const blob = new Blob([response.data], {
            type: response.headers['content-type']
        });

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();

        // Clean up
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(url);
    },
    viewDocument: async (id: number): Promise<void> => {
        const response = await apiClient.get(`/documents/${id}/download?inline=true`, {
            responseType: 'blob',
        });

        const blob = new Blob([response.data], {
            type: response.headers['content-type']
        });

        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');

        // Note: We cannot revoke Object URL immediately if opening in new tab, 
        // as the new tab may lose access to it. 
        // Browsers usually handle cleanup when the document is unloaded.
        setTimeout(() => window.URL.revokeObjectURL(url), 60000); // Clean up after 1 minute
    },
};
