/* Author: Abdul Samad | */
export type Role = 'bank' | 'corporate' | 'auditor' | 'admin';

export interface User {
    id: number;
    name: string;
    email: string;
    role: Role;
    org_name: string;
    created_at: string;
}

export interface UserCreate {
    name: string;
    email: string;
    password: string;
    role: Role;
    org_name: string;
}

export interface LoginCredentials {
    username: string;
    password: string;
}

export interface Token {
    access_token: string;
    token_type: string;
}

export interface TokenData {
    sub: string;
    role: Role;
    org_name?: string;
    exp: number;
}
