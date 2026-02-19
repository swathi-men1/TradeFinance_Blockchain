
import { apiClient as api } from './api';
import {
    Organization,
    User,
    AuditLog,
    SystemAnalytics,
    IntegrityAlert
} from '../types/admin.types';

export type { Organization, User, AuditLog, SystemAnalytics, IntegrityAlert, UserRole };


export const adminService = {
    // Organizations
    getOrganizations: async () => {
        const response = await api.get<Organization[]>('/admin/org/list');
        return response.data;
    },
    createOrganization: async (org: { org_name: string, status: string }) => {
        const response = await api.post<Organization>('/admin/org/create', org);
        return response.data;
    },
    updateOrganization: async (id: number, updates: { status: string }) => {
        const response = await api.put<Organization>(`/admin/org/${id}/update`, updates);
        return response.data;
    },

    // Users
    getUsers: async () => {
        const response = await api.get<User[]>('/admin/users/list');
        return response.data;
    },
    createUser: async (user: any) => {
        const response = await api.post<User>('/admin/users/create', user);
        return response.data;
    },
    updateUserRole: async (id: number, role: string) => {
        const response = await api.put<User>(`/admin/users/${id}/role`, { role });
        return response.data;
    },
    updateUser: async (id: number, userData: Partial<User>) => {
        const response = await api.put<User>(`/admin/users/${id}`, userData);
        return response.data;
    },
    activateUser: async (id: number) => {
        const response = await api.put<User>(`/admin/users/${id}/activate`);
        return response.data;
    },
    deactivateUser: async (id: number) => {
        const response = await api.put<User>(`/admin/users/${id}/deactivate`);
        return response.data;
    },
    deleteUser: async (id: number) => {
        await api.delete(`/admin/users/${id}`);
    },
    resetPassword: async (id: number): Promise<{ message: string; temp_password: string; user_id: number }> => {
        const response = await api.post(`/admin/users/${id}/reset-password`);
        return response.data;
    },

    // Audit Logs
    getAuditLogs: async (filters?: { user_id?: number, action?: string, skip?: number, limit?: number }) => {
        const response = await api.get<AuditLog[]>('/admin/audit/logs', { params: filters });
        return response.data;
    },

    // Analytics & Integrity
    getAnalytics: async () => {
        const response = await api.get<SystemAnalytics>('/admin/analytics');
        return response.data;
    },
    getIntegrityAlerts: async () => {
        const response = await api.get<IntegrityAlert[]>('/admin/integrity/alerts');
        return response.data;
    },
    getUserActivity: async (userId: number) => {
        const response = await api.get(`/admin/users/${userId}/activity`);
        return response.data;
    }
};
