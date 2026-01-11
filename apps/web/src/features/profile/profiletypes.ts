/**
 * Profile Types
 * ==============
 * Type definitions for profile operations
 * 
 * @module features/profile/profiletypes
 */

export interface UpdateProfilePayload {
    name?: string;
    phone?: string;
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

export interface ProfileResponse {
    success: boolean;
    message: string;
    data: {
        user: import('../auth/authtypes').User;
    };
}

export interface ValidationError {
    field: string;
    message: string;
}

export interface ProfileErrorResponse {
    success: boolean;
    message: string;
    errors?: ValidationError[];
}
