/* Author: Abdul Samad | */
import { apiClient } from './api';
import type { UserCreate, LoginCredentials, Token, User } from '../types/auth.types';

export const authService = {
    register: async (userData: UserCreate): Promise<User> => {
        const response = await apiClient.post('/auth/register', userData);
        return response.data;
    },

    login: async (credentials: LoginCredentials): Promise<Token> => {
        // Dev Note: Using URLSearchParams to ensure application/x-www-form-urlencoded
        const params = new URLSearchParams();
        params.append('username', credentials.username);
        params.append('password', credentials.password);

        const response = await apiClient.post<Token>('/auth/token', params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        return response.data;
    },

    getCurrentUser: async (): Promise<User> => {
        const response = await apiClient.get('/auth/me');
        return response.data;
    },
};
