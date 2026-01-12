/**
 * Auth API
 * =========
 * API calls for authentication
 */

import apiClient from '../../shared/apiClient';
import type { LoginRequest, RegisterRequest, AuthResponse, ProfileResponse, GoogleLoginRequest } from './authtypes';

export const authApi = {
    /**
     * Login with email/phone and password
     */
    login: async (data: LoginRequest): Promise<AuthResponse> => {
        const response = await apiClient.post<AuthResponse>('/auth/login', data);
        return response.data;
    },

    /**
     * Login with Google OAuth
     */
    googleLogin: async (data: GoogleLoginRequest): Promise<AuthResponse> => {
        const response = await apiClient.post<AuthResponse>('/auth/google', data);
        return response.data;
    },

    /**
     * Register a new user
     */
    register: async (data: RegisterRequest): Promise<AuthResponse> => {
        const response = await apiClient.post<AuthResponse>('/auth/register', data);
        return response.data;
    },

    /**
     * Get current user profile
     */
    getProfile: async (): Promise<ProfileResponse> => {
        const response = await apiClient.get<ProfileResponse>('/auth/me');
        return response.data;
    },

    /**
     * Update user profile
     */
    updateProfile: async (data: Partial<RegisterRequest>): Promise<ProfileResponse> => {
        const response = await apiClient.put<ProfileResponse>('/auth/me', data);
        return response.data;
    },

    /**
     * Logout user
     */
    logout: async (): Promise<void> => {
        await apiClient.post('/auth/logout');
    },

    /**
     * Request password reset OTP
     */
    forgotPassword: async (identifier: string): Promise<{ success: boolean; message: string }> => {
        const response = await apiClient.post<{ success: boolean; message: string }>('/auth/forgot-password', { identifier });
        return response.data;
    },

    /**
     * Verify OTP for password reset
     */
    verifyOTP: async (identifier: string, otp: string): Promise<{ success: boolean; message: string; data?: { verified: boolean } }> => {
        const response = await apiClient.post<{ success: boolean; message: string; data?: { verified: boolean } }>('/auth/verify-otp', { identifier, otp });
        return response.data;
    },

    /**
     * Reset password after OTP verification
     */
    resetPassword: async (identifier: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
        const response = await apiClient.post<{ success: boolean; message: string }>('/auth/reset-password', { identifier, newPassword });
        return response.data;
    },
};

export default authApi;
