/* Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad | FRS Standard Compliance */
import { apiClient } from './api';
import { UserCreate, Token, User } from '../types/auth.types';

export const authService = {
    login: async (email: string, password: string): Promise<Token> => {
        const response = await apiClient.post('/auth/login', { email, password });
        return response.data;
    },

    register: async (userData: UserCreate): Promise<User> => {
        const response = await apiClient.post('/auth/register', userData);
        return response.data;
    },

    getCurrentUser: async (): Promise<User> => {
        const response = await apiClient.get('/auth/me');
        return response.data;
    },
};
