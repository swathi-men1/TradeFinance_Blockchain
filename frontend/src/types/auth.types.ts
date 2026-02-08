export type UserRole = 'bank' | 'corporate' | 'auditor' | 'admin';

export interface User {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    org_name: string;
    created_at: string;
}

export interface UserCreate {
    name: string;
    email: string;
    password: string;

    org_name: string;
    role: UserRole;
}

export interface UserLogin {
    email: string;
    password: string;
}

export interface Token {
    access_token: string;
    token_type: string;
}

export interface TokenData {
    user_id: number;
    email: string;
    role: UserRole;
    org_name: string;
}
