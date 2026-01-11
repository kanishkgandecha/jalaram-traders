/**
 * Auth Store
 * ===========
 * Zustand store for authentication state
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from './authtypes';
import authApi from './authapi';

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isHydrated: boolean; // Track if store has been hydrated from localStorage
    error: string | null;

    // Actions
    login: (identifier: string, password: string) => Promise<string>; // Returns redirect URL
    googleLogin: (idToken: string) => Promise<string>; // Returns redirect URL
    register: (data: {
        name: string;
        email: string;
        phone: string;
        password: string;
        role?: 'retailer' | 'farmer';
        businessName?: string;
    }) => Promise<string>; // Returns redirect URL
    logout: () => void;
    fetchProfile: () => Promise<void>;
    updateUser: (userData: Partial<User>) => void;
    clearError: () => void;
    getDashboardRoute: () => string;
    setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            isHydrated: false,
            error: null,

            login: async (identifier: string, password: string): Promise<string> => {
                set({ isLoading: true, error: null });
                try {
                    const response = await authApi.login({ identifier, password });
                    const { user, token } = response.data;

                    // Store token in localStorage for API client
                    localStorage.setItem('token', token);

                    set({
                        user,
                        token,
                        isAuthenticated: true,
                        isLoading: false,
                    });

                    // Return role-based dashboard URL
                    return get().getDashboardRoute();
                } catch (error: any) {
                    const message = error.response?.data?.message || 'Login failed';
                    set({ error: message, isLoading: false });
                    throw new Error(message);
                }
            },

            googleLogin: async (idToken: string): Promise<string> => {
                set({ isLoading: true, error: null });
                try {
                    const response = await authApi.googleLogin({ idToken });
                    const { user, token } = response.data;

                    // Store token in localStorage for API client
                    localStorage.setItem('token', token);

                    set({
                        user,
                        token,
                        isAuthenticated: true,
                        isLoading: false,
                    });

                    // Return role-based dashboard URL
                    return get().getDashboardRoute();
                } catch (error: any) {
                    const message = error.response?.data?.message || 'Google login failed';
                    set({ error: message, isLoading: false });
                    throw new Error(message);
                }
            },

            register: async (data): Promise<string> => {
                set({ isLoading: true, error: null });
                try {
                    const response = await authApi.register(data);
                    const { user, token } = response.data;

                    localStorage.setItem('token', token);

                    set({
                        user,
                        token,
                        isAuthenticated: true,
                        isLoading: false,
                    });

                    // Return role-based dashboard URL
                    return get().getDashboardRoute();
                } catch (error: any) {
                    const message = error.response?.data?.message || 'Registration failed';
                    set({ error: message, isLoading: false });
                    throw new Error(message);
                }
            },

            logout: () => {
                localStorage.removeItem('token');
                set({
                    user: null,
                    token: null,
                    isAuthenticated: false,
                    error: null,
                });
            },

            fetchProfile: async () => {
                if (!get().token) return;

                set({ isLoading: true });
                try {
                    const response = await authApi.getProfile();
                    set({ user: response.data.user, isLoading: false });
                } catch (error) {
                    // Token might be invalid
                    get().logout();
                }
            },

            updateUser: (userData: Partial<User>) => {
                const currentUser = get().user;
                if (currentUser) {
                    set({ user: { ...currentUser, ...userData } });
                }
            },

            clearError: () => set({ error: null }),

            getDashboardRoute: (): string => {
                const user = get().user;
                if (!user) return '/login';

                switch (user.role) {
                    case 'admin':
                        return '/dashboard/admin';
                    case 'employee':
                        return '/dashboard/employee';
                    case 'retailer':
                        return '/dashboard/retailer';
                    case 'farmer':
                        return '/dashboard/farmer';
                    default:
                        return '/dashboard';
                }
            },

            setHydrated: () => set({ isHydrated: true }),
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                isAuthenticated: state.isAuthenticated,
            }),
            onRehydrateStorage: () => (state) => {
                // Mark store as hydrated when rehydration completes
                state?.setHydrated();
            },
        }
    )
);

export default useAuthStore;
