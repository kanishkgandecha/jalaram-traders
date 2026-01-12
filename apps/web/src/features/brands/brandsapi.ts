/**
 * Brands API Client
 * ==================
 * API functions for brand management
 */

import { apiClient as api } from '../../shared/apiClient';

export interface Brand {
    _id: string | null;
    name: string;
    slug: string;
    logo: { url: string | null; alt: string } | null;
    description: string;
    productCount: number;
}

const brandsApi = {
    /**
     * Get all brands with product counts
     */
    async getAllBrands(): Promise<Brand[]> {
        const response = await api.get('/brands');
        return response.data.data;
    },

    /**
     * Get single brand
     */
    async getBrand(slug: string): Promise<Brand> {
        const response = await api.get(`/brands/${slug}`);
        return response.data.data;
    },

    /**
     * Upload brand logo (admin only)
     */
    async uploadLogo(brandName: string, file: File): Promise<Brand> {
        const formData = new FormData();
        formData.append('brandName', brandName);
        formData.append('logo', file);

        const response = await api.post('/brands/upload-logo', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data.data;
    },

    /**
     * Create or update brand
     */
    async upsertBrand(data: { name: string; description?: string }): Promise<Brand> {
        const response = await api.post('/brands', data);
        return response.data.data;
    },

    /**
     * Delete brand
     */
    async deleteBrand(id: string): Promise<void> {
        await api.delete(`/brands/${id}`);
    },
};

export default brandsApi;
