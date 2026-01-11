/**
 * Auth Types
 * ===========
 * Type definitions for authentication
 */

export interface User {
    _id: string;
    name: string;
    email: string;
    phone?: string; // Optional for Google auth users
    role: 'admin' | 'employee' | 'retailer' | 'farmer';
    isActive: boolean;
    profileImage?: string;
    authProvider?: 'local' | 'google';
    googleId?: string;
    businessName?: string;
    gstin?: string;
    address?: {
        street?: string;
        city?: string;
        district?: string;
        state?: string;
        pincode?: string;
    };
    creditLimit?: number;
    outstandingBalance?: number;
    createdAt: string;
    updatedAt: string;
}

export interface LoginRequest {
    identifier: string; // email or phone
    password: string;
}

export interface GoogleLoginRequest {
    idToken: string;
}

export interface RegisterRequest {
    name: string;
    email: string;
    phone: string;
    password: string;
    role?: 'retailer' | 'farmer';
    businessName?: string;
    gstin?: string;
    address?: {
        street?: string;
        city?: string;
        district?: string;
        state?: string;
        pincode?: string;
    };
}

export interface AuthResponse {
    success: boolean;
    message: string;
    data: {
        user: User;
        token: string;
    };
}

export interface ProfileResponse {
    success: boolean;
    message: string;
    data: {
        user: User;
    };
}
