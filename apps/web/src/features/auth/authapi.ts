/**
 * Auth API
 * =========
 * API calls for authentication
 */

import apiClient from '../../shared/apiClient';
import type { LoginRequest, RegisterRequest, AuthResponse, ProfileResponse } from './authtypes';

export const authApi = {
    /**
     * Login with email/phone and password
     */
    login: async (data: LoginRequest): Promise<AuthResponse> => {
        const response = await apiClient.post<AuthResponse>('/auth/login', data);
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
};

export default authApi;
