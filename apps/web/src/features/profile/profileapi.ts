/**
 * Profile API
 * ============
 * API calls for profile operations
 * 
 * @module features/profile/profileapi
 */

import apiClient from '../../shared/apiClient';
import type { UpdateProfilePayload, ProfileResponse } from './profiletypes';

export const profileApi = {
    /**
     * Get current user's profile
     */
    getProfile: async (): Promise<ProfileResponse> => {
        const response = await apiClient.get<ProfileResponse>('/profile');
        return response.data;
    },

    /**
     * Update current user's profile
     */
    updateProfile: async (data: UpdateProfilePayload): Promise<ProfileResponse> => {
        const response = await apiClient.put<ProfileResponse>('/profile', data);
        return response.data;
    },

    /**
     * Upload profile image
     */
    uploadProfileImage: async (file: File): Promise<ProfileResponse> => {
        const formData = new FormData();
        formData.append('profileImage', file);

        const response = await apiClient.post<ProfileResponse>('/profile/image', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    /**
     * Remove profile image
     */
    removeProfileImage: async (): Promise<ProfileResponse> => {
        const response = await apiClient.delete<ProfileResponse>('/profile/image');
        return response.data;
    },
};

export default profileApi;
