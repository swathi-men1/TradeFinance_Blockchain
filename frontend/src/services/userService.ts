/* Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad | FRS Standard Compliance */
import { apiClient } from './api';

export interface User {
    id: number;
    name: string;
    email: string;
    role: 'bank' | 'corporate' | 'auditor' | 'admin';
    org_name: string;
    is_active: boolean;
    created_at: string;
}

export interface UserCreate {
    name: string;
    email: string;
    password: string;
    role: string;
    org_name: string;
}

export interface UserUpdate {
    name?: string;
    email?: string;
    password?: string;
    role?: string;
    org_name?: string;
}

export const userService = {
    getUsers: async (): Promise<User[]> => {
        const response = await apiClient.get('/admin/users');
        return response.data;
    },

    getPendingUsers: async (): Promise<User[]> => {
        const response = await apiClient.get('/admin/users/pending');
        return response.data;
    },

    createUser: async (user: UserCreate): Promise<User> => {
        const response = await apiClient.post('/admin/users', user);
        return response.data;
    },

    updateUser: async (id: number, user: UserUpdate): Promise<User> => {
        const response = await apiClient.put(`/admin/users/${id}`, user);
        return response.data;
    },

    approveUser: async (id: number): Promise<User> => {
        const response = await apiClient.post(`/admin/users/${id}/approve`);
        return response.data;
    },

    rejectUser: async (id: number): Promise<void> => {
        await apiClient.post(`/admin/users/${id}/reject`);
    },

    deleteUser: async (id: number): Promise<void> => {
        await apiClient.delete(`/admin/users/${id}`);
    }
};
